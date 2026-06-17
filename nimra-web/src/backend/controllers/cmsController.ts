import { NextResponse } from 'next/server';
import { fallbackData } from '../models/fallbackData';

const APPS_SCRIPT_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || process.env.EXPO_PUBLIC_APPS_SCRIPT_URL || '';

let cachedCMSData: any = null;
let lastFetchTime = 0;
const CACHE_TTL = 300000; // 5 minutes cache

// Proxy GET requests to Google Apps Script
export async function handleGet(req: Request) {
  const requestUrl = new URL(req.url);
  const action = requestUrl.searchParams.get('action');
  const userId = requestUrl.searchParams.get('userId') || '';
  const mobile = requestUrl.searchParams.get('mobile') || '';
  const email = requestUrl.searchParams.get('email') || '';
  const liveActions = new Set(['trackOrder', 'getOrders', 'getInquiries', 'getUsers', 'getNotifications']);
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

      // 10 seconds timeout controller for fast response fallback (Google Apps Script can take > 1.5s)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

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
        console.warn(`[CMS API Proxy] Google Sheets fetch timed out (10s limit) for action: ${action || 'main'}. Serving cached or fallback data.`);
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
        (mobile && order.customer.mobile.replace(/\D/g, '') === mobile.replace(/\D/g, '')) ||
        (email && order.customer.email.toLowerCase() === email.toLowerCase())
      ),
      { headers: cacheHeaders }
    );
  } else if (action === 'getInquiries') {
    return NextResponse.json(fallbackData.inquiries, { headers: cacheHeaders });
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
          fallbackData.users[userIndex] = {
            ...fallbackData.users[userIndex],
            ...incomingUser,
            ID: fallbackData.users[userIndex].ID,
          };
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
