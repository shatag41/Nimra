'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { OrderRecord } from '../types/cms';
import { fetchCustomerOrders } from '../utils/api';
import { useAuth } from './useAuth';

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
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoadingOrders(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!authLoading) {
      loadOrders();
    }
  }, [authLoading, loadOrders]);

  const metrics = useMemo(() => {
    const totalSpend = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const activeOrders = orders.filter((order) => !/delivered|cancelled/i.test(order.status)).length;
    const deliveredOrders = orders.filter((order) => /delivered/i.test(order.status)).length;
    const latestOrder = orders[0];
    return { totalSpend, activeOrders, deliveredOrders, latestOrder };
  }, [orders]);

  return {
    orders,
    loadingOrders,
    metrics,
    refreshOrders: loadOrders,
  };
}
