import React from 'react';
import dynamic from 'next/dynamic';
import { fetchCMSData } from '@/utils/api';

const AdminPortalClient = dynamic(() => import('@/frontend/admin/components/AdminPortalClient'), {
  loading: () => <div className="loading-state" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Loading Admin Portal...</div>
});

export const revalidate = 0; // Disable caching for the Admin Portal

export default async function AdminPage() {
  const initialCMSData = await fetchCMSData();
  
  return <AdminPortalClient initialCMSData={initialCMSData} />;
}
