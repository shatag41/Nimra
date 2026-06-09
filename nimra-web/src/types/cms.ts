export interface Banner {
  ID: string | number;
  Title: string;
  Subtitle: string;
  ImageUrl: string;
  ButtonText: string;
  ButtonLink: string;
  Active?: boolean | string;
}

export interface Product {
  ID: string | number;
  Name: string;
  Category: string; // 'Packaged Water' | 'Soda' | etc.
  Volume: string; // '250ml' | '500ml' | '1L' | '2L' | '20L'
  Price: number | string;
  Description: string;
  ImageUrl: string;
  Active?: boolean | string;
}

export interface FAQ {
  ID: string | number;
  Question: string;
  Answer: string;
  Active?: boolean | string;
}

export interface CompanyInfo {
  BrandName: string;
  Phone: string;
  Email: string;
  OfficeAddress: string;
  PlantAddress: string;
  WhatsAppNumber: string;
  OfficeMapEmbed?: string;
  PlantMapEmbed?: string;
  AboutStory?: string;
  QualityText?: string;
  InfrastructureText?: string;
  [key: string]: string | undefined;
}

export interface CMSData {
  banners: Banner[];
  products: Product[];
  faqs: FAQ[];
  companyInfo: CompanyInfo;
}

export interface InquirySubmission {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}
