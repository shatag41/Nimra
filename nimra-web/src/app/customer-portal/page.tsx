import React from 'react';
import dynamic from 'next/dynamic';

const CustomerPortalClient = dynamic(() => import('@/frontend/customer/components/CustomerPortalClient'), {
  loading: () => <div className="loading-state" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Loading Portal...</div>
});

export const metadata = {
  title: 'Customer Portal | NIMRA',
  description: 'Manage your NIMRA account, orders, delivery addresses, and inquiries.',
};

export default function CustomerPortalPage() {
  return <CustomerPortalClient />;
}
