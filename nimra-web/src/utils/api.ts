import { CMSData, InquirySubmission, OrderRecord, OrderSubmission, AdminUser, Notification, Inquiry, Product, Banner, FAQ, CompanyInfo } from '../types/cms';
import type { User } from '../context/AuthContext';

export type AuthRequest =
  | { type: 'login'; username: string; password: string }
  | { type: 'register'; user: { Name: string; Username?: string; Mobile?: string; Password: string; Role?: string } }
  | { type: 'googleSignIn'; email: string; name: string; role?: string }
  | { type: 'requestOTP'; email: string }
  | { type: 'resetPassword'; email: string; otp: string; newPassword: string };

export type AuthResponse = {
  success: boolean;
  message?: string;
  user?: User;
  orderId?: string;
  [key: string]: unknown;
};

// Mock Data representing NIMRA brand details, products, banners, and FAQs
export const mockCMSData: CMSData = {
  banners: [
    {
      ID: 1,
      Title: "Pure Hydration. Healthy Living.",
      Subtitle: "NIMRA Packaged Drinking Water keeps you fresh and energized through every moment of the day.",
      ImageUrl: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&q=80&w=1200",
      ButtonText: "Explore Products",
      ButtonLink: "#products",
      Active: true
    },
    {
      ID: 2,
      Title: "Mineral Balanced Purity",
      Subtitle: "Sourced responsibly and purified through a rigorous 10-step process for absolute safety.",
      ImageUrl: "https://images.unsplash.com/photo-1559839914-17aae19cec71?auto=format&fit=crop&q=80&w=1200",
      ButtonText: "Our Quality Standards",
      ButtonLink: "/quality",
      Active: true
    }
  ],
  products: [
    {
      ID: 1,
      Name: "NIMRA 250ml Bottle",
      Category: "Packaged Water",
      Volume: "250ml",
      Price: "6.00",
      Description: "Perfect pocket-sized pure drinking water for short trips, conferences, and quick refreshments.",
      ImageUrl: "https://images.unsplash.com/photo-1616166330003-8e550d199b26?auto=format&fit=crop&q=80&w=600",
      Active: true
    },
    {
      ID: 2,
      Name: "NIMRA 500ml Bottle",
      Category: "Packaged Water",
      Volume: "500ml",
      Price: "10.00",
      Description: "Your convenient hydration companion for daily commutes, gyms, and office desks.",
      ImageUrl: "https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&q=80&w=600",
      Active: true
    },
    {
      ID: 3,
      Name: "NIMRA 1 Litre Bottle",
      Category: "Packaged Water",
      Volume: "1L",
      Price: "20.00",
      Description: "Standard 1 Litre bottle for absolute pure hydration at home, dining, or long travel.",
      ImageUrl: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&q=80&w=600",
      Active: true
    },
    {
      ID: 4,
      Name: "NIMRA 2 Litre Bottle",
      Category: "Packaged Water",
      Volume: "2L",
      Price: "30.00",
      Description: "Bigger size for family picnics and long journeys. Keep clean water accessible for all.",
      ImageUrl: "https://images.unsplash.com/photo-1563822249548-9a72b6353cd1?auto=format&fit=crop&q=80&w=600",
      Active: true
    },
    {
      ID: 5,
      Name: "NIMRA 5 Litre Can",
      Category: "Bulk Water",
      Volume: "5L",
      Price: "55.00",
      Description: "Family-sized purified water can for home kitchens, travel groups, and small gatherings.",
      ImageUrl: "https://images.unsplash.com/photo-1527109011752-2d34ff6a28d6?auto=format&fit=crop&q=80&w=600",
      Specifications: "RO purified, mineral balanced, recyclable food-grade pack",
      Active: true
    },
    {
      ID: 6,
      Name: "NIMRA 20 Litre Dispenser Jar",
      Category: "Bulk Water",
      Volume: "20L Jar",
      Price: "80.00",
      Description: "Eco-friendly bulk jar for continuous hydration at office spaces and household kitchen units.",
      ImageUrl: "https://images.unsplash.com/photo-1589135790587-8d77d70cfd00?auto=format&fit=crop&q=80&w=600",
      Specifications: "Returnable jar, dispenser compatible, scheduled delivery available",
      Active: true
    },
    {
      ID: 7,
      Name: "RUSH Club Soda 500ml",
      Category: "Upcoming RUSH Soda",
      Volume: "500ml",
      Price: "25.00",
      Description: "Upcoming extra-fizzy RUSH soda made on NIMRA's purified water base.",
      ImageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=600",
      Specifications: "Coming soon, carbonated beverage, launch stock managed from Sheets",
      StockStatus: "Coming Soon",
      Active: true
    }
  ],
  faqs: [
    {
      ID: 1,
      Question: "What makes NIMRA Packaged Drinking Water pure?",
      Answer: "NIMRA water goes through a advanced 10-step purification process, including sand filtration, carbon filtration, reverse osmosis (RO), mineral enrichment (including magnesium and potassium), and final UV & Ozonation sterilization.",
      Active: true
    },
    {
      ID: 2,
      Question: "Where is NIMRA water manufactured?",
      Answer: "NIMRA water is manufactured at our state-of-the-art packaging plant located at SR No. 83/1/3/4/2, Near Jagtap Vasti, Daund, Pune, Lingali - 413801. Our facility complies with all Bureau of Indian Standards (BIS) and FSSAI hygiene norms.",
      Active: true
    },
    {
      ID: 3,
      Question: "Can I place bulk orders for corporate events or weddings?",
      Answer: "Yes! We specialize in bulk corporate orders. You can fill out our inquiry form or contact us directly at +91 8888378411 to arrange scheduled deliveries of 20L jars or smaller individual bottle sizes.",
      Active: true
    },
    {
      ID: 4,
      Question: "Is there a delivery fee for corporate jars?",
      Answer: "Delivery charges vary based on distance, quantity, and scheduled frequency. For Camp (Pune) and Daund (Lingali) surrounding regions, we offer free shipping on minimum bulk orders.",
      Active: true
    }
  ],
  companyInfo: {
    BrandName: "NIMRA",
    Phone: "+91 8888378411",
    Email: "tsenterprises.nat@gmail.com",
    OfficeAddress: "#10, Gulistan Building, K.B. Hidayatullah Road, Camp, Pune – 411001",
    PlantAddress: "SR No. 83/1/3/4/2, Near Jagtap Vasti, Daund, Pune, Lingali – 413801",
    WhatsAppNumber: "918888378411",
    OfficeMapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3783.3986064563814!2d73.8821966759132!3d18.510931269472713!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc2c1ee354a72d7%3A0xe54eefcaef17b9b1!2sGulistan%20Building!5e0!3m2!1sen!2sin!4v1717961234567!5m2!1sen!2sin",
    PlantMapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3785.807890123456!2d74.5801234567891!3d18.4601234567891!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTjCsDI3JzM2LjQiTiA3NCszNCc0OC40IkU!5e0!3m2!1sen!2sin!4v1717961298765!5m2!1sen!2sin",
    AboutStory: "At NIMRA, we believe that pure drinking water is the cornerstone of robust health and energetic living. Founded under T.S. Enterprises, NIMRA has committed itself to raising the standard of hydration. By merging nature's finest water sources with high-end, advanced purification technologies, we ensure that every sip of NIMRA packaged drinking water is crisp, refreshing, and filled with vital minerals.",
    QualityText: "Quality is not just a checklist at NIMRA; it is our philosophy. Our state-of-the-art testing labs run strict controls every hour. The water undergoes dual carbon filtration, high-pressure reverse osmosis membranes, mineral configuration balancing, and double sterilization through UV and ozone barriers to keep the water completely sterile, clean, and delicious.",
    InfrastructureText: "Our Daund (Lingali) manufacturing plant represents the pinnacle of modern beverage packaging technology. Spanning several acres, the facility features fully automated bottle blow-moulding, touch-free filling lines, strict HEPA-filtered clean room environments, and rapid logistics storage to pack and dispatch thousands of cases daily with absolute cleanliness."
  }
};

// Internal proxy URL - avoids CORS/redirect issues with Google Apps Script
const getProxyUrl = (): string => {
  // In browser use relative path; in SSR (server components) use absolute localhost URL
  if (typeof window !== 'undefined') {
    return '/api/cms';
  }
  // Server-side: use localhost (Next.js dev) or the VERCEL_URL in production
  const base = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';
  return `${base}/api/cms`;
};

const hasAppsScriptConfigured = (): boolean => {
  return Boolean(process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || process.env.EXPO_PUBLIC_APPS_SCRIPT_URL);
};

const readJsonResponse = async <T>(res: Response, fallback: T): Promise<T> => {
  const text = await res.text();
  const trimmed = text.trim();

  if (!res.ok || !trimmed || trimmed.startsWith('<')) {
    return fallback;
  }

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    return fallback;
  }
};

// Compatibility wrapper used by auth pages.
export const sendRequest = async (payload: AuthRequest): Promise<AuthResponse> => {
  const res = await fetch('/api/cms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    return {
      success: false,
      message: data.message || data.error || 'Request failed.',
    };
  }

  return data as AuthResponse;
};

// Fetch CMS Data via internal proxy
export const fetchCMSData = async (): Promise<CMSData> => {
  if (!hasAppsScriptConfigured()) {
    console.log('No NEXT_PUBLIC_APPS_SCRIPT_URL configured. Using NIMRA offline Mock CMS.');
    return mockCMSData;
  }

  try {
    const res = await fetch(getProxyUrl(), {
      method: 'GET',
      cache: 'no-store', // Always fetch fresh data so new products display instantly
    });
    if (!res.ok) throw new Error(`CMS proxy returned ${res.status}`);
    const data = await res.json();

    if (data.error) throw new Error(data.error);

    // Merge with mock data as fallback for missing fields
    return {
      banners: data.banners && data.banners.length > 0 ? data.banners : mockCMSData.banners,
      products: data.products && data.products.length > 0 ? data.products : mockCMSData.products,
      faqs: data.faqs && data.faqs.length > 0 ? data.faqs : mockCMSData.faqs,
      companyInfo: { ...mockCMSData.companyInfo, ...data.companyInfo },
    };
  } catch (err) {
    console.warn('Error loading CMS data. Falling back to mock data.', err);
    return mockCMSData;
  }
};

// Submit Inquiry via internal proxy to Google Sheets
export const submitInquiry = async (inquiry: InquirySubmission): Promise<{ success: boolean; message: string }> => {
  console.log('API Utility: submitInquiry called with payload:', inquiry);
  try {
    const res = await fetch('/api/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...inquiry, type: 'inquiry' }),
    });
    const result = await res.json();
    console.log('API Utility: submitInquiry server response:', result);
    if (!res.ok || !result.success) {
      return {
        success: false,
        message: result.message || result.error || `Failed to submit inquiry. Please try again later.`,
      };
    }
    return {
      success: true,
      message: result.message || 'Inquiry submitted successfully!',
    };
  } catch (err) {
    console.error('API Utility: Error submitting inquiry:', err);
    return { success: false, message: 'Failed to submit inquiry. Please try again later.' };
  }
};

export const submitOrder = async (order: OrderSubmission): Promise<{ success: boolean; message: string; orderId?: string }> => {
  const payload: OrderSubmission = {
    ...order,
    paymentMethod: order.paymentMethod || 'Cash on Delivery',
    source: order.source || 'Website',
  };

  console.log('API Utility: submitOrder called. Payload:', payload);

  try {
    const res = await fetch('/api/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    console.log('API Utility: submitOrder server response:', result);
    if (!res.ok || !result.success) {
      return {
        success: false,
        message: result.message || result.error || 'Failed to place order. Please try again later.',
      };
    }
    return {
      success: true,
      message: 'Order placed successfully',
      orderId: result.orderId,
    };
  } catch (err) {
    console.error('Error placing order:', err);
    return { success: false, message: 'Failed to place order. Please try again later.' };
  }
};

export const trackOrder = async (
  orderId: string,
  mobile: string
): Promise<{ success: boolean; message?: string; order?: OrderRecord }> => {
  try {
    const params = new URLSearchParams({ action: 'trackOrder', orderId, mobile });
    const res = await fetch(`/api/cms?${params.toString()}`, { method: 'GET' });
    const result = await res.json();
    if (!res.ok || !result.success) {
      return { success: false, message: result.message || result.error || 'Order not found.' };
    }
    return { success: true, order: result.order };
  } catch (err) {
    console.error('Error tracking order:', err);
    return { success: false, message: 'Unable to track order right now.' };
  }
};

// Admin Portal API Methods

export const fetchOrders = async (): Promise<OrderRecord[]> => {
  const res = await fetch('/api/cms?action=getOrders', { method: 'GET', cache: 'no-store' });
  const data = await readJsonResponse<{ orders?: OrderRecord[] } | OrderRecord[]>(res, []);
  return Array.isArray(data) ? data : (data.orders || []);
};

export const updateOrderStatus = async (orderId: string, status: string): Promise<{ success: boolean; message: string }> => {
  try {
    const res = await fetch('/api/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'updateOrderStatus', orderId, status }),
    });
    const data = await res.json();
    return { success: data.success, message: data.message || 'Updated status successfully' };
  } catch (err) {
    console.error('Error updating order status:', err);
    return { success: false, message: 'Failed to update order status' };
  }
};

export const fetchInquiries = async (): Promise<Inquiry[]> => {
  const res = await fetch('/api/cms?action=getInquiries', { method: 'GET', cache: 'no-store' });
  const data = await readJsonResponse<{ inquiries?: Inquiry[] } | Inquiry[]>(res, []);
  return Array.isArray(data) ? data : (data.inquiries || []);
};

export const fetchUsers = async (): Promise<AdminUser[]> => {
  const res = await fetch('/api/cms?action=getUsers', { method: 'GET', cache: 'no-store' });
  const data = await readJsonResponse<{ users?: AdminUser[] } | AdminUser[]>(res, []);
  return Array.isArray(data) ? data : (data.users || []);
};

export const saveUser = async (user: Partial<AdminUser>, action: 'create' | 'update' | 'delete'): Promise<{ success: boolean; message: string; ID?: string | number }> => {
  try {
    const res = await fetch('/api/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'userCRUD', action, user }),
    });
    const data = await res.json();
    return { success: data.success, message: data.message || 'User saved successfully', ID: data.ID };
  } catch (err) {
    console.error('Error saving user:', err);
    return { success: false, message: 'Failed to save user' };
  }
};

export const fetchNotifications = async (): Promise<Notification[]> => {
  const res = await fetch('/api/cms?action=getNotifications', { method: 'GET', cache: 'no-store' });
  const data = await readJsonResponse<{ notifications?: Notification[] } | Notification[]>(res, []);
  return Array.isArray(data) ? data : (data.notifications || []);
};

export const saveNotification = async (notification: Partial<Notification>, action: 'create' | 'update' | 'delete'): Promise<{ success: boolean; message: string; ID?: string | number }> => {
  try {
    const res = await fetch('/api/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'notificationCRUD', action, notification }),
    });
    const data = await res.json();
    return { success: data.success, message: data.message || 'Notification saved successfully', ID: data.ID };
  } catch (err) {
    console.error('Error saving notification:', err);
    return { success: false, message: 'Failed to save notification' };
  }
};

export const saveProduct = async (product: Partial<Product>, action: 'create' | 'update' | 'delete'): Promise<{ success: boolean; message: string; ID?: string | number }> => {
  try {
    const res = await fetch('/api/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'productCRUD', action, product }),
    });
    const data = await res.json();
    return { success: data.success, message: data.message || 'Product saved successfully', ID: data.ID };
  } catch (err) {
    console.error('Error saving product:', err);
    return { success: false, message: 'Failed to save product' };
  }
};

export const saveBanner = async (banner: Partial<Banner>, action: 'create' | 'update' | 'delete'): Promise<{ success: boolean; message: string; ID?: string | number }> => {
  try {
    const res = await fetch('/api/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'bannerCRUD', action, banner }),
    });
    const data = await res.json();
    return { success: data.success, message: data.message || 'Banner saved successfully', ID: data.ID };
  } catch (err) {
    console.error('Error saving banner:', err);
    return { success: false, message: 'Failed to save banner' };
  }
};

export const saveFAQ = async (faq: Partial<FAQ>, action: 'create' | 'update' | 'delete'): Promise<{ success: boolean; message: string; ID?: string | number }> => {
  try {
    const res = await fetch('/api/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'faqCRUD', action, faq }),
    });
    const data = await res.json();
    return { success: data.success, message: data.message || 'FAQ saved successfully', ID: data.ID };
  } catch (err) {
    console.error('Error saving FAQ:', err);
    return { success: false, message: 'Failed to save FAQ' };
  }
};

export const saveCompanyInfo = async (companyInfo: CompanyInfo): Promise<{ success: boolean; message: string }> => {
  try {
    const res = await fetch('/api/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'companyInfoUpdate', companyInfo }),
    });
    const data = await res.json();
    return { success: data.success, message: data.message || 'Company info saved successfully' };
  } catch (err) {
    console.error('Error saving company info:', err);
    return { success: false, message: 'Failed to save company info' };
  }
};

