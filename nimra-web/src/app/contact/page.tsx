import React, { Suspense } from 'react';
import ContactClient from './ContactClient';
import { fetchCMSData } from '../../utils/api';

export const metadata = {
  title: 'Contact Us | Wholesale Orders & Support',
  description: 'Reach out to T.S. Enterprises regarding NIMRA packaged drinking water. Find factory maps, phone numbers, email, or send us a bulk order inquiry.',
};

export default async function Page() {
  const data = await fetchCMSData();

  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: '#94a3b8' }}>
        Loading Contact Dashboard...
      </div>
    }>
      <ContactClient companyInfo={data.companyInfo} />
    </Suspense>
  );
}
