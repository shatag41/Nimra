'use client';

import { useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { fetchCMSData, clearCMSDataCache } from '@/utils/api';
import type { CMSData } from '@/types/cms';

export function useCMSData(initialData?: Partial<CMSData>) {
  const hasInitialData = initialData !== undefined;
  const initialBanners = initialData?.banners;
  const initialProducts = initialData?.products;
  const initialFaqs = initialData?.faqs;
  const initialCompanyInfo = initialData?.companyInfo;
  const fallbackData = useMemo(() => hasInitialData ? {
    banners: initialBanners || [],
    products: initialProducts || [],
    faqs: initialFaqs || [],
    companyInfo: initialCompanyInfo || {},
  } : undefined, [hasInitialData, initialBanners, initialProducts, initialFaqs, initialCompanyInfo]);

  const { data, error, isLoading, mutate } = useSWR('cmsData', fetchCMSData, {
    fallbackData,
    // Server-rendered routes already carry the current CMS snapshot. Avoid an
    // identical hydration request; client-only consumers still fetch normally.
    revalidateOnMount: !hasInitialData,
    revalidateOnFocus: true,
    dedupingInterval: 10000,
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

  const refreshCMSData = useCallback(async () => {
    clearCMSDataCache();
    await mutate();
  }, [mutate]);

  return { banners, products, faqs, companyInfo, loading: isLoading, error, refreshCMSData };
}
