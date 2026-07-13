'use client';

import useSWR from 'swr';
import { fetchCMSData, clearCMSDataCache } from '@/utils/api';
import type { CMSData } from '@/types/cms';

export function useCMSData(initialData?: Partial<CMSData>) {
  const fallbackData = initialData ? {
    banners: initialData.banners || [],
    products: initialData.products || [],
    faqs: initialData.faqs || [],
    companyInfo: initialData.companyInfo || {},
  } : undefined;

  const { data, error, isLoading, mutate } = useSWR('cmsData', fetchCMSData, {
    fallbackData,
    revalidateOnMount: !fallbackData,
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
