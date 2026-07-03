'use client';

import useSWR from 'swr';
import { fetchCMSData, clearCMSDataCache } from '@/utils/api';

export function useCMSData() {
  const { data, error, isLoading, mutate } = useSWR('cmsData', fetchCMSData, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  const banners = data?.banners || [];
  const products = data?.products || [];
  const faqs = data?.faqs || [];
  const companyInfo = data?.companyInfo || {
    BrandName: 'NIMRA',
    Phone: '',
    Email: '',
    OfficeAddress: '',
    PlantAddress: '',
    WhatsAppNumber: '',
  };

  const refreshCMSData = async () => {
    clearCMSDataCache();
    await mutate();
  };

  return { banners, products, faqs, companyInfo, loading: isLoading, error, refreshCMSData };
}
