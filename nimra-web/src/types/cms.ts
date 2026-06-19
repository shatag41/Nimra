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
  BrandName?: string;
  Phone?: string;
  Email?: string;
  OfficeAddress?: string;
  PlantAddress?: string;
  WhatsAppNumber?: string;
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
  userId?: string | number;
  name: string;
  mobile: string;
  altMobile?: string;
  email: string;
  flatNo: string;
  buildingName?: string;
  locality: string;
  landmark?: string;
  pincode: string;
  state: string;
  city: string;
  addressType?: 'Home' | 'Work' | 'Other';
  instructions?: string;
  saveAddress?: boolean;
  /** @deprecated use flatNo + buildingName + locality instead */
  address?: string;
}

export interface OrderSubmission {
  type: 'order';
  userId?: string | number;
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
  status: 'Pending' | 'Confirmed' | 'Processing' | 'Dispatched' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  createdAt: string;
  updatedAt?: string;
  cancellationStatus?: CancellationRequest['status'];
  cancellationRequestId?: string;
}

export interface CancellationStatusHistoryItem {
  status: 'Requested' | 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  at: string;
  by?: string;
  remarks?: string;
}

export interface CancellationRequest {
  requestId: string;
  orderId: string;
  customerName: string;
  customerMobile: string;
  customerEmail?: string;
  orderTotal: number;
  paymentMethod?: string;
  reason?: string;
  requestDate: string;
  approvalDate?: string;
  adminName?: string;
  adminRemarks?: string;
  refundStatus?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  statusHistory: CancellationStatusHistoryItem[];
}

export interface AdminUser {
  ID: string | number;
  Username: string;
  Mobile?: string;
  Password?: string;
  Role: 'Admin' | 'Manager' | 'Customer';
  Name: string;
  Active?: boolean | string;
}

export interface Notification {
  ID: string | number;
  Timestamp: string;
  Title: string;
  Message: string;
  Read?: boolean | string;
  Status?: string;
  CreatedAt?: string;
}

export interface Inquiry {
  Timestamp: string;
  Name: string;
  Email: string;
  Phone: string;
  Subject: string;
  Message: string;
}

