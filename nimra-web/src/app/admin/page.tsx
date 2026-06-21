import React from 'react';
import dynamic from 'next/dynamic';
import { fetchCMSData } from '@/utils/api';
import LoadingState from '@/frontend/customer/components/LoadingState';

const AdminPortalClient = dynamic(() => import('@/frontend/admin/components/AdminPortalClient'), {
  loading: () => <LoadingState label="Loading admin portal" />
});

export const revalidate = 0; // Disable caching for the Admin Portal

export default async function AdminPage() {
  const initialCMSData = await fetchCMSData();
  
  return <AdminPortalClient initialCMSData={initialCMSData} />;
}
