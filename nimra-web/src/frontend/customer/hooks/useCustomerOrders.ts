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
const cacheGenerations: { [key: string]: number } = {};
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

const readOrdersCache = (key: string) => {
  if (ordersCache[key] || typeof window === 'undefined') return ordersCache[key] || [];
  try {
    const stored = sessionStorage.getItem(storageKey(key));
    if (!stored) return [];
    const parsed = JSON.parse(stored) as { orders?: OrderRecord[]; cachedAt?: number };
    ordersCache[key] = Array.isArray(parsed.orders) ? parsed.orders : [];
    cacheTimes[key] = Number(parsed.cachedAt || 0);
  } catch {
    sessionStorage.removeItem(storageKey(key));
  }
  return ordersCache[key] || [];
};

export const primeCustomerOrderCache = (order: OrderRecord, keys: Array<string | number | undefined | null>) => {
  const usableKeys = Array.from(new Set(keys.map((key) => String(key || '').trim()).filter(Boolean)));
  usableKeys.forEach((key) => {
    writeOrdersCache(key, mergeOrders(readOrdersCache(key), [order]));
  });
};

export const replaceCustomerOrdersCache = (orders: OrderRecord[], keys: Array<string | number | undefined | null>) => {
  const usableKeys = Array.from(new Set(keys.map((key) => String(key || '').trim()).filter(Boolean)));
  usableKeys.forEach((key) => writeOrdersCache(key, orders));
};

export const clearCustomerOrdersCache = (userId?: string | number) => {
  if (userId) {
    const key = String(userId);
    delete ordersCache[key];
    delete cacheTimes[key];
    activeFetches[key] = null;
    cacheGenerations[key] = (cacheGenerations[key] || 0) + 1;
    if (typeof window !== 'undefined') sessionStorage.removeItem(storageKey(key));
  } else {
    Object.keys(activeFetches).forEach((key) => {
      activeFetches[key] = null;
      cacheGenerations[key] = (cacheGenerations[key] || 0) + 1;
    });
    ordersCache = {};
    cacheTimes = {};
  }
};

export function useCustomerOrders() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const userId = user?.ID || '';
  const userName = user?.Name || '';
  const userEmail = user?.Username || '';
  const userMobile = user?.Mobile || '';
  const userAltMobile = user?.AlternateMobile || '';
  const userSavedAddresses = user?.SavedAddresses || '';
  const cacheKey = userId ? String(userId) : userEmail;
  const enrichOrdersForUser = useCallback((sourceOrders: OrderRecord[]) => (
    sourceOrders.map((order) => enrichOrderCustomer(order, user))
  ), [userId, userName, userEmail, userMobile, userAltMobile, userSavedAddresses]);

  // Pre-fill state from cache for instant navigation/loading
  useEffect(() => {
    if (!isAuthenticated || !cacheKey) return;
    readOrdersCache(cacheKey);
    if (ordersCache[cacheKey]) {
      queueMicrotask(() => {
        setOrders(enrichOrdersForUser(ordersCache[cacheKey]));
        setLoadingOrders(false);
      });
    }
  }, [isAuthenticated, cacheKey, enrichOrdersForUser]);

  const loadOrders = useCallback(async (forceRefetch = false) => {
    if (!isAuthenticated || (!userId && !userEmail && !userMobile)) {
      setLoadingOrders(false);
      return;
    }

    const key = cacheKey;
    if (!key) return;

    const cacheIsFresh = Boolean(cacheTimes[key] && Date.now() - cacheTimes[key] < CACHE_TTL);
    if (!forceRefetch && cacheIsFresh) {
      // Cached/backend orders intentionally contain only user/address references.
      // Always resolve those references against the current profile before display.
      setOrders(enrichOrdersForUser(ordersCache[key]));
      setLoadingOrders(false);
      return;
    }

    if (!ordersCache[key]) setLoadingOrders(true);
    const cacheGeneration = cacheGenerations[key] || 0;
    let fetchPromise: Promise<OrderRecord[]> | null = null;
    try {
      fetchPromise = activeFetches[key];
      if (forceRefetch || !fetchPromise) {
        fetchPromise = fetchCustomerOrders(userId || '', userEmail || '', userMobile || '').then(async (customerOrders) => {
          const needsCatalog = customerOrders.some((order) => (order.items || []).some((item) =>
            !Number(item.price || 0) || !item.imageUrl || !item.category || !item.volume
          ));

          if (!needsCatalog) return enrichOrdersForUser(customerOrders);

          const products = await fetchProducts();
          return customerOrders.map((order) => ({
            ...enrichOrdersForUser([order])[0],
            items: hydrateCartItemsFromCatalog(order.items || [], products),
          }));
        });
        activeFetches[key] = fetchPromise;
      }
      const data = await fetchPromise;
      if ((cacheGenerations[key] || 0) !== cacheGeneration) return;
      const sortedData = sortOrders(enrichOrdersForUser(data));
      writeOrdersCache(key, sortedData);
      setOrders(sortedData);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      if (activeFetches[key] === fetchPromise) activeFetches[key] = null;
      setLoadingOrders(false);
    }
  }, [isAuthenticated, userId, userEmail, userMobile, cacheKey, enrichOrdersForUser]);

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
        setOrders(enrichOrdersForUser(ordersCache[cacheKey]));
        setLoadingOrders(false);
      }
    };
    window.addEventListener('nimra-orders-cache-updated', handleCacheUpdate);
    return () => window.removeEventListener('nimra-orders-cache-updated', handleCacheUpdate);
  }, [cacheKey, enrichOrdersForUser]);

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
