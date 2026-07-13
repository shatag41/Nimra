import React from 'react';
import dynamic from 'next/dynamic';
import { redirect } from 'next/navigation';
import LoadingState from '@/frontend/customer/components/LoadingState';

const CustomerPortalClient = dynamic(() => import('@/frontend/customer/components/CustomerPortalClient'), {
  loading: () => <LoadingState label="Loading portal" />
});

export const metadata = {
  title: 'Customer Portal | NIMRA',
  description: 'Manage your NIMRA account, orders, delivery addresses, and inquiries.',
};

export default async function CustomerPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  if (tab === 'profile') redirect('/profile-settings');

  return <CustomerPortalClient />;
}
