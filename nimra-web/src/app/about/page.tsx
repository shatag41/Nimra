import React from 'react';
import dynamic from 'next/dynamic';
import { fetchCMSData } from '@/utils/api';
import LoadingState from '@/frontend/customer/components/LoadingState';

const AboutClient = dynamic(() => import('@/frontend/customer/components/AboutClient'), {
  loading: () => <LoadingState label="Loading about details" />
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
