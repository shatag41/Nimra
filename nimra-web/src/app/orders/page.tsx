import React from 'react';
import dynamic from 'next/dynamic';
import LoadingState from '@/frontend/customer/components/LoadingState';

const OrdersClient = dynamic(() => import('@/frontend/customer/components/OrdersClient'), {
  ssr: false,
  loading: () => <LoadingState label="Loading orders" />
});

export const metadata = {
  title: 'My Orders | NIMRA',
  description: 'Track and manage your order history, view delivery status, or reorder products.',
};

export default function OrdersPage() {
  return <OrdersClient />;
}
