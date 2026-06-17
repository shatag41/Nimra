import React from 'react';
import dynamic from 'next/dynamic';
import { fetchCMSData } from '@/utils/api';

const ProductsClient = dynamic(() => import('@/frontend/customer/components/ProductsClient'), {
  loading: () => <div className="loading-state" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Loading Products...</div>
});

export const metadata = {
  title: 'Our Products | Packs & Capacities',
  description: 'Browse the catalog of NIMRA packaged drinking water products. From pocket-friendly 250ml bottles to family size 2L and office 20L jars.',
};

export default async function Page() {
  const data = await fetchCMSData();

  return (
    <ProductsClient products={data.products} />
  );
}
