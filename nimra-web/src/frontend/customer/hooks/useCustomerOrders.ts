'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { OrderRecord } from '@/types/cms';
import { fetchCustomerOrders } from '@/utils/api';
import { useAuth } from './useAuth';

const isActiveOrder = (order: OrderRecord) => !/delivered|cancelled/i.test(order.status || '');
const orderTime = (order: OrderRecord) => {
  const time = new Date(order.createdAt || '').getTime();
  return Number.isNaN(time) ? 0 : time;
};

// Client-side cache to enable instant rendering of user orders across tab changes/nav
let ordersCache: { [key: string]: OrderRecord[] } = {};
let activeFetches: { [key: string]: Promise<OrderRecord[]> | null } = {};

export const clearCustomerOrdersCache = (userId?: string | number) => {
  if (userId) {
    delete ordersCache[String(userId)];
  } else {
    ordersCache = {};
  }
};

export function useCustomerOrders() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const cacheKey = user?.ID ? String(user.ID) : (user?.Username || '');

  // Pre-fill state from cache for instant navigation/loading
  useEffect(() => {
    if (isAuthenticated && cacheKey && ordersCache[cacheKey]) {
      setOrders(ordersCache[cacheKey]);
      setLoadingOrders(false);
    }
  }, [isAuthenticated, cacheKey]);

  const loadOrders = useCallback(async (forceRefetch = false) => {
    if (!isAuthenticated || !user) {
      setLoadingOrders(false);
      return;
    }

    const key = cacheKey;
    if (!key) return;

    if (!forceRefetch && ordersCache[key]) {
      setOrders(ordersCache[key]);
      setLoadingOrders(false);
      return;
    }

    setLoadingOrders(true);
    try {
      let fetchPromise = activeFetches[key];
      if (forceRefetch || !fetchPromise) {
        fetchPromise = fetchCustomerOrders(user.ID || '', user.Username || '', user.Mobile || '');
        activeFetches[key] = fetchPromise;
      }
      const data = await fetchPromise;
      const sortedData = [...data].sort((a, b) => {
        const activeDelta = Number(isActiveOrder(b)) - Number(isActiveOrder(a));
        return activeDelta || orderTime(b) - orderTime(a);
      });
      ordersCache[key] = sortedData;
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
