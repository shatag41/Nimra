import React from 'react';
import dynamic from 'next/dynamic';
import { fetchCMSData } from '@/utils/api';

const AboutClient = dynamic(() => import('@/frontend/customer/components/AboutClient'), {
  loading: () => <div className="loading-state" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Loading About details...</div>
});

export const metadata = {
  title: 'About NIMRA | 10-Step Pure Hydration',
  description: 'Discover the pure mineral balance philosophy of NIMRA water. Sourced responsibly and filtered through an advanced 10-step process in our state-of-the-art Daund facility.',
};

export default async function Page() {
  const data = await fetchCMSData();

  return (
    <AboutClient companyInfo={data.companyInfo} />
  );
}
