import { NextResponse } from 'next/server';
import { fallbackData } from '../models/fallbackData';
import { promises as fs } from 'fs';
import path from 'path';

const getAppsScriptUrl = () => {
  return process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || process.env.EXPO_PUBLIC_APPS_SCRIPT_URL || '';
};
const APPS_SCRIPT_TIMEOUT_MS = 45000;

const DB_PATH = path.join(process.cwd(), 'src', 'data', 'db.json');
let localDBLoaded = false;

async function syncLocalDB(action: 'load' | 'save') {
  try {
    if (action === 'load') {
      const fileContent = await fs.readFile(DB_PATH, 'utf-8');
      const data = JSON.parse(fileContent);
      if (data.banners) fallbackData.banners = data.banners;
      if (data.products) fallbackData.products = data.products;
      if (data.faqs) fallbackData.faqs = data.faqs;
      if (data.companyInfo) fallbackData.companyInfo = data.companyInfo;
      if (data.orders) fallbackData.orders = data.orders;
      if (data.inquiries) fallbackData.inquiries = data.inquiries;
      if (data.users) fallbackData.users = data.users;
      if (data.notifications) fallbackData.notifications = data.notifications;
      if (data.carts) fallbackData.carts = data.carts;
      localDBLoaded = true;
    } else {
      const data = {
        banners: fallbackData.banners,
        products: fallbackData.products,
        faqs: fallbackData.faqs,
        companyInfo: fallbackData.companyInfo,
        orders: fallbackData.orders,
        inquiries: fallbackData.inquiries,
        users: fallbackData.users,
        notifications: fallbackData.notifications,
        carts: fallbackData.carts,
      };
      await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error(`[CMS Controller] DB Sync error (${action}):`, err);
  }
}

let cachedCMSData: any = null;
let lastFetchTime = 0;
const CACHE_TTL = 300000; // 5 minutes cache
const LIVE_GET_CACHE_TTL = 15000;
const liveGetCache = new Map<string, { data: any; expiresAt: number }>();

type CustomerOrderIdentity = {
  userId?: unknown;
  customer?: {
    userId?: unknown;
    email?: unknown;
    mobile?: unknown;
  };
};

// Store OTPs in-memory for local fallback mode
const localOTPCache = new Map<string, { otp: string; expiresAt: number }>();

function invalidateCMSCache() {
  cachedCMSData = null;
  lastFetchTime = 0;
  liveGetCache.clear();
}

function getLiveCacheKey(action: string | null, userId: string, mobile: string, email: string) {
  // Order history must reflect newly appended orders immediately. Other live
  // actions do not currently use this scoped cache.
  return '';
}

// Proxy GET requests to Google Apps Script
export async function handleGet(req: Request) {
  await syncLocalDB('load');
  const requestUrl = new URL(req.url);
  const action = requestUrl.searchParams.get('action');
  const userId = requestUrl.searchParams.get('userId') || '';
  const mobile = requestUrl.searchParams.get('mobile') || '';
  const email = requestUrl.searchParams.get('email') || '';
  const liveActions = new Set(['trackOrder', 'getOrders', 'getCancellationRequests', 'getInquiries', 'getUsers', 'getNotifications']);
  const shouldUseLiveData = Boolean(action && liveActions.has(action));
  const cacheHeaders = shouldUseLiveData
    ? { 'Cache-Control': 'no-store' }
    : { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' };

  // If fetching main CMS data (action is null), serve from in-memory cache if fresh
  const now = Date.now();
  const liveCacheKey = getLiveCacheKey(action, userId, mobile, email);
  const liveCached = liveCacheKey ? liveGetCache.get(liveCacheKey) : null;
  if (liveCached && liveCached.expiresAt > now) {
    return NextResponse.json(liveCached.data, {
      headers: { 'Cache-Control': 'private, max-age=10, stale-while-revalidate=30' },
    });
  }

  if (!action && cachedCMSData && (now - lastFetchTime < CACHE_TTL)) {
    return NextResponse.json(cachedCMSData, { headers: cacheHeaders });
  }
  
  const urlVal = getAppsScriptUrl();
  if (urlVal) {
    try {
      console.log(`[CMS API Proxy] GET Request: action="${action || 'main'}" -> Fetching from Google Sheets URL...`);
      const targetUrl = new URL(urlVal);
      requestUrl.searchParams.forEach((value, key) => targetUrl.searchParams.set(key, value));

      // Allow for Google Apps Script cold starts while keeping a bounded fallback.
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), APPS_SCRIPT_TIMEOUT_MS);

      const res = await fetch(targetUrl.toString(), {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeoutId);

      const text = await res.text();
      if (!text.trim().startsWith('<')) {
        const data = JSON.parse(text);

        // Guard: only accept data that looks like a CMS payload (has products
        // or banners arrays). This prevents an order-confirmation response from
        // being cached and served as the catalog.
        const hasCMSShape = !action && (Array.isArray(data.banners) || Array.isArray(data.products));
        if (!action && !hasCMSShape) {
          console.warn(`[CMS API Proxy] GET Request: action="main" -> Response did not have expected CMS shape, falling through to fallback.`);
          // Fall through to local fallback below
        } else {
          // Rewrite ImageUrls to /uploads/ endpoint
          const rewriteImageUrl = (items: any[]) => {
            if (!items) return;
            const placeholder = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            items.forEach(item => {
              if (item.ImageUrl) {
                if (/^(https?:)/i.test(item.ImageUrl) && !item.ImageUrl.includes('localhost') && !item.ImageUrl.includes('127.0.0.1')) {
                  item.ImageUrl = placeholder;
                  return;
                }
                if (item.ImageUrl.includes('photo-') || item.ImageUrl.includes('unsplash.com')) {
                  item.ImageUrl = placeholder;
                  return;
                }
                const cleaned = item.ImageUrl.replace(/^(https?:\/\/[^\/]+)/i, '')
                                             .replace(/^\/?(api\/file|api\/uploads|uploads)\//, '')
                                             .replace(/^\/+/, '');
                item.ImageUrl = cleaned ? `/uploads/${cleaned}` : placeholder;
              }
            });
          };
          rewriteImageUrl(data.products);
          rewriteImageUrl(data.banners);

          // Save successfully fetched main CMS data to cache
          if (!action) {
            cachedCMSData = data;
            lastFetchTime = now;
          }
          if (liveCacheKey) {
            liveGetCache.set(liveCacheKey, { data, expiresAt: Date.now() + LIVE_GET_CACHE_TTL });
          }
          console.log(`[CMS API Proxy] GET Request: action="${action || 'main'}" -> Successfully fetched from Google Sheets. Count of products: ${data.products?.length || 0}, banners: ${data.banners?.length || 0}`);
          return NextResponse.json(data, { headers: cacheHeaders });
        }
      } else {
        console.warn(`[CMS API Proxy] GET Request: action="${action || 'main'}" -> Returned non-JSON/HTML error response.`);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.warn(`[CMS API Proxy] GET Request: action="${action || 'main'}" -> Google Sheets fetch timed out (${APPS_SCRIPT_TIMEOUT_MS / 1000}s limit).`);
      } else {
        console.error(`[CMS API Proxy] GET Request: action="${action || 'main'}" -> Google Sheets GET fetch failed:`, err);
      }
    }
  } else {
    console.log(`[CMS API Proxy] GET Request: action="${action || 'main'}" -> NEXT_PUBLIC_APPS_SCRIPT_URL is not set. Serving from local fallback (db.json).`);
  }

  // Fallback: If live fetch failed/timed out and we have stale CMS cache for main action, return it
  if (!action && cachedCMSData) {
    return NextResponse.json(cachedCMSData, { headers: cacheHeaders });
  }

  // Rewrite ImageUrls to /uploads/ endpoint
  const rewriteLocalImageUrl = (items: any[]) => {
    if (!items) return items;
    const placeholder = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    return items.map(item => {
      if (item.ImageUrl) {
        if (/^(https?:)/i.test(item.ImageUrl) && !item.ImageUrl.includes('localhost') && !item.ImageUrl.includes('127.0.0.1')) {
          return { ...item, ImageUrl: placeholder };
        }
        if (item.ImageUrl.includes('photo-') || item.ImageUrl.includes('unsplash.com')) {
          return { ...item, ImageUrl: placeholder };
        }
        const cleaned = item.ImageUrl.replace(/^(https?:\/\/[^\/]+)/i, '')
                                     .replace(/^\/?(api\/file|api\/uploads|uploads)\//, '')
                                     .replace(/^\/+/, '');
        return { ...item, ImageUrl: cleaned ? `/uploads/${cleaned}` : placeholder };
      }
      return item;
    });
  };

  // Use fallback data
  if (action === 'getBanners') {
    return NextResponse.json(rewriteLocalImageUrl(fallbackData.banners), { headers: cacheHeaders });
  } else if (action === 'getProducts') {
    return NextResponse.json(rewriteLocalImageUrl(fallbackData.products), { headers: cacheHeaders });
  } else if (action === 'getFAQs') {
    return NextResponse.json(fallbackData.faqs, { headers: cacheHeaders });
  } else if (action === 'getCompanyInfo') {
    return NextResponse.json(fallbackData.companyInfo, { headers: cacheHeaders });
  } else if (action === 'trackOrder') {
    return NextResponse.json({ success: false, message: 'No matching order found.' }, { headers: cacheHeaders });
  } else if (action === 'getOrders') {
    if (!userId && !mobile && !email) return NextResponse.json(fallbackData.orders, { headers: cacheHeaders });
    return NextResponse.json(
      fallbackData.orders.filter((order: any) =>
        (userId && String(order.customer.userId || '') === userId) ||
        (mobile && order.customer.mobile.replace(/\D/g, '') === mobile.replace(/\D/g, '')) ||
        (email && order.customer.email.toLowerCase() === email.toLowerCase())
      ),
      { headers: cacheHeaders }
    );
  } else if (action === 'getInquiries') {
    return NextResponse.json(fallbackData.inquiries, { headers: cacheHeaders });
  } else if (action === 'getCancellationRequests') {
    return NextResponse.json([], { headers: cacheHeaders });
  } else if (action === 'getUsers') {
    return NextResponse.json(fallbackData.users, { headers: cacheHeaders });
  } else if (action === 'getNotifications') {
    return NextResponse.json(fallbackData.notifications, { headers: cacheHeaders });
  } else {
    // Return all customer CMS collections
    return NextResponse.json({
      banners: rewriteLocalImageUrl(fallbackData.banners),
      products: rewriteLocalImageUrl(fallbackData.products),
      faqs: fallbackData.faqs,
      companyInfo: fallbackData.companyInfo
    }, { headers: cacheHeaders });
  }
}

// Proxy POST requests to Google Apps Script
export async function handlePost(req: Request) {
  await syncLocalDB('load');
  try {
    const body = await req.json();
    const payload = { ...body };
    let backendError = '';

    invalidateCMSCache();

    if (payload.type === 'login') {
      const username = String(payload.username || '').trim();
      const password = String(payload.password || '');
      const isValidIdentifier =
        /^\d{10}$/.test(username) ||
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username) ||
        username.toLowerCase() === 'admin';

      if (!username || !password) {
        return NextResponse.json({ success: false, message: 'Username and password are required.' }, { status: 400 });
      }

      if (!isValidIdentifier) {
        return NextResponse.json({ success: false, message: 'Enter a valid mobile number or email address.' }, { status: 400 });
      }
    }

    const urlValPost = getAppsScriptUrl();
    if (urlValPost) {
      try {
        console.log(`[CMS API Proxy] POST Request: type="${payload.type}" -> Fetching from Google Sheets URL...`);
        const res = await fetch(urlValPost, {
          method: 'POST',
          redirect: 'follow',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const text = await res.text();
        if (!text.trim().startsWith('<')) {
          const data = JSON.parse(text);
          console.log(`[CMS API Proxy] POST Request: type="${payload.type}" -> Successfully processed by Google Sheets.`);
          invalidateCMSCache();
          return NextResponse.json(data);
        }
        backendError = 'Apps Script returned a non-JSON response. Check the Web App deployment URL and access settings.';
        console.warn(`[CMS API Proxy] POST Request: type="${payload.type}" -> Returned non-JSON/HTML response.`);
      } catch (err) {
        backendError = err instanceof Error ? err.message : 'Google Sheets POST failed.';
        console.error(`[CMS API Proxy] POST Request: type="${payload.type}" -> Google Sheets POST failed:`, err);
      }

      return NextResponse.json(
        {
          success: false,
          message: 'Google Sheets backend failed to process this request. No order/account email was sent.',
          error: backendError,
        },
        { status: 502 }
      );
    }

    // Local fallback only when Google Sheets is not configured.
    
    if (payload.type === 'getCart') {
      const userId = String(payload.userId || '').trim();
      if (!userId) {
        return NextResponse.json({ success: false, message: 'userId is required to get cart' }, { status: 400 });
      }
      const savedCart = (fallbackData.carts || []).find((cart: any) => String(cart.userId) === userId);
      return NextResponse.json({ success: true, items: savedCart?.items || [] });
    } else if (payload.type === 'cartSync') {
      const userId = String(payload.userId || '').trim();
      if (!userId) {
        return NextResponse.json({ success: false, message: 'userId is required for cart sync' }, { status: 400 });
      }

      const carts = Array.isArray(fallbackData.carts) ? fallbackData.carts : [];
      const cartIndex = carts.findIndex((cart: any) => String(cart.userId) === userId);
      const incomingUpdatedAt = String(payload.updatedAt || new Date().toISOString());
      const cartRecord = {
        userId,
        items: Array.isArray(payload.items) ? payload.items : [],
        updatedAt: incomingUpdatedAt,
      };

      if (cartIndex >= 0) {
        const existingUpdatedAt = Date.parse(String(carts[cartIndex].updatedAt || ''));
        const nextUpdatedAt = Date.parse(incomingUpdatedAt);
        if (Number.isFinite(existingUpdatedAt) && Number.isFinite(nextUpdatedAt) && nextUpdatedAt < existingUpdatedAt) {
          return NextResponse.json({ success: true, message: 'Stale cart sync ignored', staleIgnored: true });
        }
        carts[cartIndex] = cartRecord;
      } else {
        carts.push(cartRecord);
      }

      fallbackData.carts = carts;
      await syncLocalDB('save');
      return NextResponse.json({ success: true, message: 'Cart synced successfully' });
    } else if (payload.type === 'order') {
      const orderId = `NIMRA-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const now = new Date().toISOString();
      const savedOrder = {
        ...payload,
        orderId,
        status: 'Pending',
        createdAt: now,
        updatedAt: now,
      };
      fallbackData.orders.unshift(savedOrder);
      await syncLocalDB('save');
      const customerUserId = String(payload.userId || payload.customer?.userId || '').trim();
      const customerEmail = String(payload.customer?.email || '').trim().toLowerCase();
      const customerMobile = String(payload.customer?.mobile || '').replace(/\D/g, '').slice(-10);
      const customerOrders = fallbackData.orders.filter((order: CustomerOrderIdentity) => {
        const orderUserId = String(order.userId || order.customer?.userId || '').trim();
        const orderEmail = String(order.customer?.email || '').trim().toLowerCase();
        const orderMobile = String(order.customer?.mobile || '').replace(/\D/g, '').slice(-10);
        return Boolean(
          (customerUserId && orderUserId === customerUserId) ||
          (customerEmail && orderEmail === customerEmail) ||
          (customerMobile && orderMobile === customerMobile)
        );
      });
      return NextResponse.json({
        success: true,
        message: 'Order placed successfully (local fallback mode)',
        orderId: orderId,
        orders: customerOrders,
      });
    } else if (payload.type === 'requestOrderCancellation') {
      return NextResponse.json({
        success: true,
        message: 'Cancellation request submitted for admin approval (local fallback mode)'
      });
    } else if (payload.type === 'reviewCancellationRequest') {
      return NextResponse.json({
        success: true,
        message: `Cancellation request ${String(payload.decision || '').toLowerCase()} (local fallback mode)`
      });
    } else if (payload.type === 'inquiry') {
      return NextResponse.json({
        success: true,
        message: 'Inquiry submitted successfully (local fallback mode)'
      });
    } else if (payload.type === 'login') {
      // Simple local login fallback
      if (payload.username === 'admin' && payload.password === 'nimraadmin123') {
        return NextResponse.json({
          success: true,
          message: 'Login successful',
          user: { Name: 'Admin User', Username: 'admin', Role: 'Admin' }
        });
      }
      return NextResponse.json({
        success: false,
        message: 'Invalid username or password'
      });
    } else if (payload.type === 'userCRUD') {
      const action = payload.action || 'create';
      const incomingUser = payload.user || {};
      const userIndex = fallbackData.users.findIndex((user: any) => {
        if (incomingUser.ID !== undefined && incomingUser.ID !== null && user.ID !== undefined && user.ID !== null) {
          return String(user.ID) === String(incomingUser.ID);
        }
        return String(user.Username || '').toLowerCase() === String(incomingUser.Username || '').toLowerCase();
      });

      if (action === 'update') {
        if (userIndex >= 0) {
          const currentUser = fallbackData.users[userIndex];
          if (incomingUser.Username && incomingUser.Username.toLowerCase() !== currentUser.Username.toLowerCase()) {
            const cachedOtpInfo = localOTPCache.get(String(incomingUser.ID));
            if (!cachedOtpInfo || cachedOtpInfo.otp !== incomingUser.otp || Date.now() > cachedOtpInfo.expiresAt) {
              return NextResponse.json({ success: false, message: 'Invalid or expired OTP.' });
            }
            localOTPCache.delete(String(incomingUser.ID));
          }

          fallbackData.users[userIndex] = {
            ...fallbackData.users[userIndex],
            ...incomingUser,
            ID: fallbackData.users[userIndex].ID,
          };
          delete fallbackData.users[userIndex].otp;
          await syncLocalDB('save');
          return NextResponse.json({ success: true, message: 'User updated successfully', ID: fallbackData.users[userIndex].ID });
        }

        return NextResponse.json({ success: false, message: 'User record not found for update.' }, { status: 404 });
      }

      if (action === 'create') {
        const newUser = {
          ID: incomingUser.ID || Date.now(),
          ...incomingUser,
        };
        fallbackData.users.push(newUser);
        await syncLocalDB('save');
        return NextResponse.json({ success: true, message: 'User created successfully', ID: newUser.ID });
      }

      return NextResponse.json({ success: false, message: 'Unsupported user action.' }, { status: 400 });
    } else if (payload.type === 'notificationCRUD') {
      const action = payload.action || 'create';
      const incomingNotif = payload.notification || {};
      if (action === 'delete') {
        const idToDelete = incomingNotif.ID;
        if (idToDelete === undefined || idToDelete === null || String(idToDelete).trim() === '') {
          return NextResponse.json({ success: false, message: 'Notification ID is required.' }, { status: 400 });
        }
        fallbackData.notifications = fallbackData.notifications.filter((n: any) => String(n.ID) !== String(idToDelete));
        await syncLocalDB('save');
        return NextResponse.json({ success: true, message: 'Notification deleted successfully' });
      }
      if (action === 'update') {
        if (incomingNotif.ID === undefined || incomingNotif.ID === null || String(incomingNotif.ID).trim() === '') {
          return NextResponse.json({ success: false, message: 'Notification ID is required.' }, { status: 400 });
        }
        const notifIndex = fallbackData.notifications.findIndex((n: any) => String(n.ID) === String(incomingNotif.ID));
        if (notifIndex >= 0) {
          fallbackData.notifications[notifIndex] = {
            ...fallbackData.notifications[notifIndex],
            ...incomingNotif,
          };
          await syncLocalDB('save');
          return NextResponse.json({ success: true, message: 'Notification updated successfully', ID: fallbackData.notifications[notifIndex].ID });
        }
        return NextResponse.json({ success: false, message: 'Notification not found for update.' }, { status: 404 });
      }
      if (action === 'create') {
        const newNotif = {
          ID: incomingNotif.ID || Date.now(),
          Timestamp: new Date().toISOString(),
          CreatedAt: new Date().toISOString(),
          Status: incomingNotif.Status || 'Published',
          Read: false,
          ...incomingNotif,
        };
        fallbackData.notifications.push(newNotif);
        await syncLocalDB('save');
        return NextResponse.json({ success: true, message: 'Notification created successfully', ID: newNotif.ID });
      }
      return NextResponse.json({ success: false, message: 'Unsupported notification action.' }, { status: 400 });
    } else if (payload.type === 'productCRUD') {
      const action = payload.action || 'create';
      const incomingProduct = payload.product || {};
      if (incomingProduct.ImageUrl) {
        incomingProduct.ImageUrl = incomingProduct.ImageUrl.replace(/^(https?:\/\/[^\/]+)/i, '')
                                                           .replace(/^\/?(api\/file|api\/uploads|uploads)\//, '')
                                                           .replace(/^\/+/, '');
      }
      if (action === 'delete') {
        const idToDelete = incomingProduct.ID;
        fallbackData.products = fallbackData.products.filter((p: any) => String(p.ID) !== String(idToDelete));
        await syncLocalDB('save');
        return NextResponse.json({ success: true, message: 'Product deleted successfully' });
      }
      if (action === 'update') {
        const idx = fallbackData.products.findIndex((p: any) => String(p.ID) === String(incomingProduct.ID));
        if (idx >= 0) {
          fallbackData.products[idx] = { ...fallbackData.products[idx], ...incomingProduct };
          await syncLocalDB('save');
          return NextResponse.json({ success: true, message: 'Product updated successfully', ID: fallbackData.products[idx].ID });
        }
        return NextResponse.json({ success: false, message: 'Product not found.' }, { status: 404 });
      }
      if (action === 'create') {
        const newProduct = { ID: incomingProduct.ID || Date.now(), Active: true, ...incomingProduct };
        fallbackData.products.push(newProduct);
        await syncLocalDB('save');
        return NextResponse.json({ success: true, message: 'Product created successfully', ID: newProduct.ID });
      }
      return NextResponse.json({ success: false, message: 'Unsupported product action.' }, { status: 400 });
    } else if (payload.type === 'bannerCRUD') {
      const action = payload.action || 'create';
      const incomingBanner = payload.banner || {};
      if (incomingBanner.ImageUrl) {
        incomingBanner.ImageUrl = incomingBanner.ImageUrl.replace(/^(https?:\/\/[^\/]+)/i, '')
                                                         .replace(/^\/?(api\/file|api\/uploads|uploads)\//, '')
                                                         .replace(/^\/+/, '');
      }
      if (action === 'delete') {
        const idToDelete = incomingBanner.ID;
        fallbackData.banners = fallbackData.banners.filter((b: any) => String(b.ID) !== String(idToDelete));
        await syncLocalDB('save');
        return NextResponse.json({ success: true, message: 'Banner deleted successfully' });
      }
      if (action === 'update') {
        const idx = fallbackData.banners.findIndex((b: any) => String(b.ID) === String(incomingBanner.ID));
        if (idx >= 0) {
          fallbackData.banners[idx] = { ...fallbackData.banners[idx], ...incomingBanner };
          await syncLocalDB('save');
          return NextResponse.json({ success: true, message: 'Banner updated successfully', ID: fallbackData.banners[idx].ID });
        }
        return NextResponse.json({ success: false, message: 'Banner not found.' }, { status: 404 });
      }
      if (action === 'create') {
        const newBanner = { ID: incomingBanner.ID || Date.now(), Active: true, ...incomingBanner };
        fallbackData.banners.push(newBanner);
        await syncLocalDB('save');
        return NextResponse.json({ success: true, message: 'Banner created successfully', ID: newBanner.ID });
      }
      return NextResponse.json({ success: false, message: 'Unsupported banner action.' }, { status: 400 });
    } else if (payload.type === 'faqCRUD') {
      const action = payload.action || 'create';
      const incomingFAQ = payload.faq || {};
      if (action === 'delete') {
        const idToDelete = incomingFAQ.ID;
        fallbackData.faqs = fallbackData.faqs.filter((f: any) => String(f.ID) !== String(idToDelete));
        await syncLocalDB('save');
        return NextResponse.json({ success: true, message: 'FAQ deleted successfully' });
      }
      if (action === 'update') {
        const idx = fallbackData.faqs.findIndex((f: any) => String(f.ID) === String(incomingFAQ.ID));
        if (idx >= 0) {
          fallbackData.faqs[idx] = { ...fallbackData.faqs[idx], ...incomingFAQ };
          await syncLocalDB('save');
          return NextResponse.json({ success: true, message: 'FAQ updated successfully', ID: fallbackData.faqs[idx].ID });
        }
        return NextResponse.json({ success: false, message: 'FAQ not found.' }, { status: 404 });
      }
      if (action === 'create') {
        const newFAQ = { ID: incomingFAQ.ID || Date.now(), Active: true, ...incomingFAQ };
        fallbackData.faqs.push(newFAQ);
        await syncLocalDB('save');
        return NextResponse.json({ success: true, message: 'FAQ created successfully', ID: newFAQ.ID });
      }
      return NextResponse.json({ success: false, message: 'Unsupported FAQ action.' }, { status: 400 });
    } else if (payload.type === 'requestOTP') {
      return NextResponse.json(
        {
          success: false,
          message: 'Email OTP requires the Google Apps Script backend. Please deploy and authorize the latest Apps Script, then try again.'
        },
        { status: 503 }
      );
    } else if (payload.type === 'resetPassword') {
      return NextResponse.json(
        {
          success: false,
          message: 'Password reset requires the Google Apps Script backend. Please deploy and authorize the latest Apps Script, then try again.'
        },
        { status: 503 }
      );
    } else if (payload.type === 'requestEmailChangeOTP') {
      const { userId, newEmail } = payload;
      if (!newEmail) {
        return NextResponse.json({ success: false, message: 'New email is required.' }, { status: 400 });
      }
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000;
      localOTPCache.set(String(userId), { otp, expiresAt });

      console.log(`\n==================================================`);
      console.log(`[LOCAL DEV] Email Change OTP for User ID: ${userId}`);
      console.log(`[LOCAL DEV] New Email: ${newEmail}`);
      console.log(`[LOCAL DEV] OTP Code: ${otp}`);
      console.log(`[LOCAL DEV] Expiry: ${new Date(expiresAt).toISOString()}`);
      console.log(`==================================================\n`);

      return NextResponse.json({
        success: true,
        message: `OTP sent to ${newEmail} (local fallback mode, check server console).`
      });
    }

    // Return error for other types
    return NextResponse.json(
      { success: false, message: 'Google Sheets backend not available or failed to process request.' },
      { status: 500 }
    );
  } catch (err) {
    console.error('API POST error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error processing request.' },
      { status: 500 }
    );
  }
}
