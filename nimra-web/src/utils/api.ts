import { CMSData, InquirySubmission, OrderRecord, OrderSubmission, AdminUser, Notification, Inquiry, Product, Banner, FAQ, CompanyInfo, CartItem, EmailPreferences } from '@/types/cms';
import type { User } from '@/frontend/customer/contexts/AuthContext';
import { isVercelBlobUrl } from '@/utils/uploadImage';

export type AuthRequest =
  | { type: 'login'; username: string; password: string }
  | { type: 'register'; user: { Name: string; Username?: string; Mobile?: string; Password: string; Role?: string } }
  | { type: 'sendRegistrationOTP'; user: { Name: string; Username: string; Mobile: string; Password: string; Role?: string } }
  | { type: 'verifyRegistrationOTP'; otp: string; user: { Name: string; Username: string; Mobile: string; Password: string; Role?: string } }
  | { type: 'createVerifiedUser'; user: { Name: string; Username: string; Mobile: string; Password: string; Role?: string } }
  | { type: 'googleSignIn'; email: string; name: string; role?: string }
  | { type: 'requestOTP'; email: string }
  | { type: 'resetPassword'; email: string; otp: string; newPassword: string }
  | { type: 'requestEmailChangeOTP'; userId: string | number; newEmail: string };

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
      ImageUrl: "banners/1782400800295-50bba580-d62b-436d-985b-87fd558d5ad8.jpg",
      ButtonText: "Explore Products",
      ButtonLink: "#products",
      Active: true
    },
    {
      ID: 2,
      Title: "Mineral Balanced Purity",
      Subtitle: "Sourced responsibly and purified through a rigorous 10-step process for absolute safety.",
      ImageUrl: "banners/1782400800918-e0be9c4d-ac54-401d-9d73-24e07c983293.jpg",
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
      ImageUrl: "products/1782400801277-e98426f2-832c-43f8-ace7-d39458d03a20.jpg",
      Active: true
    },
    {
      ID: 2,
      Name: "NIMRA 500ml Bottle",
      Category: "Packaged Water",
      Volume: "500ml",
      Price: "10.00",
      Description: "Your convenient hydration companion for daily commutes, gyms, and office desks.",
      ImageUrl: "products/1782400801994-3a7d515e-6c24-4cc9-a482-cf2a009ef4b2.jpg",
      Active: true
    },
    {
      ID: 3,
      Name: "NIMRA 1 Litre Bottle",
      Category: "Packaged Water",
      Volume: "1L",
      Price: "20.00",
      Description: "Standard 1 Litre bottle for absolute pure hydration at home, dining, or long travel.",
      ImageUrl: "products/1782400802152-3726c4f7-0b51-4d97-a3c3-f66f010b587a.jpg",
      Active: true
    },
    {
      ID: 4,
      Name: "NIMRA 2 Litre Bottle",
      Category: "Packaged Water",
      Volume: "2L",
      Price: "30.00",
      Description: "Bigger size for family picnics and long journeys. Keep clean water accessible for all.",
      ImageUrl: "products/1782400802172-f85d909c-fcaa-4e12-8b11-0f44a10b9330.jpg",
      Active: true
    },
    {
      ID: 5,
      Name: "NIMRA 5 Litre Can",
      Category: "Bulk Water",
      Volume: "5L",
      Price: "55.00",
      Description: "Family-sized purified water can for home kitchens, travel groups, and small gatherings.",
      ImageUrl: "products/1782400802419-1ee44415-75d3-4f21-bffb-670d157f256b.jpg",
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
      ImageUrl: "products/1782400803066-56eeb864-6c29-4fb4-9ccf-8426b7af3c36.jpg",
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
      ImageUrl: "products/1782400803737-8411a66e-1dd8-4c85-b614-ede6b58b0a88.jpg",
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
    OfficeMapEmbed: "https://www.google.com/maps?q=Gulistan%20Building,%20K.B.%20Hidayatullah%20Road,%20Camp,%20Pune%20-%20411001&output=embed",
    PlantMapEmbed: "https://www.google.com/maps?q=SR%20No.%2083/1/3/4/2,%20Near%20Jagtap%20Vasti,%20Daund,%20Pune,%20Lingali%20-%20413801&output=embed",
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
  const port = process.env.PORT || 3000;
  const base = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : `http://localhost:${port}`;
  return `${base}/api/cms`;
};

const hasAppsScriptConfigured = (): boolean => {
  return Boolean(process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || process.env.EXPO_PUBLIC_APPS_SCRIPT_URL);
};

const readJsonResponse = async <T>(res: Response, fallback: T): Promise<T> => {
  const text = await res.text();
  const trimmed = text.trim();

  if (!res.ok || !trimmed) {
    return fallback;
  }
  
  // Check if it's JSON before checking for <
  try {
    const parsed = JSON.parse(trimmed) as T;
    return parsed;
  } catch (jsonErr) {
    if (trimmed.startsWith('<')) {
      return fallback;
    }
    console.error('[readJsonResponse] Unknown error, returning fallback');
    return fallback;
  }
};

// Compatibility wrapper used by auth pages.
export const sendRequest = async (payload: AuthRequest): Promise<AuthResponse> => {
  try {
    if (payload.type === 'login') {
      const username = payload.username.trim();
      if (!username || !payload.password) {
        return { success: false, message: 'Enter your login ID and password.' };
      }
      if (!/^\d{10}$/.test(username) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username) && username.toLowerCase() !== 'admin') {
        return { success: false, message: 'Enter a valid mobile number or email address.' };
      }
    }

    const res = await fetch('/api/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let data: AuthResponse = { success: false, message: 'Unexpected server response.' };
    try {
      data = text ? JSON.parse(text) : data;
    } catch {
      return { success: false, message: 'Authentication service returned an invalid response.' };
    }

    if (!res.ok) {
      return {
        success: false,
        message: data.message || String(data.error || '') || 'Request failed.',
      };
    }

    if (data.success && (payload.type === 'login' || payload.type === 'googleSignIn' || payload.type === 'register' || payload.type === 'createVerifiedUser') && !data.user) {
      return { success: false, message: 'Authentication succeeded but no user session was returned.' };
    }

    return data;
  } catch (err) {
    console.error('Auth request failed:', err);
    return {
      success: false,
      message: 'Unable to reach authentication service. Please try again.',
    };
  }
};

export const clearCMSDataCache = () => {
  clientCMSCache = null;
  clientCMSCacheTime = 0;
  clientCMSRequest = null;
  serverCMSCache = null;
  serverCMSRequest = null;
  invalidateReadCache(['products', 'banners', 'faqs']);
};

let clientCMSCache: CMSData | null = null;
let clientCMSCacheTime = 0;
let clientCMSRequest: Promise<CMSData> | null = null;
let serverCMSCache: { data: CMSData; expiresAt: number } | null = null;
let serverCMSRequest: Promise<CMSData> | null = null;
const SERVER_CMS_CACHE_TTL_MS = 5 * 60 * 1000;
const CLIENT_CMS_CACHE_TTL_MS = 5 * 60 * 1000;
const READ_CACHE_TTL_MS = 15 * 1000;

const readCache = new Map<string, { value: unknown; expiresAt: number }>();
const pendingReads = new Map<string, Promise<unknown>>();

const cachedRead = async <T>(key: string, loader: () => Promise<T>, ttl = READ_CACHE_TTL_MS): Promise<T> => {
  // Server-side request caching is handled by Next.js and the dedicated CMS
  // cache below. Keeping user-scoped data here would leak it across requests.
  if (typeof window === 'undefined') return loader();

  const cached = readCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value as T;

  const pending = pendingReads.get(key);
  if (pending) return pending as Promise<T>;

  const request = loader()
    .then((value) => {
      readCache.set(key, { value, expiresAt: Date.now() + ttl });
      return value;
    })
    .finally(() => pendingReads.delete(key));
  pendingReads.set(key, request);
  return request;
};

const invalidateReadCache = (prefixes: string[]) => {
  for (const key of readCache.keys()) {
    if (prefixes.some((prefix) => key === prefix || key.startsWith(`${prefix}:`))) readCache.delete(key);
  }
};

export const clearAdminDataCache = () => {
  invalidateReadCache(['orders', 'cancellations', 'inquiries', 'users', 'admin-updates', 'customer-notification-log']);
};

const normalizeImageUrl = (url: unknown): string => {
  const value = String(url || '').trim();
  const placeholder = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  if (!value) return placeholder;
  if (isVercelBlobUrl(value)) return value;
  if (/^(https?:)/i.test(value) && !value.includes('localhost') && !value.includes('127.0.0.1')) {
    return placeholder;
  }
  if (value.includes('photo-') || value.includes('unsplash.com')) {
    return placeholder;
  }
  if (value.startsWith('/uploads/')) return value;
  if (value.startsWith('uploads/')) return `/${value}`;
  if (value.startsWith('/api/file/')) return `/uploads/${value.substring(10)}`;
  if (value.startsWith('api/file/')) return `/uploads/${value.substring(9)}`;
  if (value.startsWith('/api/uploads/')) return `/uploads/${value.substring(13)}`;
  if (value.startsWith('api/uploads/')) return `/uploads/${value.substring(12)}`;
  if (value.startsWith('/') && (value.includes('/products/') || value.includes('/banners/'))) {
    const cleaned = value.replace(/^\/?(api\/file|api\/uploads|uploads)\//, '').replace(/^\/+/, '');
    return `/uploads/${cleaned}`;
  }
  if (/^(data:|blob:)/i.test(value)) return value;
  return `/uploads/${value.replace(/^\/+/, '')}`;
};

const normalizeCMSData = (data: any): CMSData => ({
  banners: (data.banners || []).map((banner: Banner) => ({
    ...banner,
    ImageUrl: normalizeImageUrl(banner.ImageUrl),
  })),
  products: (data.products || []).map((product: Product) => ({
    ...product,
    ImageUrl: normalizeImageUrl(product.ImageUrl),
  })),
  faqs: data.faqs || [],
  companyInfo: data.companyInfo || {},
});

const isNextDynamicSignal = (err: unknown) => {
  return Boolean(
    err &&
    typeof err === 'object' &&
    'digest' in err &&
    String((err as { digest?: unknown }).digest).includes('DYNAMIC_SERVER_USAGE')
  );
};

const getLocalFallbackCMSData = async (): Promise<CMSData> => {
  if (typeof window !== 'undefined') {
    return { banners: [], products: [], faqs: [], companyInfo: {} };
  }
  const { fallbackData } = await import('@/backend/models/fallbackData');
  return normalizeCMSData(fallbackData);
};

// Fetch CMS Data via internal proxy
export const fetchCMSData = async (): Promise<CMSData> => {
  if (typeof window !== 'undefined') {
    if (clientCMSCache && Date.now() - clientCMSCacheTime < CLIENT_CMS_CACHE_TTL_MS) {
      return clientCMSCache;
    }
    if (clientCMSRequest) return clientCMSRequest;
  }

  if (typeof window === 'undefined') {
    const now = Date.now();
    if (serverCMSCache && serverCMSCache.expiresAt > now) {
      return serverCMSCache.data;
    }
    if (serverCMSRequest) {
      return serverCMSRequest;
    }
  }

  const requestCMSData = async (): Promise<CMSData> => {
  try {
    const fetchOptions: RequestInit = typeof window === 'undefined'
      ? { next: { revalidate: 300, tags: ['cms-data'] } }
      : { cache: 'no-store' };

    const url = typeof window === 'undefined'
      ? getProxyUrl()
      : getProxyUrl();

    const res = await fetch(url, {
      method: 'GET',
      ...fetchOptions,
    });
    if (!res.ok) throw new Error(`CMS proxy returned ${res.status}`);
    const data = await res.json();

    if (data.error) throw new Error(data.error);

    // Guard: only treat the response as CMS data if it actually contains
    // the expected catalog arrays. Prevents an order-confirmation response
    // (which only has success/orderId fields) from overwriting the cache
    // with an empty product list.
    const hasCMSShape = Array.isArray(data.banners) || Array.isArray(data.products);
    if (!hasCMSShape) {
      console.warn('[fetchCMSData] Response did not contain CMS arrays, skipping cache update.');
      return clientCMSCache || { banners: [], products: [], faqs: [], companyInfo: {} };
    }

    const cmsData = normalizeCMSData(data);

    if (typeof window !== 'undefined') {
      clientCMSCache = cmsData;
      clientCMSCacheTime = Date.now();
    } else {
      serverCMSCache = {
        data: cmsData,
        expiresAt: Date.now() + SERVER_CMS_CACHE_TTL_MS,
      };
    }
    return cmsData;
  } catch (err) {
    if (isNextDynamicSignal(err)) {
      throw err;
    }
    if (typeof window === 'undefined') {
      const fallbackCMSData = await getLocalFallbackCMSData();
      serverCMSCache = {
        data: fallbackCMSData,
        expiresAt: Date.now() + SERVER_CMS_CACHE_TTL_MS,
      };
      return fallbackCMSData;
    }
    console.error('Error loading CMS data.', err);
    return clientCMSCache || {
      banners: [],
      products: [],
      faqs: [],
      companyInfo: {},
    };
  }
  };

  if (typeof window === 'undefined') {
    serverCMSRequest = requestCMSData().finally(() => {
      serverCMSRequest = null;
    });
    return serverCMSRequest;
  }

  clientCMSRequest = requestCMSData().finally(() => {
    clientCMSRequest = null;
  });
  return clientCMSRequest;
};

// Submit Inquiry via internal proxy to Google Sheets
const pendingInquiryKeys = new Map<string, string>();

export const submitInquiry = async (inquiry: InquirySubmission): Promise<{ success: boolean; message: string }> => {
  const payloadKey = JSON.stringify([inquiry.customerId || '', inquiry.name, inquiry.email, inquiry.phone, inquiry.subject, inquiry.message]);
  const idempotencyKey = inquiry.idempotencyKey || pendingInquiryKeys.get(payloadKey) ||
    (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  pendingInquiryKeys.set(payloadKey, idempotencyKey);
  try {
    const res = await fetch('/api/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...inquiry, idempotencyKey, type: 'inquiry' }),
    });
    const text = await res.text();
    
    let result;
    if (!text.trim().startsWith('{')) {
      console.error('API Utility: submitInquiry received non-JSON response, response:', text);
      // Since we now have local fallback in API route, this shouldn't happen, but just in case
      return {
        success: false,
        message: 'Google Sheets backend not available. Please try again later.',
      };
    } else {
      result = JSON.parse(text);
    }
    
    if (!res.ok || !result.success) {
      return {
        success: false,
        message: result.message || result.error || `Failed to submit inquiry. Please try again later.`,
      };
    }
    pendingInquiryKeys.delete(payloadKey);
    return {
      success: true,
      message: result.message || 'Inquiry submitted successfully!',
    };
  } catch (err) {
    console.error('API Utility: Error submitting inquiry:', err);
    return { success: false, message: 'Failed to submit inquiry. Please try again later.' };
  }
};

export type SubmitOrderResult = {
  success: boolean;
  message: string;
  orderId?: string;
  orders?: OrderRecord[];
  emailSent?: boolean;
  emailError?: string;
  emailHint?: string;
};

export const submitOrder = async (order: OrderSubmission): Promise<SubmitOrderResult> => {
  const payload: OrderSubmission = {
    ...order,
    paymentMethod: order.paymentMethod || 'Cash on Delivery',
    source: order.source || 'Website',
  };

  try {
    const res = await fetch('/api/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    const text = await res.text();
    
    let result;
    if (!text.trim().startsWith('{')) {
      console.error('API Utility: submitOrder received non-JSON response, response:', text);
      return {
        success: false,
        message: 'Google Sheets backend not available. Please try again later.',
      };
    } else {
      result = JSON.parse(text);
    }
    
    if (!res.ok || !result.success) {
      return {
        success: false,
        message: result.message || result.error || 'Failed to place order. Please try again later.',
      };
    }

    // Clear client-side CMS cache so the next page load fetches fresh
    // product/banner data rather than serving a stale snapshot.
    clearCMSDataCache();
    invalidateReadCache(['orders', 'customer-orders']);

    return {
      success: true,
      message: result.message || 'Order placed successfully',
      orderId: result.orderId,
      orders: Array.isArray(result.orders) ? result.orders : undefined,
      emailSent: result.emailSent,
      emailError: result.emailError,
      emailHint: result.emailHint,
    };
  } catch (err) {
    console.error('Error placing order:', err);
    return { success: false, message: 'Failed to place order. Please try again later.' };
  }
};

export const trackOrder = async (
  orderId: string,
  mobile: string,
  scope?: { userId?: string | number; email?: string; mobile?: string }
): Promise<{ success: boolean; message?: string; order?: OrderRecord }> => {
  try {
    const params = new URLSearchParams({ action: 'trackOrder' });
    if (orderId.trim()) params.set('orderId', orderId.trim());
    if (mobile.trim()) params.set('mobile', mobile.trim());
    if (scope?.userId !== undefined && scope.userId !== null) params.set('userId', String(scope.userId));
    if (scope?.email) params.set('email', scope.email);
    if (!mobile.trim() && scope?.mobile) params.set('mobile', scope.mobile);
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
  return cachedRead('orders', async () => {
  const res = await fetch(`/api/cms?action=getOrders`, {
    method: 'GET', 
    cache: 'no-store',
    headers: {
      'Accept': 'application/json',
    },
  });
  const data = await readJsonResponse<{ orders?: OrderRecord[] } | OrderRecord[]>(res, []);
  return Array.isArray(data) ? data : (data.orders || []);
  });
};

export const fetchCustomerOrders = async (userId: string | number, email: string, mobile = ''): Promise<OrderRecord[]> => {
  const params = new URLSearchParams({ action: 'getOrders' });
  if (userId) params.set('userId', String(userId));
  if (email) params.set('email', email);
  if (mobile) params.set('mobile', mobile);
  const res = await fetch(`/api/cms?${params.toString()}`, {
    method: 'GET', 
    cache: 'no-store',
    headers: {
      'Accept': 'application/json',
    },
  });
  const data = await readJsonResponse<{ orders?: OrderRecord[] } | OrderRecord[]>(res, []);
  return Array.isArray(data) ? data : (data.orders || []);
};

export const updateOrderStatus = async (orderId: string, status: string, adminId?: string | number): Promise<{ success: boolean; message: string }> => {
  try {
    const res = await fetch('/api/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'updateOrderStatus', orderId, status, adminId }),
    });
    const data = await res.json();
    if (data.success) invalidateReadCache(['orders', 'customer-orders', 'users']);
    return { success: data.success, message: data.message || 'Updated status successfully' };
  } catch (err) {
    console.error('Error updating order status:', err);
    return { success: false, message: 'Failed to update order status' };
  }
};

export const requestOrderCancellation = async (
  orderId: string,
  reason = 'Customer requested cancellation'
): Promise<{ success: boolean; message: string }> => {
  try {
    const res = await fetch('/api/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'requestOrderCancellation', orderId, reason }),
    });
    const data = await res.json();
    if (data.success) invalidateReadCache(['orders', 'customer-orders', 'cancellations']);
    return { success: data.success, message: data.message || 'Cancellation request submitted' };
  } catch (err) {
    console.error('Error requesting cancellation:', err);
    return { success: false, message: 'Failed to submit cancellation request' };
  }
};

export const fetchCancellationRequests = async (): Promise<import('@/types/cms').CancellationRequest[]> => {
  return cachedRead('cancellations', async () => {
  const res = await fetch(`/api/cms?action=getCancellationRequests`, {
    method: 'GET',
    cache: 'no-store',
    headers: { 'Accept': 'application/json' },
  });
  const data = await readJsonResponse<{ requests?: import('@/types/cms').CancellationRequest[] } | import('@/types/cms').CancellationRequest[]>(res, []);
  return Array.isArray(data) ? data : (data.requests || []);
  });
};

export const reviewCancellationRequest = async (
  requestId: string,
  decision: 'Approved' | 'Rejected',
  adminName: string,
  adminRemarks: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const res = await fetch('/api/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'reviewCancellationRequest', requestId, decision, adminName, adminRemarks }),
    });
    const data = await res.json();
    if (data.success) invalidateReadCache(['orders', 'customer-orders', 'cancellations']);
    return { success: data.success, message: data.message || 'Cancellation request updated' };
  } catch (err) {
    console.error('Error reviewing cancellation request:', err);
    return { success: false, message: 'Failed to review cancellation request' };
  }
};

export const fetchInquiries = async (): Promise<Inquiry[]> => {
  return cachedRead('inquiries', async () => {
  const res = await fetch(`/api/cms?action=getInquiries`, {
    method: 'GET', 
    cache: 'no-store',
    headers: {
      'Accept': 'application/json',
    },
  });
  const data = await readJsonResponse<{ inquiries?: Inquiry[] } | Inquiry[]>(res, []);
  return Array.isArray(data) ? data : (data.inquiries || []);
  });
};

export const markInquiryReviewed = async (
  inquiryId: string | number,
  reviewedBy = 'Admin',
  adminId?: string | number
): Promise<{ success: boolean; message: string }> => {
  try {
    const res = await fetch('/api/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'inquiryCRUD',
        action: 'review',
        inquiryId,
        reviewedBy,
        adminId,
      }),
    });
    const data = await res.json();
    if (data.success) invalidateReadCache(['inquiries', 'admin-updates', 'users']);
    return { success: data.success, message: data.message || 'Inquiry updated' };
  } catch (err) {
    console.error('Error marking inquiry reviewed:', err);
    return { success: false, message: 'Failed to update inquiry' };
  }
};

export const fetchUsers = async (): Promise<AdminUser[]> => {
  return cachedRead('users', async () => {
  const res = await fetch(`/api/cms?action=getUsers`, {
    method: 'GET', 
    cache: 'no-store',
    headers: {
      'Accept': 'application/json',
    },
  });
  const data = await readJsonResponse<{ users?: AdminUser[] } | AdminUser[]>(res, []);
  return Array.isArray(data) ? data : (data.users || []);
  });
};

export const saveUser = async (user: Partial<AdminUser>, action: 'create' | 'update' | 'delete'): Promise<{ success: boolean; message: string; ID?: string | number }> => {
  try {
    const res = await fetch('/api/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'userCRUD', action, user }),
    });
    const data = await res.json();
    if (data.success) invalidateReadCache(['users']);
    return { success: data.success, message: data.message || 'User saved successfully', ID: data.ID };
  } catch (err) {
    console.error('Error saving user:', err);
    return { success: false, message: 'Failed to save user' };
  }
};

export const requestEmailChangeOTP = async (
  userId: string | number,
  newEmail: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const res = await fetch('/api/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'requestEmailChangeOTP', userId, newEmail }),
    });
    const data = await res.json();
    return { success: data.success, message: data.message || 'OTP requested successfully' };
  } catch (err) {
    console.error('Error requesting email change OTP:', err);
    return { success: false, message: 'Failed to request OTP' };
  }
};

const normalizeNotifications = (notifications: Notification[]) => notifications.map((notification, index) => ({
  ...notification,
  ID: notification.ID === undefined || notification.ID === null || String(notification.ID).trim() === ''
    ? notification.EventID || `missing-${index}-${notification.Timestamp || notification.CreatedAt || ''}`
    : notification.ID,
}));

export const fetchAdminUpdates = async (): Promise<Notification[]> => {
  return cachedRead('admin-updates', async () => {
  const res = await fetch(`/api/cms?action=getAdminUpdates`, {
    method: 'GET',
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  const data = await readJsonResponse<{ events?: Notification[] } | Notification[]>(res, []);
  return normalizeNotifications(Array.isArray(data) ? data : (data.events || []));
  });
};

export const fetchCustomerNotificationLog = async (): Promise<Notification[]> => {
  return cachedRead('customer-notification-log', async () => {
  const res = await fetch(`/api/cms?action=getCustomerNotificationLog`, {
    method: 'GET',
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  const data = await readJsonResponse<{ events?: Notification[] } | Notification[]>(res, []);
  return normalizeNotifications(Array.isArray(data) ? data : (data.events || []))
    .filter((notification) => notification.EventType === 'ADMIN_BROADCAST');
  });
};

export const fetchNotifications = async (userId?: string | number, email?: string): Promise<Notification[]> => {
  const params = new URLSearchParams({ action: 'getCustomerNotifications' });
  if (userId !== undefined && userId !== null) params.set('userId', String(userId));
  if (email) params.set('email', email);
  return cachedRead(`notifications:${userId || email || 'guest'}`, async () => {
  const res = await fetch(`/api/cms?${params.toString()}`, {
    method: 'GET', 
    cache: 'no-store',
    headers: {
      'Accept': 'application/json',
    },
  });
  const data = await readJsonResponse<{ notifications?: Notification[] } | Notification[]>(res, []);
  const notifications = Array.isArray(data) ? data : (data.notifications || []);
  return normalizeNotifications(notifications);
  });
};

export const saveUserAddresses = async <T>(customerId: string | number, addresses: T[]): Promise<{ success: boolean; message: string; addresses?: T[] }> => {
  try {
    const res = await fetch('/api/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'userAddresses', customerId, addresses }),
    });
    const data = await res.json();
    return {
      success: Boolean(data.success),
      message: data.message || 'Addresses saved successfully',
      addresses: Array.isArray(data.addresses) ? data.addresses : undefined,
    };
  } catch (err) {
    console.error('Error saving user addresses:', err);
    return { success: false, message: 'Failed to save addresses' };
  }
};

export const fetchProducts = async (): Promise<Product[]> => {
  return cachedRead('products', async () => {
  const res = await fetch(`/api/cms?action=getProducts`, {
    method: 'GET',
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  const data = await readJsonResponse<{ products?: Product[] } | Product[]>(res, []);
  const products = Array.isArray(data) ? data : (data.products || []);
  return products.map((product) => ({ ...product, ImageUrl: normalizeImageUrl(product.ImageUrl) }));
  }, CLIENT_CMS_CACHE_TTL_MS);
};

export const fetchBanners = async (): Promise<Banner[]> => {
  return cachedRead('banners', async () => {
  const res = await fetch(`/api/cms?action=getBanners`, {
    method: 'GET',
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  const data = await readJsonResponse<{ banners?: Banner[] } | Banner[]>(res, []);
  const banners = Array.isArray(data) ? data : (data.banners || []);
  return banners.map((banner) => ({ ...banner, ImageUrl: normalizeImageUrl(banner.ImageUrl) }));
  }, CLIENT_CMS_CACHE_TTL_MS);
};

export const fetchFAQs = async (): Promise<FAQ[]> => {
  return cachedRead('faqs', async () => {
  const res = await fetch(`/api/cms?action=getFAQs`, {
    method: 'GET',
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  const data = await readJsonResponse<{ faqs?: FAQ[] } | FAQ[]>(res, []);
  return Array.isArray(data) ? data : (data.faqs || []);
  }, CLIENT_CMS_CACHE_TTL_MS);
};

export const saveNotification = async (notification: Partial<Notification>, action: 'create' | 'update' | 'delete'): Promise<{ success: boolean; message: string; ID?: string | number }> => {
  if ((action === 'delete' || action === 'update') && (notification.ID === undefined || notification.ID === null || String(notification.ID).trim() === '')) {
    return { success: false, message: 'Notification ID is required.' };
  }

  try {
    const res = await fetch('/api/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'eventCRUD',
        action,
        event: {
          ...notification,
          EventID: notification.EventID || notification.ID,
          TargetAudience: 'CUSTOMER_NOTIFICATION',
          EventType: notification.EventType || 'ADMIN_BROADCAST',
          Role: 'Customer',
          ActionLink: '',
        },
      }),
    });
    const data = await res.json();
    if (data.success) invalidateReadCache(['notifications', 'customer-notification-log', 'admin-updates']);
    return { success: data.success, message: data.message || 'Notification saved successfully', ID: data.ID };
  } catch (err) {
    console.error('Error saving notification:', err);
    return { success: false, message: 'Failed to save notification' };
  }
};

export const saveProduct = async (
  product: Partial<Product>,
  action: 'create' | 'update' | 'delete',
  oldImagePath?: string
): Promise<{ success: boolean; message: string; ID?: string | number }> => {
  try {
    const res = await fetch('/api/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'productCRUD', action, product: { ...product, oldImagePath: oldImagePath || '' } }),
    });
    const data = await res.json();
    if (data.success) {
      clearCMSDataCache();
    }
    return { success: data.success, message: data.message || 'Product saved successfully', ID: data.ID };
  } catch (err) {
    console.error('Error saving product:', err);
    return { success: false, message: 'Failed to save product' };
  }
};

export const saveBanner = async (
  banner: Partial<Banner>,
  action: 'create' | 'update' | 'delete',
  oldImagePath?: string
): Promise<{ success: boolean; message: string; ID?: string | number }> => {
  try {
    const res = await fetch('/api/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'bannerCRUD', action, banner: { ...banner, oldImagePath: oldImagePath || '' } }),
    });
    const data = await res.json();
    if (data.success) {
      clearCMSDataCache();
    }
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
    if (data.success) clearCMSDataCache();
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
    if (data.success) clearCMSDataCache();
    return { success: data.success, message: data.message || 'Company info saved successfully' };
  } catch (err) {
    console.error('Error saving company info:', err);
    return { success: false, message: 'Failed to save company info' };
  }
};

export const syncCart = async (userId: string | number, items: CartItem[], updatedAt = new Date().toISOString()): Promise<{ success: boolean; message: string }> => {
  try {
    const res = await fetch('/api/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'cartSync', userId, items, updatedAt }),
    });
    const data = await res.json();
    return { success: data.success, message: data.message || 'Cart synced' };
  } catch (err) {
    console.error('Error syncing cart:', err);
    return { success: false, message: 'Failed to sync cart' };
  }
};

export const fetchCart = async (userId: string | number): Promise<CartItem[]> => {
  const res = await fetch('/api/cms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({ type: 'getCart', userId }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch cart');
  }
  return Array.isArray(data.items) ? data.items : [];
};

type AccountSettingsResponse = {
  success: boolean;
  message: string;
  preferences?: EmailPreferences;
  hasActiveOrders?: boolean;
  activeOrders?: Array<{ orderId: string; status: string }>;
  otpVerified?: boolean;
  expired?: boolean;
  attemptsRemaining?: number;
  confirmationEmailSent?: boolean;
};

const accountSettingsRequest = async (payload: Record<string, unknown>): Promise<AccountSettingsResponse> => {
  try {
    const res = await fetch('/api/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ type: 'accountSettings', ...payload }),
    });
    const data = await readJsonResponse<AccountSettingsResponse>(res, {
      success: false,
      message: 'Unable to process account settings.',
    });
    return data;
  } catch (err) {
    console.error('Account settings request failed:', err);
    return { success: false, message: 'Unable to connect to account settings.' };
  }
};

export const fetchEmailPreferences = (userId: string | number) =>
  cachedRead(`email-preferences:${userId}`, () => accountSettingsRequest({ action: 'getPreferences', userId }), 60 * 1000);

export const saveEmailPreferences = async (userId: string | number, preferences: EmailPreferences) => {
  const result = await accountSettingsRequest({ action: 'updatePreferences', userId, preferences });
  if (result.success) invalidateReadCache([`email-preferences:${userId}`]);
  return result;
};

export const changeAccountPassword = (
  userId: string | number,
  currentPassword: string,
  newPassword: string
) => accountSettingsRequest({ action: 'changePassword', userId, currentPassword, newPassword });

export const deleteCustomerAccount = async (userId: string | number) => {
  const result = await accountSettingsRequest({ action: 'deleteAccount', userId });
  if (result.success) invalidateReadCache(['users', 'orders', 'customer-orders', `email-preferences:${userId}`]);
  return result;
};

export const fetchAccountDeletionStatus = (userId: string | number) =>
  accountSettingsRequest({ action: 'getDeletionStatus', userId });

export const sendAccountDeletionOTP = (userId: string | number, email: string) =>
  accountSettingsRequest({ action: 'sendDeletionOTP', userId, email });

export const verifyAccountDeletionOTP = (userId: string | number, email: string, otp: string) =>
  accountSettingsRequest({ action: 'verifyDeletionOTP', userId, email, otp });
