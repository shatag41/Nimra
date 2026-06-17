'use client';

import { useState, useEffect } from 'react';
import { fetchCMSData } from '../utils/api';
import { Banner, Product, FAQ, CompanyInfo } from '../types/cms';

export function useCMSData() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    BrandName: 'NIMRA',
    Phone: '',
    Email: '',
    OfficeAddress: '',
    PlantAddress: '',
    WhatsAppNumber: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      try {
        const data = await fetchCMSData();
        if (active) {
          setBanners(data.banners || []);
          setProducts(data.products || []);
          setFaqs(data.faqs || []);
          if (data.companyInfo) {
            setCompanyInfo(data.companyInfo);
          }
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err : new Error('Failed to load CMS data'));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    loadData();
    return () => {
      active = false;
    };
  }, []);

  return { banners, products, faqs, companyInfo, loading, error };
}
