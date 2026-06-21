import React from 'react';
import dynamic from 'next/dynamic';
import LoadingState from '@/frontend/customer/components/LoadingState';

const CustomerPortalClient = dynamic(() => import('@/frontend/customer/components/CustomerPortalClient'), {
  loading: () => <LoadingState label="Loading portal" />
});

export const metadata = {
  title: 'Customer Portal | NIMRA',
  description: 'Manage your NIMRA account, orders, delivery addresses, and inquiries.',
};

export default function CustomerPortalPage() {
  return <CustomerPortalClient />;
}
