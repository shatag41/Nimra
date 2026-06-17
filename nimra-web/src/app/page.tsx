import React from 'react';
import dynamic from 'next/dynamic';
import { fetchCMSData } from '@/utils/api';

const HomeClient = dynamic(() => import('@/frontend/customer/components/HomeClient'), {
  loading: () => <div className="loading-state" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Loading Nimra Home...</div>
});

export default async function Page() {
  const data = await fetchCMSData();

  return (
    <HomeClient
      banners={data.banners}
      products={data.products}
      faqs={data.faqs}
      companyInfo={data.companyInfo}
    />
  );
}
