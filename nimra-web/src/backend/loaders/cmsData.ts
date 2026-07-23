import type { CMSData } from '@/types/cms';
import { mergeCompanyInfo } from '@/utils/companyInfo';
import { handleGet } from '@/backend/controllers/cmsController';

/** Load CMS data in-process for Server Components, without a Vercel self-fetch. */
export async function loadServerCMSData(): Promise<CMSData> {
  const response = await handleGet(new Request('http://nimra.internal/api/cms'));
  if (!response.ok) throw new Error(`CMS loader returned ${response.status}`);

  const data = await response.json() as Partial<CMSData>;
  return {
    banners: Array.isArray(data.banners) ? data.banners : [],
    products: Array.isArray(data.products) ? data.products : [],
    faqs: Array.isArray(data.faqs) ? data.faqs : [],
    companyInfo: mergeCompanyInfo(data.companyInfo),
  };
}
