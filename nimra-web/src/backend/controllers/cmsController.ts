import { NextResponse } from 'next/server';
import { fallbackData } from '../models/fallbackData';

const APPS_SCRIPT_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || process.env.EXPO_PUBLIC_APPS_SCRIPT_URL || '';
const APPS_SCRIPT_TIMEOUT_MS = 20000;

let cachedCMSData: any = null;
let lastFetchTime = 0;
const CACHE_TTL = 300000; // 5 minutes cache

// Store OTPs in-memory for local fallback mode
const localOTPCache = new Map<string, { otp: string; expiresAt: number }>();

function invalidateCMSCache() {
  cachedCMSData = null;
  lastFetchTime = 0;
}

// Proxy GET requests to Google Apps Script
export async function handleGet(req: Request) {
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
  if (!action && cachedCMSData && (now - lastFetchTime < CACHE_TTL)) {
    return NextResponse.json(cachedCMSData, { headers: cacheHeaders });
  }
  
  if (APPS_SCRIPT_URL) {
    try {
      const targetUrl = new URL(APPS_SCRIPT_URL);
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
        next: { revalidate: shouldUseLiveData ? 0 : 300 },
      });
      clearTimeout(timeoutId);

      const text = await res.text();
      if (!text.trim().startsWith('<')) {
        const data = JSON.parse(text);
        // Save successfully fetched main CMS data to cache
        if (!action) {
          cachedCMSData = data;
          lastFetchTime = now;
        }
        return NextResponse.json(data, { headers: cacheHeaders });
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.warn(`[CMS API Proxy] Google Sheets fetch timed out (${APPS_SCRIPT_TIMEOUT_MS / 1000}s limit) for action: ${action || 'main'}. Serving cached or fallback data.`);
      } else {
        console.error('Google Sheets GET fetch failed, using local fallback:', err);
      }
    }
  }

  // Fallback: If live fetch failed/timed out and we have stale CMS cache for main action, return it
  if (!action && cachedCMSData) {
    return NextResponse.json(cachedCMSData, { headers: cacheHeaders });
  }

  // Use fallback data
  if (action === 'getBanners') {
    return NextResponse.json(fallbackData.banners, { headers: cacheHeaders });
  } else if (action === 'getProducts') {
    return NextResponse.json(fallbackData.products, { headers: cacheHeaders });
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
      banners: fallbackData.banners,
      products: fallbackData.products,
      faqs: fallbackData.faqs,
      companyInfo: fallbackData.companyInfo
    }, { headers: cacheHeaders });
  }
}

// Proxy POST requests to Google Apps Script
export async function handlePost(req: Request) {
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

    if (APPS_SCRIPT_URL) {
      try {
        const res = await fetch(APPS_SCRIPT_URL, {
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
          invalidateCMSCache();
          return NextResponse.json(data);
        }
        backendError = 'Apps Script returned a non-JSON response. Check the Web App deployment URL and access settings.';
      } catch (err) {
        backendError = err instanceof Error ? err.message : 'Google Sheets POST failed.';
        console.error('Google Sheets POST failed:', err);
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
    
    if (payload.type === 'order') {
      const orderId = `NIMRA-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      return NextResponse.json({
        success: true,
        message: 'Order placed successfully (local fallback mode)',
        orderId: orderId
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
        return NextResponse.json({ success: true, message: 'Notification created successfully', ID: newNotif.ID });
      }
      return NextResponse.json({ success: false, message: 'Unsupported notification action.' }, { status: 400 });
    } else if (payload.type === 'productCRUD') {
      const action = payload.action || 'create';
      const incomingProduct = payload.product || {};
      if (action === 'delete') {
        const idToDelete = incomingProduct.ID;
        fallbackData.products = fallbackData.products.filter((p: any) => String(p.ID) !== String(idToDelete));
        return NextResponse.json({ success: true, message: 'Product deleted successfully' });
      }
      if (action === 'update') {
        const idx = fallbackData.products.findIndex((p: any) => String(p.ID) === String(incomingProduct.ID));
        if (idx >= 0) {
          fallbackData.products[idx] = { ...fallbackData.products[idx], ...incomingProduct };
          return NextResponse.json({ success: true, message: 'Product updated successfully', ID: fallbackData.products[idx].ID });
        }
        return NextResponse.json({ success: false, message: 'Product not found.' }, { status: 404 });
      }
      if (action === 'create') {
        const newProduct = { ID: incomingProduct.ID || Date.now(), Active: true, ...incomingProduct };
        fallbackData.products.push(newProduct);
        return NextResponse.json({ success: true, message: 'Product created successfully', ID: newProduct.ID });
      }
      return NextResponse.json({ success: false, message: 'Unsupported product action.' }, { status: 400 });
    } else if (payload.type === 'bannerCRUD') {
      const action = payload.action || 'create';
      const incomingBanner = payload.banner || {};
      if (action === 'delete') {
        const idToDelete = incomingBanner.ID;
        fallbackData.banners = fallbackData.banners.filter((b: any) => String(b.ID) !== String(idToDelete));
        return NextResponse.json({ success: true, message: 'Banner deleted successfully' });
      }
      if (action === 'update') {
        const idx = fallbackData.banners.findIndex((b: any) => String(b.ID) === String(incomingBanner.ID));
        if (idx >= 0) {
          fallbackData.banners[idx] = { ...fallbackData.banners[idx], ...incomingBanner };
          return NextResponse.json({ success: true, message: 'Banner updated successfully', ID: fallbackData.banners[idx].ID });
        }
        return NextResponse.json({ success: false, message: 'Banner not found.' }, { status: 404 });
      }
      if (action === 'create') {
        const newBanner = { ID: incomingBanner.ID || Date.now(), Active: true, ...incomingBanner };
        fallbackData.banners.push(newBanner);
        return NextResponse.json({ success: true, message: 'Banner created successfully', ID: newBanner.ID });
      }
      return NextResponse.json({ success: false, message: 'Unsupported banner action.' }, { status: 400 });
    } else if (payload.type === 'faqCRUD') {
      const action = payload.action || 'create';
      const incomingFAQ = payload.faq || {};
      if (action === 'delete') {
        const idToDelete = incomingFAQ.ID;
        fallbackData.faqs = fallbackData.faqs.filter((f: any) => String(f.ID) !== String(idToDelete));
        return NextResponse.json({ success: true, message: 'FAQ deleted successfully' });
      }
      if (action === 'update') {
        const idx = fallbackData.faqs.findIndex((f: any) => String(f.ID) === String(incomingFAQ.ID));
        if (idx >= 0) {
          fallbackData.faqs[idx] = { ...fallbackData.faqs[idx], ...incomingFAQ };
          return NextResponse.json({ success: true, message: 'FAQ updated successfully', ID: fallbackData.faqs[idx].ID });
        }
        return NextResponse.json({ success: false, message: 'FAQ not found.' }, { status: 404 });
      }
      if (action === 'create') {
        const newFAQ = { ID: incomingFAQ.ID || Date.now(), Active: true, ...incomingFAQ };
        fallbackData.faqs.push(newFAQ);
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
