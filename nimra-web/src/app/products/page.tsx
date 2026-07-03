import React from 'react';
import dynamicImport from 'next/dynamic';
import { fetchCMSData } from '@/utils/api';
import LoadingState from '@/frontend/customer/components/LoadingState';

const ProductsClient = dynamicImport(() => import('@/frontend/customer/components/ProductsClient'), {
  loading: () => <LoadingState label="Loading products" />
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
