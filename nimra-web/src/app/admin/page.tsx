import React from 'react';
import AdminPortalClient from './AdminPortalClient';
import { fetchCMSData } from '../../utils/api';

export const revalidate = 0; // Disable caching for the Admin Portal

export default async function AdminPage() {
  const initialCMSData = await fetchCMSData();
  
  return <AdminPortalClient initialCMSData={initialCMSData} />;
}
