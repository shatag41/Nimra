import React from 'react';
import dynamic from 'next/dynamic';

const OrdersClient = dynamic(() => import('@/frontend/customer/components/OrdersClient'), {
  loading: () => <div className="loading-state" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Loading Orders...</div>
});

export const metadata = {
  title: 'My Orders | NIMRA',
  description: 'Track and manage your order history, view delivery status, or reorder products.',
};

export default function OrdersPage() {
  return <OrdersClient />;
}
