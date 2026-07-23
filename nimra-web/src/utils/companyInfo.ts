import type { CompanyInfo } from '@/types/cms';

export const fallbackCompanyInfo: CompanyInfo = {
  BrandName: 'NIMRA',
  Phone: '+91 8888378411',
  Email: 'tsenterprises.nat@gmail.com',
  OfficeAddress: '#10, Gulistan Building, K.B. Hidayatullah Road, Camp, Pune - 411001',
  PlantAddress: 'SR No. 83/1/3/4/2, Near Jagtap Vasti, Daund, Pune, Lingali - 413801',
  WhatsAppNumber: '918888378411',
  OfficeMapEmbed: 'https://www.google.com/maps?q=Gulistan%20Building%2C%20K.B.%20Hidayatullah%20Road%2C%20Camp%2C%20Pune%20-%20411001&output=embed',
  PlantMapEmbed: 'https://www.google.com/maps?q=SR%20No.%2083%2F1%2F3%2F4%2F2%2C%20Near%20Jagtap%20Vasti%2C%20Daund%2C%20Pune%2C%20Lingali%20-%20413801&output=embed',
};

export function mergeCompanyInfo(companyInfo?: CompanyInfo | null): CompanyInfo {
  const populatedEntries = Object.entries(companyInfo || {}).filter(([, value]) =>
    value !== undefined && value !== null && String(value).trim() !== ''
  );

  return { ...fallbackCompanyInfo, ...Object.fromEntries(populatedEntries) };
}
