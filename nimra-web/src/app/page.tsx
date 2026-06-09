import React from 'react';
import HomeClient from '../components/HomeClient';
import { fetchCMSData } from '../utils/api';

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
