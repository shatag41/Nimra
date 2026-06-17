import React from 'react';
import dynamic from 'next/dynamic';
import { fetchCMSData } from '@/utils/api';

const ContactClient = dynamic(() => import('@/frontend/customer/components/ContactClient'), {
  loading: () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: '#94a3b8' }}>
      Loading Contact Dashboard...
    </div>
  )
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
