import React from 'react';
import HomeClient from '@/frontend/customer/components/HomeClient';
import { fetchCMSData } from '@/utils/api';

export const dynamic = 'force-dynamic';

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
