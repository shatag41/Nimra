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
  Category: string; // 'Packaged Drinking Water' | 'Mineral Water' | 'Bulk Water' | 'RUSH Soda' | etc.
  Volume: string; // '250ml' | '500ml' | '1L' | '2L' | '5L' | '20L Jar'
  Price: number | string;
  Description: string;
  ImageUrl: string;
  Specifications?: string;
  StockStatus?: string;
  DiscountPercent?: number | string;
  ComboPack?: string;
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
  type?: 'inquiry';
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export interface CartItem {
  productId: string;
  name: string;
  category: string;
  volume: string;
  price: number;
  imageUrl: string;
  quantity: number;
}

export interface OrderCustomer {
  name: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  instructions?: string;
}

export interface OrderSubmission {
  type: 'order';
  customer: OrderCustomer;
  items: CartItem[];
  subtotal: number;
  deliveryCharge: number;
  total: number;
  paymentMethod?: string;
  source?: 'Website' | 'Mobile App' | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderRecord extends OrderSubmission {
  orderId: string;
  status: 'Pending' | 'Confirmed' | 'Processing' | 'Out for Delivery' | 'Delivered';
  createdAt: string;
  updatedAt?: string;
}
