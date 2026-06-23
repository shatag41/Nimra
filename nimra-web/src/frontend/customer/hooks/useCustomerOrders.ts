'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { OrderRecord } from '@/types/cms';
import { fetchCustomerOrders, fetchProducts } from '@/utils/api';
import { useAuth } from './useAuth';
import { hydrateCartItemsFromCatalog } from '../utils/commerce';
import { getUserSavedAddresses } from '../utils/userAddresses';

const isActiveOrder = (order: OrderRecord) => !/delivered|cancelled/i.test(order.status || '');
const orderTime = (order: OrderRecord) => {
  const time = new Date(order.createdAt || '').getTime();
  return Number.isNaN(time) ? 0 : time;
};

// Client-side cache to enable instant rendering of user orders across tab changes/nav
let ordersCache: { [key: string]: OrderRecord[] } = {};
let cacheTimes: { [key: string]: number } = {};
const activeFetches: { [key: string]: Promise<OrderRecord[]> | null } = {};
const CACHE_TTL = 2 * 60 * 1000;
const ORDERS_CACHE_VERSION = 'v2';
const storageKey = (key: string) => `nimra-orders:${ORDERS_CACHE_VERSION}:${key}`;

const sortOrders = (orders: OrderRecord[]) =>
  [...orders].sort((a, b) => {
    const activeDelta = Number(isActiveOrder(b)) - Number(isActiveOrder(a));
    return activeDelta || orderTime(b) - orderTime(a);
  });

const mergeOrders = (existing: OrderRecord[] = [], incoming: OrderRecord[] = []) => {
  const merged = new Map<string, OrderRecord>();
  [...existing, ...incoming].forEach((order) => {
    const key = String(order.orderId || `${order.createdAt}-${order.total}`);
    const current = merged.get(key);
    merged.set(key, current ? { ...current, ...order, items: order.items?.length ? order.items : current.items } : order);
  });
  return sortOrders(Array.from(merged.values()));
};

const enrichOrderCustomer = (order: OrderRecord, user: ReturnType<typeof useAuth>['user']): OrderRecord => {
  if (!user) return order;

  const addresses = getUserSavedAddresses(user as any);
  const customer = order.customer || {};
  const topLevelSavedAddressId = (order as OrderRecord & { savedAddressId?: string }).savedAddressId;
  const savedAddressId = String(topLevelSavedAddressId || customer.savedAddressId || '').trim();
  const addressType = String(customer.addressType || '').trim().toLowerCase();
  const matchedAddress =
    addresses.find((address) => savedAddressId && String(address.id) === savedAddressId) ||
    addresses.find((address) => addressType && String(address.type).toLowerCase() === addressType) ||
    addresses.find((address) => address.isDefault) ||
    addresses[0];

  if (!matchedAddress && (customer.name || customer.mobile || customer.flatNo || customer.locality)) {
    return order;
  }

  return {
    ...order,
    customer: {
      ...customer,
      userId: customer.userId || user.ID,
      savedAddressId: customer.savedAddressId || matchedAddress?.id || savedAddressId,
      name: customer.name || matchedAddress?.name || user.Name || 'Customer',
      mobile: customer.mobile || matchedAddress?.mobile || user.Mobile || '',
      altMobile: customer.altMobile || matchedAddress?.altMobile || user.AlternateMobile || '',
      email: customer.email || matchedAddress?.email || user.Username || '',
      flatNo: customer.flatNo || matchedAddress?.flatNo || '',
      buildingName: customer.buildingName || matchedAddress?.buildingName || '',
      locality: customer.locality || matchedAddress?.locality || '',
      landmark: customer.landmark || matchedAddress?.landmark || '',
      pincode: customer.pincode || matchedAddress?.pincode || '',
      state: customer.state || matchedAddress?.state || '',
      city: customer.city || matchedAddress?.city || '',
      addressType: customer.addressType || matchedAddress?.type || 'Home',
      address: customer.address || matchedAddress?.fullAddress || [
        matchedAddress?.flatNo,
        matchedAddress?.buildingName,
        matchedAddress?.locality,
        matchedAddress?.landmark,
      ].filter(Boolean).join(', '),
      instructions: customer.instructions || matchedAddress?.instructions || '',
    },
  };
};

const writeOrdersCache = (key: string, orders: OrderRecord[]) => {
  const sorted = sortOrders(orders);
  ordersCache[key] = sorted;
  cacheTimes[key] = Date.now();
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(storageKey(key), JSON.stringify({ orders: sorted, cachedAt: cacheTimes[key] }));
    window.dispatchEvent(new CustomEvent('nimra-orders-cache-updated', { detail: { key } }));
  }
};

export const primeCustomerOrderCache = (order: OrderRecord, keys: Array<string | number | undefined | null>) => {
  const usableKeys = Array.from(new Set(keys.map((key) => String(key || '').trim()).filter(Boolean)));
  usableKeys.forEach((key) => {
    writeOrdersCache(key, mergeOrders(ordersCache[key] || [], [order]));
  });
};

export const clearCustomerOrdersCache = (userId?: string | number) => {
  if (userId) {
    delete ordersCache[String(userId)];
    delete cacheTimes[String(userId)];
    if (typeof window !== 'undefined') sessionStorage.removeItem(storageKey(String(userId)));
  } else {
    ordersCache = {};
    cacheTimes = {};
  }
};

export function useCustomerOrders() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const cacheKey = user?.ID ? String(user.ID) : (user?.Username || '');

  // Pre-fill state from cache for instant navigation/loading
  useEffect(() => {
    if (!isAuthenticated || !cacheKey) return;
    if (!ordersCache[cacheKey]) {
      try {
        const stored = sessionStorage.getItem(storageKey(cacheKey));
        if (stored) {
          const parsed = JSON.parse(stored) as { orders: OrderRecord[]; cachedAt: number };
          ordersCache[cacheKey] = parsed.orders;
          cacheTimes[cacheKey] = parsed.cachedAt;
        }
      } catch {
        sessionStorage.removeItem(storageKey(cacheKey));
      }
    }
    if (ordersCache[cacheKey]) {
      queueMicrotask(() => {
        setOrders(ordersCache[cacheKey].map((order) => enrichOrderCustomer(order, user)));
        setLoadingOrders(false);
      });
    }
  }, [isAuthenticated, cacheKey, user]);

  const loadOrders = useCallback(async (forceRefetch = false) => {
    if (!isAuthenticated || !user) {
      setLoadingOrders(false);
      return;
    }

    const key = cacheKey;
    if (!key) return;

    const cacheIsFresh = Boolean(
      ordersCache[key]?.length && Date.now() - (cacheTimes[key] || 0) < CACHE_TTL
    );
    if (!forceRefetch && cacheIsFresh) {
      setOrders(ordersCache[key]);
      setLoadingOrders(false);
      return;
    }

    if (!ordersCache[key]) setLoadingOrders(true);
    try {
      let fetchPromise = activeFetches[key];
      if (forceRefetch || !fetchPromise) {
        fetchPromise = fetchCustomerOrders(user.ID || '', user.Username || '', user.Mobile || '').then(async (customerOrders) => {
          const needsCatalog = customerOrders.some((order) => (order.items || []).some((item) =>
            !Number(item.price || 0) || !item.imageUrl || !item.category || !item.volume
          ));

          if (!needsCatalog) return customerOrders.map((order) => enrichOrderCustomer(order, user));

          const products = await fetchProducts();
          return customerOrders.map((order) => ({
            ...enrichOrderCustomer(order, user),
            items: hydrateCartItemsFromCatalog(order.items || [], products),
          }));
        });
        activeFetches[key] = fetchPromise;
      }
      const data = await fetchPromise;
      const sortedData = mergeOrders(ordersCache[key] || [], data.map((order) => enrichOrderCustomer(order, user)));
      writeOrdersCache(key, sortedData);
      setOrders(sortedData);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      activeFetches[key] = null;
      setLoadingOrders(false);
    }
  }, [isAuthenticated, user, cacheKey]);

  useEffect(() => {
    if (!authLoading) {
      queueMicrotask(() => {
        loadOrders(false);
      });
    }
  }, [authLoading, loadOrders]);

  useEffect(() => {
    if (!cacheKey || typeof window === 'undefined') return;
    const handleCacheUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ key?: string }>).detail;
      if (detail?.key && detail.key !== cacheKey) return;
      if (ordersCache[cacheKey]) {
        setOrders(ordersCache[cacheKey].map((order) => enrichOrderCustomer(order, user)));
        setLoadingOrders(false);
      }
    };
    window.addEventListener('nimra-orders-cache-updated', handleCacheUpdate);
    return () => window.removeEventListener('nimra-orders-cache-updated', handleCacheUpdate);
  }, [cacheKey, user]);

  const metrics = useMemo(() => {
    const totalSpend = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const activeOrders = orders.filter(isActiveOrder).length;
    const deliveredOrders = orders.filter((order) => /delivered/i.test(order.status)).length;
    const cancelledOrders = orders.filter((order) => /cancelled/i.test(order.status)).length;
    const latestOrder = orders[0];
    const latestCancelOrder = orders.find((order) => order.cancellationStatus || /cancelled/i.test(order.status));
    return { totalSpend, activeOrders, deliveredOrders, cancelledOrders, latestOrder, latestCancelOrder };
  }, [orders]);

  return {
    orders,
    loadingOrders,
    metrics,
    refreshOrders: () => loadOrders(true),
  };
}
