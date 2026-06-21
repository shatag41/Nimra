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

export function useCustomerOrders() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const loadOrders = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setLoadingOrders(false);
      return;
    }
    setLoadingOrders(true);
    try {
      const data = await fetchCustomerOrders(user.ID || '', user.Username || '');
      setOrders([...data].sort((a, b) => {
        const activeDelta = Number(isActiveOrder(b)) - Number(isActiveOrder(a));
        return activeDelta || orderTime(b) - orderTime(a);
      }));
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoadingOrders(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!authLoading) {
      queueMicrotask(() => {
        loadOrders();
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
    refreshOrders: loadOrders,
  };
}
