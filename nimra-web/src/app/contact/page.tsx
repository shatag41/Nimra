import React from 'react';
import dynamic from 'next/dynamic';
import { fetchCMSData } from '@/utils/api';
import LoadingState from '@/frontend/customer/components/LoadingState';

const ContactClient = dynamic(() => import('@/frontend/customer/components/ContactClient'), {
  loading: () => <LoadingState label="Loading contact dashboard" />
});

export const metadata = {
  title: 'Contact Us | Wholesale Orders & Support',
  description: 'Reach out to T.S. Enterprises regarding NIMRA packaged drinking water. Find factory maps, phone numbers, email, or send us a bulk order inquiry.',
};

export default async function Page() {
  const data = await fetchCMSData();

  return (
    <ContactClient companyInfo={data.companyInfo} />
  );
}
