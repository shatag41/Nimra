import { CMSData, InquirySubmission, OrderRecord, OrderSubmission, AdminUser, Notification, Inquiry, Product, Banner, FAQ, CompanyInfo, CartItem, CancellationRequest } from '../types/cms';
import type { User } from '../context/AuthContext';

export const mockCMSData: CMSData = {
  banners: [
    {
      ID: 1,
      Title: "Pure Hydration. Healthy Living.",
      Subtitle: "NIMRA Packaged Drinking Water keeps you fresh and energized through every moment of the day.",
      ImageUrl: "banners/1782400800295-50bba580-d62b-436d-985b-87fd558d5ad8.jpg",
      ButtonText: "Explore Products",
      ButtonLink: "Products",
      Active: true
    },
    {
      ID: 2,
      Title: "Mineral Balanced Purity",
      Subtitle: "Sourced responsibly and purified through a rigorous 10-step process for absolute safety.",
      ImageUrl: "banners/1782400800918-e0be9c4d-ac54-401d-9d73-24e07c983293.jpg",
      ButtonText: "About Us",
      ButtonLink: "About",
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
      ImageUrl: "products/1782329242490-268de049-2e73-4714-a10f-58aa02c0f04b.jpg",
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
      Name: "NIMRA 20 Litre Dispenser Jar",
      Category: "Packaged Water",
      Volume: "20L",
      Price: "80.00",
      Description: "Eco-friendly bulk jar for continuous hydration at office spaces and household kitchen units.",
      ImageUrl: "products/1782500196505-68560521-c665-4639-8f60-f18b1b672dc3.png",
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

const getAPIUrl = (): string => {
  return process.env.EXPO_PUBLIC_APPS_SCRIPT_URL || '';
};

const getBackendUrl = (): string => (process.env.EXPO_PUBLIC_BACKEND_URL || '').replace(/\/+$/, '');

const getBackendImageUrl = (value: unknown): string => {
  const backendUrl = getBackendUrl();
  const raw = String(value || '').trim().replace(/\\/g, '/');
  if (!backendUrl || !raw || /^(?:https?:|data:|blob:)/i.test(raw)) return '';
  const storagePath = raw.split(/[?#]/, 1)[0]
    .replace(/^\/+/, '')
    .replace(/^(?:api\/file|api\/uploads|uploads)\//i, '');
  if (!/^(?:products|banners)\/[^/]+\.(?:jpe?g|png|webp|gif)$/i.test(storagePath) || storagePath.includes('..')) return '';
  return `${backendUrl}/uploads/${storagePath.split('/').map(encodeURIComponent).join('/')}`;
};

export type AuthRequest =
  | { type: 'login'; username: string; password: string }
  | { type: 'register'; user: { Name: string; Username?: string; Mobile?: string; Password: string; Role?: string } }
  | { type: 'googleSignIn'; email: string; name: string; role?: string }
  | { type: 'requestOTP'; email: string }
  | { type: 'resetPassword'; email: string; otp: string; newPassword: string };

export type AuthResponse = {
  success: boolean;
  message?: string;
  user?: {
    ID: string | number;
    Name: string;
    Username: string;
    Mobile?: string;
    Role: string;
    Active: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export const normalizeAuthUser = (user: AuthResponse['user']): User | null => {
  if (!user) return null;

  const id = typeof user.ID === 'number' ? user.ID : Number(user.ID);
  if (!Number.isFinite(id)) return null;

  return {
    ID: id,
    Name: user.Name,
    Username: user.Username,
    Mobile: user.Mobile,
    Role: user.Role,
    Active: user.Active,
  };
};

// Auth utility used by Login, Register and ForgotPassword screens.
// Sends the request to the Apps Script backend (or returns a mock if unconfigured).
export const sendRequest = async (payload: AuthRequest): Promise<AuthResponse> => {
  const url = getAPIUrl();

  if (!url) {
    // --- Local mock fallback so screens work even without Apps Script ---
    if (payload.type === 'login') {
      // Accept hardcoded credentials for offline dev testing
      if (payload.username === 'admin' && payload.password === 'nimraadmin123') {
        return { success: true, user: { ID: 1, Name: 'System Admin', Username: 'admin', Role: 'Admin', Active: true } };
      }
      return { success: false, message: 'Invalid credentials. Connect Apps Script URL to use real accounts.' };
    }
    if (payload.type === 'register') {
      const u = payload.user;
      if (!u.Name || !u.Password || (!u.Username && !u.Mobile)) {
        return { success: false, message: 'Name, password, and email or mobile are required.' };
      }
      if (u.Password.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters.' };
      }
      const mockUser = {
        ID: Date.now(),
        Name: u.Name,
        Username: u.Username || u.Mobile || '',
        Mobile: u.Mobile || '',
        Role: u.Role || 'Customer',
        Active: true,
      };
      return { success: true, user: mockUser, message: 'Mock registration successful.' };
    }
    if (payload.type === 'requestOTP') {
      return { success: true, message: 'OTP sent (use 123456 in offline mode).' };
    }
    if (payload.type === 'resetPassword') {
      if (payload.otp === '123456') {
        return { success: true, message: 'Password reset successful (offline mock).' };
      }
      return { success: false, message: 'Invalid OTP.' };
    }
    return { success: false, message: 'Action not supported in offline mode.' };
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, message: data.message || data.error || 'Request failed.' };
    }
    return data as AuthResponse;
  } catch (err) {
    console.error('sendRequest error:', err);
    return { success: false, message: 'Network error. Please check your connection.' };
  }
};

// Fetch CMS Data
export const fetchCMSData = async (): Promise<CMSData> => {
  const backendUrl = getBackendUrl();
  const url = backendUrl ? `${backendUrl}/api/cms` : getAPIUrl();
  if (!url) {
    return {
      banners: [],
      products: [],
      faqs: [],
      companyInfo: {},
    };
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("CMS Fetch failed");
    const data = await res.json();
    
    return {
      banners: (data.banners || []).map((banner: Banner) => ({ ...banner, ImageUrl: getBackendImageUrl(banner.ImageUrl) })),
      products: (data.products || []).map((product: Product) => ({ ...product, ImageUrl: getBackendImageUrl(product.ImageUrl) })),
      faqs: data.faqs || [],
      companyInfo: data.companyInfo || {}
    };
  } catch (err) {
    console.warn("Error loading CMS from Apps Script.", err);
    return {
      banners: [],
      products: [],
      faqs: [],
      companyInfo: {},
    };
  }
};

// Submit Inquiry to Google Sheets
const pendingInquiryKeys = new Map<string, string>();

export const submitInquiry = async (inquiry: InquirySubmission): Promise<{ success: boolean; message: string }> => {
  const url = getAPIUrl();
  const payloadKey = JSON.stringify([inquiry.customerId || '', inquiry.name, inquiry.email, inquiry.phone, inquiry.subject, inquiry.message]);
  const idempotencyKey = inquiry.idempotencyKey || pendingInquiryKeys.get(payloadKey) || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  pendingInquiryKeys.set(payloadKey, idempotencyKey);
  if (!url) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { success: true, message: "Inquiry mock-submitted successfully! (Connect Apps Script URL to write to Google Sheets)" };
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...inquiry, idempotencyKey, type: 'inquiry' })
    });
    if (!res.ok) throw new Error("Post inquiry failed");
    const result = await res.json();
    if (result.success) pendingInquiryKeys.delete(payloadKey);
    return result;
  } catch (err) {
    console.error("Error submitting inquiry:", err);
    return { success: false, message: "Failed to submit inquiry. Please check your network connection." };
  }
};

export const submitOrder = async (order: OrderSubmission): Promise<{ success: boolean; message: string; orderId?: string; emailSent?: boolean; emailError?: string; emailHint?: string }> => {
  const url = getAPIUrl();
  const payload: OrderSubmission = {
    ...order,
    paymentMethod: order.paymentMethod || 'Cash on Delivery',
    source: order.source || 'Mobile App',
  };


  if (!url) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return {
      success: true,
      message: 'Order mock-submitted successfully. Connect Apps Script URL to write to Google Sheets.',
      orderId: `NIMRA-MOCK-${Date.now()}`,
    };
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      return { success: false, message: result.message || result.error || 'Failed to place order.' };
    }
    return {
      success: true,
      message: 'Order placed successfully',
      orderId: result.orderId,
      emailSent: result.emailSent,
      emailError: result.emailError,
      emailHint: result.emailHint,
    };
  } catch (err) {
    console.error('Error submitting order:', err);
    return { success: false, message: 'Failed to submit order. Please check your network connection.' };
  }
};

export const trackOrder = async (
  orderId: string,
  mobile: string,
  scope?: { userId?: string | number; email?: string; mobile?: string }
): Promise<{ success: boolean; message?: string; order?: OrderRecord }> => {
  const url = getAPIUrl();
  if (!url) {
    return { success: false, message: 'Tracking requires the Apps Script URL to be configured.' };
  }

  try {
    const params = new URLSearchParams({ action: 'trackOrder' });
    if (orderId.trim()) params.set('orderId', orderId.trim());
    if (mobile.trim()) params.set('mobile', mobile.trim());
    if (scope?.userId !== undefined && scope.userId !== null) params.set('userId', String(scope.userId));
    if (scope?.email) params.set('email', scope.email);
    if (!mobile.trim() && scope?.mobile) params.set('mobile', scope.mobile);

    const res = await fetch(`${url}?${params.toString()}`);
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

// Admin Portal API Methods for Mobile

export const fetchOrders = async (): Promise<OrderRecord[]> => {
  const url = getAPIUrl();
  if (!url) return [];
  try {
    const res = await fetch(`${url}?action=getOrders`);
    if (!res.ok) throw new Error('Fetch failed');
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
};

export const fetchCustomerOrders = async (userId: string | number, email: string): Promise<OrderRecord[]> => {
  const url = getAPIUrl();
  if (!url) return [];
  try {
    const params = new URLSearchParams({ action: 'getOrders' });
    if (userId) params.set('userId', String(userId));
    if (email) params.set('email', email);
    
    const res = await fetch(`${url}?${params.toString()}`);
    if (!res.ok) throw new Error('Fetch failed');
    const result = await res.json();
    return Array.isArray(result) ? result : (result.orders || []);
  } catch (err) {
    console.error(err);
    return [];
  }
};

export const updateOrderStatus = async (orderId: string, status: string): Promise<{ success: boolean; message: string }> => {
  const url = getAPIUrl();
  if (!url) return { success: true, message: 'Mock update success' };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'updateOrderStatus', orderId, status }),
    });
    return await res.json();
  } catch (err) {
    console.error(err);
    return { success: false, message: 'Connection error' };
  }
};

export const requestOrderCancellation = async (
  order: OrderRecord,
  reason = 'Customer requested cancellation'
): Promise<{ success: boolean; message: string; request?: CancellationRequest }> => {
  const url = getAPIUrl();
  const requestDate = new Date().toISOString();
  if (!url) {
    return {
      success: true,
      message: 'Cancellation request mock-submitted for admin approval.',
      request: {
        requestId: `CAN-MOCK-${Date.now()}`,
        orderId: order.orderId,
        customerName: order.customer.name,
        customerMobile: order.customer.mobile,
        customerEmail: order.customer.email,
        orderTotal: Number(order.total || 0),
        paymentMethod: order.paymentMethod,
        reason,
        requestDate,
        status: 'Pending',
        refundStatus: 'Pending admin approval',
        statusHistory: [{ status: 'Pending', at: requestDate, by: 'Customer', remarks: reason }],
      },
    };
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'requestOrderCancellation', orderId: order.orderId, reason }),
    });
    return await res.json();
  } catch (err) {
    console.error(err);
    return { success: false, message: 'Connection error' };
  }
};

export const fetchCancellationRequests = async (): Promise<CancellationRequest[]> => {
  const url = getAPIUrl();
  if (!url) return [];
  try {
    const res = await fetch(`${url}?action=getCancellationRequests`);
    const data = await res.json();
    return Array.isArray(data) ? data : (data.requests || []);
  } catch (err) {
    console.error(err);
    return [];
  }
};

export const reviewCancellationRequest = async (
  requestId: string,
  decision: 'Approved' | 'Rejected',
  adminName: string,
  adminRemarks: string
): Promise<{ success: boolean; message: string; request?: CancellationRequest }> => {
  const url = getAPIUrl();
  if (!url) return { success: true, message: `Mock ${decision.toLowerCase()} cancellation request.` };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'reviewCancellationRequest', requestId, decision, adminName, adminRemarks }),
    });
    return await res.json();
  } catch (err) {
    console.error(err);
    return { success: false, message: 'Connection error' };
  }
};

export const fetchInquiries = async (): Promise<Inquiry[]> => {
  const url = getAPIUrl();
  if (!url) return [];
  try {
    const res = await fetch(`${url}?action=getInquiries`);
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
};

export const markInquiryReviewed = async (
  inquiryId: string | number,
  reviewedBy = 'Admin'
): Promise<{ success: boolean; message: string }> => {
  const url = getAPIUrl();
  if (!url) return { success: true, message: 'Mock updated' };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'inquiryCRUD',
        action: 'review',
        inquiryId,
        reviewedBy,
      }),
    });
    return await res.json();
  } catch (err) {
    console.error(err);
    return { success: false, message: 'Connection error' };
  }
};

export const fetchUsers = async (): Promise<AdminUser[]> => {
  const url = getAPIUrl();
  if (!url) {
    return [
      { ID: 1, Username: 'admin', Password: 'nimraadmin123', Role: 'Admin', Name: 'System Admin', Active: true },
      { ID: 2, Username: 'manager', Password: 'nimramanager123', Role: 'Manager', Name: 'Store Manager', Active: true }
    ];
  }
  try {
    const res = await fetch(`${url}?action=getUsers`);
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
};

export const saveUser = async (user: Partial<AdminUser>, action: 'create' | 'update' | 'delete'): Promise<{ success: boolean; message: string }> => {
  const url = getAPIUrl();
  if (!url) return { success: true, message: 'Mock saved' };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'userCRUD', action, user }),
    });
    return await res.json();
  } catch (err) {
    console.error(err);
    return { success: false, message: 'Connection error' };
  }
};

export const fetchNotifications = async (): Promise<Notification[]> => {
  const url = getAPIUrl();
  if (!url) return [];
  try {
    const res = await fetch(`${url}?action=getCustomerNotificationLog`);
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
};

export const saveNotification = async (notification: Partial<Notification>, action: 'create' | 'update' | 'delete'): Promise<{ success: boolean; message: string }> => {
  const url = getAPIUrl();
  if (!url) return { success: true, message: 'Mock saved' };
  try {
    const res = await fetch(url, {
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
        },
      }),
    });
    return await res.json();
  } catch (err) {
    console.error(err);
    return { success: false, message: 'Connection error' };
  }
};

export const saveProduct = async (product: Partial<Product>, action: 'create' | 'update' | 'delete'): Promise<{ success: boolean; message: string }> => {
  const url = getAPIUrl();
  if (!url) return { success: true, message: 'Mock saved' };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'productCRUD', action, product }),
    });
    return await res.json();
  } catch (err) {
    console.error(err);
    return { success: false, message: 'Connection error' };
  }
};

export const saveBanner = async (banner: Partial<Banner>, action: 'create' | 'update' | 'delete'): Promise<{ success: boolean; message: string }> => {
  const url = getAPIUrl();
  if (!url) return { success: true, message: 'Mock saved' };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'bannerCRUD', action, banner }),
    });
    return await res.json();
  } catch (err) {
    console.error(err);
    return { success: false, message: 'Connection error' };
  }
};

export const saveFAQ = async (faq: Partial<FAQ>, action: 'create' | 'update' | 'delete'): Promise<{ success: boolean; message: string }> => {
  const url = getAPIUrl();
  if (!url) return { success: true, message: 'Mock saved' };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'faqCRUD', action, faq }),
    });
    return await res.json();
  } catch (err) {
    console.error(err);
    return { success: false, message: 'Connection error' };
  }
};

export const saveCompanyInfo = async (companyInfo: CompanyInfo): Promise<{ success: boolean; message: string }> => {
  const url = getAPIUrl();
  if (!url) return { success: true, message: 'Mock saved' };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'companyInfoUpdate', companyInfo }),
    });
    return await res.json();
  } catch (err) {
    console.error(err);
    return { success: false, message: 'Connection error' };
  }
};

export const syncCart = async (userId: string | number, items: CartItem[]): Promise<{ success: boolean; message: string }> => {
  const url = getAPIUrl();
  if (!url) return { success: true, message: 'Mock synced' };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'cartSync', userId, items }),
    });
    return await res.json();
  } catch (err) {
    console.error(err);
    return { success: false, message: 'Connection error' };
  }
};

export const fetchCart = async (userId: string | number): Promise<CartItem[]> => {
  const url = getAPIUrl();
  if (!url) return [];
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'getCart', userId }),
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.items)) {
      return data.items;
    }
    return [];
  } catch (err) {
    console.error(err);
    return [];
  }
};
