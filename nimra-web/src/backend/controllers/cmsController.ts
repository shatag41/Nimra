import { NextRequest, NextResponse } from 'next/server';
import { fallbackData } from '../models/fallbackData';
import { promises as fs } from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { getStoredUploadValue, getUploadImageUrl } from '@/utils/uploadImage';
import { deleteFile, fileExists } from '@/backend/storage/storage';
import { isAdminStorageRequest } from '@/backend/storage/storageAuth';
import { mergeCompanyInfo } from '@/utils/companyInfo';
import { getCustomerDeletionEligibility } from '@/utils/customerDeletion';

const EMAIL_PREFERENCE_DEFAULTS = {
  orderConfirmation: true,
  orderStatusUpdates: true,
};

const normalizeEmailPreferences = (value: unknown) => {
  let parsed: Record<string, unknown> = {};
  try {
    parsed = typeof value === 'string' ? JSON.parse(value) : (value as Record<string, unknown>) || {};
  } catch {
    parsed = {};
  }
  return Object.fromEntries(
    Object.entries(EMAIL_PREFERENCE_DEFAULTS).map(([key, fallback]) => [
      key,
      typeof parsed[key] === 'boolean' ? parsed[key] : fallback,
    ])
  );
};

const hashLocalPassword = (password: string) => createHash('sha256').update(password).digest('hex');
const localPasswordMatches = (stored: unknown, supplied: string) => {
  const current = String(stored || '');
  return current === supplied || current === hashLocalPassword(supplied);
};

const getAppsScriptUrl = () => {
  return process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || process.env.EXPO_PUBLIC_APPS_SCRIPT_URL || '';
};
const APPS_SCRIPT_TIMEOUT_MS = 45000;
type UploadScope = 'products' | 'banners';

const isNextDynamicSignal = (error: unknown) => Boolean(
  error &&
  typeof error === 'object' &&
  'digest' in error &&
  String((error as { digest?: unknown }).digest).includes('DYNAMIC_SERVER_USAGE')
);

const uploadFileExists = async (storagePath: string, scope: UploadScope) => {
  return fileExists(storagePath, scope);
};

async function fetchAppsScriptData(action: string, params: Record<string, string> = {}) {
  const baseUrl = getAppsScriptUrl();
  if (!baseUrl) return null;
  const url = new URL(baseUrl);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([key, value]) => { if (value) url.searchParams.set(key, value); });
  const response = await fetch(url.toString(), {
    method: 'GET',
    redirect: 'follow',
    cache: 'no-store',
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(APPS_SCRIPT_TIMEOUT_MS),
  });
  const text = await response.text();
  if (!response.ok || text.trim().startsWith('<')) throw new Error(`Unable to validate ${action}.`);
  return JSON.parse(text);
}

async function postAppsScriptData(payload: Record<string, unknown>) {
  const baseUrl = getAppsScriptUrl();
  if (!baseUrl) return null;
  const response = await fetch(baseUrl, {
    method: 'POST',
    redirect: 'follow',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(APPS_SCRIPT_TIMEOUT_MS),
  });
  const text = await response.text();
  if (!response.ok || text.trim().startsWith('<')) throw new Error('Unable to persist the password update.');
  return JSON.parse(text);
}

/**
 * Safely delete an uploaded image file from .storage/uploads/.
 * Silently ignores ENOENT so callers can safely call this even if the
 * file was already removed or never existed.
 */
const deleteUploadedFile = async (storagePath: string): Promise<void> => {
  try {
    await deleteFile(storagePath);
  } catch (err: unknown) {
    console.error(`[CMS Controller] Failed to delete uploaded image (${storagePath}):`, err);
  }
};

const mapUploadedImagesFromStorage = async (
  items: Array<Record<string, unknown>> | undefined,
  scope: UploadScope,
  fallbackItems: Array<Record<string, unknown>> = []
) => {
  if (!Array.isArray(items)) return items;
  return Promise.all(items.map(async item => {
    const fallback = fallbackItems.find(candidate => String(candidate.ID) === String(item.ID));
    const storagePath = getStoredUploadValue(item.ImageUrl) || getStoredUploadValue(fallback?.ImageUrl);
    const imageUrl = storagePath && await uploadFileExists(storagePath, scope)
      ? getUploadImageUrl(storagePath)
      : '';

    return {
      ...item,
      // Display only files that are actually present in .storage/uploads.
      // Sheets can stay blank; local bindings are validated before display.
      ImageUrl: imageUrl,
    };
  }));
};

const DB_PATH = path.join(process.cwd(), 'src', 'data', 'db.json');
let localDBLoaded = false;

async function syncLocalDB(action: 'load' | 'save') {
  try {
    if (action === 'load') {
      if (localDBLoaded) return;
      const fileContent = await fs.readFile(DB_PATH, 'utf-8');
      const data = JSON.parse(fileContent);
      if (data.banners) fallbackData.banners = data.banners;
      if (data.products) fallbackData.products = data.products;
      if (data.faqs) fallbackData.faqs = data.faqs;
      if (data.companyInfo) fallbackData.companyInfo = data.companyInfo;
      if (data.orders) fallbackData.orders = data.orders;
      if (data.cancellationRequests) fallbackData.cancellationRequests = data.cancellationRequests;
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
        cancellationRequests: fallbackData.cancellationRequests || [],
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

function getCacheTTL(action: string | null): number {
  if (!action || ['getBanners', 'getProducts', 'getFAQs', 'getCompanyInfo'].includes(action)) {
    return 5 * 60 * 1000; // 5 minutes for relatively static catalog/CMS data
  }
  return 30 * 1000; // 30 seconds for highly dynamic orders, users, inquiries, notifications
}
const liveGetCache = new Map<string, { data: any; expiresAt: number }>();
const pendingFetches = new Map<string, Promise<any>>();

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
const localDeletionOTPCache = new Map<string, { otp: string; email: string; expiresAt: number; attempts: number; verified?: boolean }>();

function invalidateCMSCache(type?: string) {
  const cmsTypes = ['productCRUD', 'bannerCRUD', 'faqCRUD', 'companyInfoUpdate'];
  const dataMutations = [
    'createOrder', 'order', 'updateOrder', 'cancelRequest', 'requestOrderCancellation',
    'updateCancellation', 'reviewCancellationRequest', 'updateOrderStatus', 'registerUser',
    'userAction', 'saveAddress', 'accountSettings', 'userAddresses', 'login', 'register',
    'verifyRegistrationOTP', 'createVerifiedUser', 'googleSignIn', 'cartSync', 'notificationCRUD',
    'adminUpdateCRUD', 'inquiryCRUD', 'inquiryReview'
  ];

  if (!type || cmsTypes.includes(type)) {
    liveGetCache.clear();
    try {
      const { clearCMSDataCache } = require('@/utils/api');
      clearCMSDataCache();
    } catch (err) {
      console.error('[invalidateCMSCache] Failed to clear CMS API cache:', err);
    }
    try {
      const { revalidateTag } = require('next/cache');
      revalidateTag('cms-data');
    } catch (err) {
      // Ignore context errors
    }
  } else if (dataMutations.includes(type)) {
    // Only clear dynamic cache, preserving static catalog/CMS cache
    liveGetCache.clear();
  }
}

function getLiveCacheKey(action: string | null, userId: string, mobile: string, email: string) {
  const parts = [action || 'main'];
  if (userId) parts.push(`u:${userId}`);
  if (mobile) parts.push(`m:${mobile}`);
  if (email) parts.push(`e:${email}`);
  return parts.join('|');
}

async function saveLocalImageBinding(
  type: 'productCRUD' | 'bannerCRUD',
  action: string,
  entity: Record<string, unknown>,
  responseData: Record<string, unknown>,
  imagePath: string
) {
  const collectionName = type === 'productCRUD' ? 'products' : 'banners';
  const collection = fallbackData[collectionName] || [];
  const id = responseData.ID ?? entity.ID;
  if (id === undefined || id === null || String(id).trim() === '') return;

  if (action === 'delete') {
    fallbackData[collectionName] = collection.filter((item: any) => String(item.ID) !== String(id));
    await syncLocalDB('save');
    return;
  }

  if (action !== 'update' && !imagePath && !entity.ImageUrl && !Object.prototype.hasOwnProperty.call(entity, 'ImageUrl')) return;

  const index = collection.findIndex((item: any) => String(item.ID) === String(id));
  const existingItem = index >= 0 ? collection[index] : {};
  const nextItem = {
    ...existingItem,
    ...entity,
    ID: id,
    ImageUrl: imagePath || getStoredUploadValue(entity.ImageUrl) || getStoredUploadValue(existingItem.ImageUrl) || '',
  };

  if (index >= 0) {
    collection[index] = nextItem;
  } else {
    collection.push(nextItem);
  }

  fallbackData[collectionName] = collection;
  await syncLocalDB('save');
}

// Proxy GET requests to Google Apps Script
export async function handleGet(req: Request) {
  await syncLocalDB('load');
  const requestUrl = new URL(req.url);
  const action = requestUrl.searchParams.get('action');
  const userId = requestUrl.searchParams.get('userId') || '';
  const mobile = requestUrl.searchParams.get('mobile') || '';
  const email = requestUrl.searchParams.get('email') || '';
  const isPublicCMSRead = !action || ['getBanners', 'getProducts', 'getFAQs', 'getCompanyInfo'].includes(action);
  // Disable caching to allow admin updates to take effect immediately
  const cacheHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  };

  const now = Date.now();
  const liveCacheKey = getLiveCacheKey(action, userId, mobile, email);
  // Bypass liveGetCache for CMS items to display updates instantly
  const liveCached = !isPublicCMSRead && liveCacheKey ? liveGetCache.get(liveCacheKey) : null;
  if (liveCached && liveCached.expiresAt > now) {
    return NextResponse.json(liveCached.data, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const urlVal = getAppsScriptUrl();
  if (urlVal) {
    try {
      const targetUrl = new URL(urlVal);
      requestUrl.searchParams.forEach((value, key) => targetUrl.searchParams.set(key, value));

      // Allow for Google Apps Script cold starts while keeping a bounded fallback.
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), APPS_SCRIPT_TIMEOUT_MS);

      const fetchKey = targetUrl.toString();
      let fetchPromise = pendingFetches.get(fetchKey);
      if (!fetchPromise) {
        fetchPromise = fetch(targetUrl.toString(), {
          method: 'GET',
          redirect: 'follow',
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal,
          cache: 'no-store',
        }).then(res => {
          clearTimeout(timeoutId);
          return res.text();
        }).catch(fetchErr => {
          clearTimeout(timeoutId);
          // DOMException (AbortError) has a read-only .message — wrap it in a
          // plain Error so Next.js internals can safely handle it.
          if (fetchErr instanceof DOMException || (fetchErr && fetchErr.code === 20)) {
            const wrapped = new Error(fetchErr.message || 'Fetch aborted');
            wrapped.name = fetchErr.name || 'AbortError';
            throw wrapped;
          }
          throw fetchErr;
        });
        pendingFetches.set(fetchKey, fetchPromise);
        fetchPromise.then(
          () => pendingFetches.delete(fetchKey),
          () => pendingFetches.delete(fetchKey)
        );
      }

      const text = await fetchPromise;
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
          // Resolve CMS image records to files served from .storage/uploads.
          if (Array.isArray(data)) {
            if (action === 'getBanners') {
              data.splice(0, data.length, ...(await mapUploadedImagesFromStorage(data, 'banners', fallbackData.banners))!);
            } else if (action === 'getProducts') {
              data.splice(0, data.length, ...(await mapUploadedImagesFromStorage(data, 'products', fallbackData.products))!);
            }
          } else {
            data.products = await mapUploadedImagesFromStorage(data.products, 'products', fallbackData.products);
            data.banners = await mapUploadedImagesFromStorage(data.banners, 'banners', fallbackData.banners);
            data.companyInfo = mergeCompanyInfo(data.companyInfo);
          }

          if (liveCacheKey) {
            liveGetCache.set(liveCacheKey, { data, expiresAt: Date.now() + getCacheTTL(action) });
          }
          return NextResponse.json(data, { headers: cacheHeaders });
        }
      } else {
        console.warn(`[CMS API Proxy] GET Request: action="${action || 'main'}" -> Returned non-JSON/HTML error response.`);
      }
    } catch (err: any) {
      // This is a Next.js rendering control signal, not an upstream failure.
      // Swallowing it makes SSR incorrectly fall through to local CMS data.
      if (isNextDynamicSignal(err)) throw err;
      if (err.name === 'AbortError') {
        console.warn(`[CMS API Proxy] GET Request: action="${action || 'main'}" -> Google Sheets fetch timed out (${APPS_SCRIPT_TIMEOUT_MS / 1000}s limit).`);
      } else {
        console.error(`[CMS API Proxy] GET Request: action="${action || 'main'}" -> Google Sheets GET fetch failed:`, err);
      }
    }
  }

  // Use fallback data
  if (action === 'getBanners') {
    return NextResponse.json(await mapUploadedImagesFromStorage(fallbackData.banners, 'banners', fallbackData.banners), { headers: cacheHeaders });
  } else if (action === 'getProducts') {
    return NextResponse.json(await mapUploadedImagesFromStorage(fallbackData.products, 'products', fallbackData.products), { headers: cacheHeaders });
  } else if (action === 'getFAQs') {
    return NextResponse.json(fallbackData.faqs, { headers: cacheHeaders });
  } else if (action === 'getCompanyInfo') {
    return NextResponse.json(mergeCompanyInfo(fallbackData.companyInfo), { headers: cacheHeaders });
  } else if (action === 'trackOrder') {
    return NextResponse.json({ success: false, message: 'No matching order found.' }, { headers: cacheHeaders });
  } else if (action === 'getOrders') {
    if (!userId && !mobile && !email) return NextResponse.json(fallbackData.orders, { headers: cacheHeaders });
    if (userId) {
      return NextResponse.json(
        fallbackData.orders.filter((order: any) =>
          String(order.userId || order.customer?.userId || '') === userId
        ),
        { headers: cacheHeaders }
      );
    }
    return NextResponse.json(
      fallbackData.orders.filter((order: any) => {
        const orderUserId = String(order.userId || order.customer?.userId || '');
        if (orderUserId) return false;
        return (
          (mobile && order.customer?.mobile?.replace(/\D/g, '') === mobile.replace(/\D/g, '')) ||
          (email && order.customer?.email?.toLowerCase() === email.toLowerCase())
        );
      }),
      { headers: cacheHeaders }
    );
  } else if (action === 'getInquiries') {
    return NextResponse.json(fallbackData.inquiries, { headers: cacheHeaders });
  } else if (action === 'getCancellationRequests') {
    return NextResponse.json(fallbackData.cancellationRequests || [], { headers: cacheHeaders });
  } else if (action === 'getUsers') {
    return NextResponse.json(fallbackData.users, { headers: cacheHeaders });
  } else if (action === 'getNotifications' || action === 'getCustomerNotifications') {
    return NextResponse.json(fallbackData.notifications.filter((notification: any) =>
      (!notification.TargetAudience || notification.TargetAudience === 'CUSTOMER_NOTIFICATION') &&
      (!notification.UserID || String(notification.UserID) === userId) &&
      (!notification.Username || String(notification.Username).toLowerCase() === email.toLowerCase())
    ), { headers: cacheHeaders });
  } else if (action === 'getCustomerNotificationLog') {
    return NextResponse.json(fallbackData.notifications.filter((notification: any) =>
      notification.TargetAudience === 'CUSTOMER_NOTIFICATION' && notification.EventType === 'ADMIN_BROADCAST'
    ), { headers: cacheHeaders });
  } else if (action === 'getAdminUpdates') {
    return NextResponse.json(fallbackData.notifications.filter((notification: any) =>
      notification.TargetAudience === 'ADMIN_UPDATE'
    ), { headers: cacheHeaders });
  } else {
    // Return all customer CMS collections
    return NextResponse.json({
      banners: await mapUploadedImagesFromStorage(fallbackData.banners, 'banners', fallbackData.banners),
      products: await mapUploadedImagesFromStorage(fallbackData.products, 'products', fallbackData.products),
      faqs: fallbackData.faqs,
      companyInfo: mergeCompanyInfo(fallbackData.companyInfo)
    }, { headers: cacheHeaders });
  }
}

// Proxy POST requests to Google Apps Script
export async function handlePost(req: NextRequest) {
  await syncLocalDB('load');
  try {
    const body = await req.json();
    const payload = { ...body };
    if (['googleSignIn', 'requestOTP', 'resetPassword'].includes(String(payload.type || '')) && payload.email) {
      payload.email = String(payload.email).trim().toLowerCase();
    }
    if (payload.type === 'login' && payload.username) {
      const identifier = String(payload.username).trim();
      payload.username = identifier.includes('@') ? identifier.toLowerCase() : identifier;
    }
    let backendError = '';
    const cmsCrudType = payload.type === 'productCRUD' || payload.type === 'bannerCRUD' ? payload.type : '';
    const cmsCrudAction = String(payload.action || 'create');
    if (cmsCrudType && !isAdminStorageRequest(req)) {
      return NextResponse.json(
        { success: false, message: 'Admin authentication is required.' },
        { status: 401 }
      );
    }
    const localProductImagePath = payload.type === 'productCRUD' && payload.product
      ? getStoredUploadValue(payload.product.ImageUrl)
      : '';
    const localBannerImagePath = payload.type === 'bannerCRUD' && payload.banner
      ? getStoredUploadValue(payload.banner.ImageUrl)
      : '';

    if (payload.type === 'productCRUD' && cmsCrudAction !== 'delete') {
      if (payload.product?.Specifications && String(payload.product.Specifications).length > 215) {
        return NextResponse.json(
          { success: false, message: 'Specification Details cannot exceed 215 characters.' },
          { status: 400 }
        );
      }
    }

    if (
      payload.type === 'productCRUD' &&
      cmsCrudAction !== 'delete'
    ) {
      // For updates, allow the existing stored image path even if the file isn't on disk
      // (admin only changed text fields). Only enforce disk-existence for new uploads.
      const existingProductInDB = cmsCrudAction === 'update' && payload.product?.ID
        ? (fallbackData.products || []).find((p: any) => String(p.ID) === String(payload.product.ID))
        : null;
      const existingProductPath = existingProductInDB ? getStoredUploadValue(existingProductInDB.ImageUrl) : '';
      const productImageOmittedForUpdate = cmsCrudAction === 'update' &&
        !Object.prototype.hasOwnProperty.call(payload.product || {}, 'ImageUrl');
      const productImageUnchanged = Boolean(existingProductPath && existingProductPath === localProductImagePath);
      const productImageOk = productImageOmittedForUpdate ||
        productImageUnchanged ||
        (localProductImagePath && await uploadFileExists(localProductImagePath, 'products'));
      if (!productImageOk) {
        return NextResponse.json(
          { success: false, message: 'Upload a valid product image before saving.' },
          { status: 400 }
        );
      }
    }
    if (
      payload.type === 'bannerCRUD' &&
      cmsCrudAction !== 'delete'
    ) {
      const existingBannerInDB = cmsCrudAction === 'update' && payload.banner?.ID
        ? (fallbackData.banners || []).find((b: any) => String(b.ID) === String(payload.banner.ID))
        : null;
      const existingBannerPath = existingBannerInDB ? getStoredUploadValue(existingBannerInDB.ImageUrl) : '';
      const bannerImageUnchanged = Boolean(existingBannerPath && existingBannerPath === localBannerImagePath);
      const bannerImageOk = bannerImageUnchanged || (localBannerImagePath && await uploadFileExists(localBannerImagePath, 'banners'));
      if (!bannerImageOk) {
        return NextResponse.json(
          { success: false, message: 'Upload a valid banner image before saving.' },
          { status: 400 }
        );
      }
    }

    // Store the storage path in Sheets (e.g. "products/filename.jpg") so that
    // mapUploadedImagesFromStorage can resolve it to a served URL on read.
    // oldImagePath is a frontend-only coordination field; strip it before sending.
    if (payload.type === 'productCRUD' && payload.product) {
      const { oldImagePath: _op, ...productFields } = payload.product;
      // For updates, preserve the existing image path when no new image was uploaded
      const existingProductForPath = cmsCrudAction === 'update' && payload.product.ID
        ? (fallbackData.products || []).find((p: any) => String(p.ID) === String(payload.product.ID))
        : null;
      const productImageOmittedForUpdate = cmsCrudAction === 'update' &&
        !Object.prototype.hasOwnProperty.call(payload.product || {}, 'ImageUrl');
      const resolvedProductPath = localProductImagePath ||
        (existingProductForPath ? getStoredUploadValue(existingProductForPath.ImageUrl) : '');
      payload.product = productImageOmittedForUpdate
        ? productFields
        : { ...productFields, ImageUrl: resolvedProductPath };
    } else if (payload.type === 'bannerCRUD' && payload.banner) {
      const { oldImagePath: _ob, ...bannerFields } = payload.banner;
      const existingBannerForPath = cmsCrudAction === 'update' && payload.banner.ID
        ? (fallbackData.banners || []).find((b: any) => String(b.ID) === String(payload.banner.ID))
        : null;
      const resolvedBannerPath = localBannerImagePath ||
        (existingBannerForPath ? getStoredUploadValue(existingBannerForPath.ImageUrl) : '');
      payload.banner = { ...bannerFields, ImageUrl: resolvedBannerPath };
    }

    invalidateCMSCache(payload.type);

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

    if (payload.type === 'userCRUD' && payload.action === 'delete') {
      try {
        const requestedId = String(payload.user?.ID ?? '').trim();
        if (!requestedId) {
          return NextResponse.json({ success: false, message: 'Customer ID is required for deletion.' }, { status: 400 });
        }

        let users = fallbackData.users || [];
        let orders = fallbackData.orders || [];
        let cancellationRequests = fallbackData.cancellationRequests || [];
        if (getAppsScriptUrl()) {
          const [liveUsers, liveOrders, liveRequests] = await Promise.all([
            fetchAppsScriptData('getUsers'),
            fetchAppsScriptData('getOrders'),
            fetchAppsScriptData('getCancellationRequests'),
          ]);
          users = Array.isArray(liveUsers) ? liveUsers : [];
          orders = Array.isArray(liveOrders) ? liveOrders : [];
          cancellationRequests = Array.isArray(liveRequests) ? liveRequests : [];
        }

        const customer = users.find((user: any) => String(user.ID) === requestedId);
        if (!customer) {
          return NextResponse.json({ success: false, message: 'Customer record not found for deletion.' }, { status: 404 });
        }
        const eligibility = getCustomerDeletionEligibility(customer, orders, cancellationRequests);
        if (!eligibility.eligible) {
          return NextResponse.json({ success: false, ...eligibility }, { status: 409 });
        }
      } catch (error) {
        console.error('[Customer deletion] Eligibility validation failed:', error);
        return NextResponse.json(
          { success: false, message: 'Customer deletion could not be validated. Please retry.' },
          { status: 503 }
        );
      }
    }

    if (payload.type === 'googleSignIn' && payload.intent === 'register') {
      try {
        const googleEmail = String(payload.email || '').trim().toLowerCase();
        const users = getAppsScriptUrl()
          ? await fetchAppsScriptData('getUsers')
          : (fallbackData.users || []);
        const existingUser = (Array.isArray(users) ? users : []).find(
          (user: any) => String(user.Username || user.Email || '').trim().toLowerCase() === googleEmail
        );
        if (existingUser) {
          return NextResponse.json({
            success: false,
            code: 'ACCOUNT_ALREADY_REGISTERED',
            registeredEmail: googleEmail,
            message: 'Account already registered. Want to log in?',
          });
        }
      } catch (error) {
        console.error('[Google registration] Existing-account check failed:', error);
        return NextResponse.json(
          { success: false, message: 'Unable to verify this Google account. Please try again.' },
          { status: 503 }
        );
      }
    }

    const urlValPost = getAppsScriptUrl();
    if (urlValPost) {
      try {
        const postToAppsScript = () => fetch(urlValPost, {
            method: 'POST',
            redirect: 'follow',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(payload),
          });
        const retryableAccountRead = payload.type === 'getCart' || (
          payload.type === 'accountSettings' &&
          ['getPreferences', 'getDeletionStatus'].includes(String(payload.action || ''))
        );
        let res: Response;
        try {
          res = await postToAppsScript();
        } catch (firstError) {
          if (!retryableAccountRead) throw firstError;
          console.warn(`[CMS API Proxy] Retrying read-only account settings request after Google connection failure.`);
          res = await postToAppsScript();
        }

        const text = await res.text();
        if (!text.trim().startsWith('<')) {
          const data = JSON.parse(text);
          if (payload.type === 'resetPassword' && data.success) {
            const normalizedEmail = String(payload.email || '').trim().toLowerCase();
            const expectedHash = hashLocalPassword(String(payload.newPassword || ''));
            let liveUsers = await fetchAppsScriptData('getUsers');
            let savedUser = (Array.isArray(liveUsers) ? liveUsers : []).find(
              (user: any) => String(user.Username || user.Email || '').trim().toLowerCase() === normalizedEmail
            );

            if (!savedUser) {
              return NextResponse.json({ success: false, message: 'Password reset failed because the account could not be confirmed.' }, { status: 409 });
            }

            if (String(savedUser.Password || '') !== expectedHash) {
              const update = await postAppsScriptData({
                type: 'userCRUD',
                action: 'update',
                user: { ID: savedUser.ID, Password: expectedHash },
              });
              if (!update?.success) {
                return NextResponse.json({ success: false, message: update?.message || 'The new password could not be saved.' }, { status: 409 });
              }
              liveUsers = await fetchAppsScriptData('getUsers');
              savedUser = (Array.isArray(liveUsers) ? liveUsers : []).find(
                (user: any) => String(user.Username || user.Email || '').trim().toLowerCase() === normalizedEmail
              );
            }

            if (String(savedUser?.Password || '') !== expectedHash) {
              return NextResponse.json({ success: false, message: 'The backend could not confirm the new password was saved.' }, { status: 409 });
            }

            localOTPCache.delete(normalizedEmail);
            liveGetCache.clear();
            invalidateCMSCache('resetPassword');
          }
          if (cmsCrudType && data.success) {
            const entityBody = cmsCrudType === 'productCRUD' ? body.product || {} : body.banner || {};
            // Use the resolved path (may fall back to existing stored path when image wasn't changed)
            const newImagePath = cmsCrudType === 'productCRUD'
              ? (localProductImagePath || (payload.product ? getStoredUploadValue(payload.product.ImageUrl) : ''))
              : (localBannerImagePath || (payload.banner ? getStoredUploadValue(payload.banner.ImageUrl) : ''));
            const oldImagePath = getStoredUploadValue(entityBody.oldImagePath);

            // Delete the previous stored object only after Sheets confirms the update.
            if (cmsCrudAction === 'update' && oldImagePath && newImagePath && oldImagePath !== newImagePath) {
              await deleteUploadedFile(oldImagePath);
            }
            // Delete image on record deletion
            if (cmsCrudAction === 'delete' && entityBody.ImageUrl) {
              await deleteUploadedFile(entityBody.ImageUrl);
            }

            await saveLocalImageBinding(
              cmsCrudType,
              cmsCrudAction,
              entityBody,
              data,
              newImagePath
            );
          }
          invalidateCMSCache(payload.type);
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

      // Create Admin Notification
      const adminNotif = {
        ID: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        Timestamp: now,
        CreatedAt: now,
        Title: 'New Order Placed',
        Message: `Order ${orderId} has been placed by ${payload.customer?.name || 'Customer'} for a total of ₹${payload.total || 0}.`,
        Read: false,
        Status: 'Published',
        Role: 'Admin',
        Category: 'Orders',
        Priority: 'High',
        ActionLink: 'orders',
      };
      if (!fallbackData.notifications) fallbackData.notifications = [];
      fallbackData.notifications.unshift(adminNotif);

      await syncLocalDB('save');
      const customerUserId = String(payload.userId || payload.customer?.userId || '').trim();
      const customerEmail = String(payload.customer?.email || '').trim().toLowerCase();
      const customerMobile = String(payload.customer?.mobile || '').replace(/\D/g, '').slice(-10);
      const customerOrders = fallbackData.orders.filter((order: CustomerOrderIdentity) => {
        const orderUserId = String(order.userId || order.customer?.userId || '').trim();
        const orderEmail = String(order.customer?.email || '').trim().toLowerCase();
        const orderMobile = String(order.customer?.mobile || '').replace(/\D/g, '').slice(-10);
        if (customerUserId) return orderUserId === customerUserId;
        if (orderUserId) return false;
        return Boolean((customerEmail && orderEmail === customerEmail) || (customerMobile && orderMobile === customerMobile));
      });
      return NextResponse.json({
        success: true,
        message: 'Order placed successfully (local fallback mode)',
        orderId: orderId,
        orders: customerOrders,
      });
    } else if (payload.type === 'requestOrderCancellation') {
      const { orderId, reason } = payload;
      const orderIndex = fallbackData.orders.findIndex((o: any) => String(o.orderId) === String(orderId));
      const now = new Date().toISOString();
      const requestId = `CR-${Date.now()}`;
      if (orderIndex < 0) return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 });
      const currentStatus = String(fallbackData.orders[orderIndex].status || '').toLowerCase();
      if (!['pending', 'confirmed'].includes(currentStatus)) {
        return NextResponse.json({ success: false, message: 'This order is already being prepared and can no longer be cancelled.' }, { status: 400 });
      }
      if (fallbackData.orders[orderIndex].cancellationStatus === 'Pending') {
        return NextResponse.json({ success: false, message: 'A cancellation request is already pending for this order.' }, { status: 400 });
      }
      fallbackData.orders[orderIndex].cancellationStatus = 'Pending';
      fallbackData.orders[orderIndex].cancellationRequestId = requestId;
      fallbackData.orders[orderIndex].updatedAt = now;
      
      const newRequest = {
        requestId,
        orderId,
        customerName: fallbackData.orders[orderIndex]?.customer?.name || 'Customer',
        customerMobile: fallbackData.orders[orderIndex]?.customer?.mobile || '',
        customerEmail: fallbackData.orders[orderIndex]?.customer?.email || '',
        orderTotal: fallbackData.orders[orderIndex]?.total || 0,
        paymentMethod: fallbackData.orders[orderIndex]?.paymentMethod || 'Cash on Delivery',
        reason: reason || 'Customer requested cancellation',
        requestDate: now,
        status: 'Pending',
        statusHistory: [{ status: 'Requested', at: now, remarks: reason }]
      };
      if (!fallbackData.cancellationRequests) {
        fallbackData.cancellationRequests = [];
      }
      fallbackData.cancellationRequests.unshift(newRequest);

      // Create Admin Notification
      const adminNotif = {
        ID: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        Timestamp: now,
        CreatedAt: now,
        Title: 'Cancellation Requested',
        Message: `Cancellation request for order ${orderId} has been submitted. Reason: ${reason || 'None'}`,
        Read: false,
        Status: 'Published',
        Role: 'Admin',
        Category: 'Cancellation Requests',
        Priority: 'High',
        ActionLink: 'orders',
      };
      if (!fallbackData.notifications) fallbackData.notifications = [];
      fallbackData.notifications.unshift(adminNotif);

      await syncLocalDB('save');
      return NextResponse.json({
        success: true,
        message: 'Cancellation request submitted for admin approval (local fallback mode)'
      });
    } else if (payload.type === 'reviewCancellationRequest') {
      const { requestId, decision, adminName, adminRemarks } = payload;
      const reqIndex = (fallbackData.cancellationRequests || []).findIndex((r: any) => String(r.requestId) === String(requestId));
      const now = new Date().toISOString();
      let orderId = '';
      if (reqIndex >= 0) {
        fallbackData.cancellationRequests[reqIndex].status = decision;
        fallbackData.cancellationRequests[reqIndex].approvalDate = now;
        fallbackData.cancellationRequests[reqIndex].adminName = adminName;
        fallbackData.cancellationRequests[reqIndex].adminRemarks = adminRemarks;
        fallbackData.cancellationRequests[reqIndex].statusHistory.push({
          status: decision === 'Approved' ? 'Approved' : 'Rejected',
          at: now,
          by: adminName,
          remarks: adminRemarks
        });
        orderId = fallbackData.cancellationRequests[reqIndex].orderId;
        
        const orderIndex = fallbackData.orders.findIndex((o: any) => String(o.orderId) === String(orderId));
        if (orderIndex >= 0) {
          fallbackData.orders[orderIndex].cancellationStatus = decision;
          if (decision === 'Approved') {
            fallbackData.orders[orderIndex].status = 'Cancelled';
          }
          fallbackData.orders[orderIndex].updatedAt = now;

          // Create Customer Notification
          const customerNotif = {
            ID: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            Timestamp: now,
            CreatedAt: now,
            Title: `Cancellation Request ${decision}`,
            Message: `Your cancellation request for order ${orderId} has been ${decision.toLowerCase()}. Remarks: ${adminRemarks || 'None'}`,
            Read: false,
            Status: 'Published',
            Role: 'Customer',
            Category: 'Cancellation Requests',
            Priority: 'High',
            ActionLink: '/customer-portal?tab=orders',
            UserId: fallbackData.orders[orderIndex].userId || fallbackData.orders[orderIndex].customer?.userId,
            Username: fallbackData.orders[orderIndex].customer?.email
          };
          if (!fallbackData.notifications) fallbackData.notifications = [];
          fallbackData.notifications.unshift(customerNotif);
        }
      }
      await syncLocalDB('save');
      return NextResponse.json({
        success: true,
        message: `Cancellation request ${String(decision || '').toLowerCase()} (local fallback mode)`
      });
    } else if (payload.type === 'updateOrderStatus') {
      const { orderId, status } = payload;
      const orderIndex = fallbackData.orders.findIndex((o: any) => String(o.orderId) === String(orderId));
      const now = new Date().toISOString();
      if (orderIndex >= 0) {
        fallbackData.orders[orderIndex].status = status;
        fallbackData.orders[orderIndex].updatedAt = now;

        // Create Customer Notification
        const customerNotif = {
          ID: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          Timestamp: now,
          CreatedAt: now,
          Title: `Order Status Updated`,
          Message: `Your order ${orderId} status has been updated to ${status}.`,
          Read: false,
          Status: 'Published',
          Role: 'Customer',
          Category: 'Delivery Updates',
          Priority: 'Medium',
          ActionLink: '/customer-portal?tab=orders',
          UserId: fallbackData.orders[orderIndex].userId || fallbackData.orders[orderIndex].customer?.userId,
          Username: fallbackData.orders[orderIndex].customer?.email
        };
        if (!fallbackData.notifications) fallbackData.notifications = [];
        fallbackData.notifications.unshift(customerNotif);
      }
      await syncLocalDB('save');
      return NextResponse.json({
        success: true,
        message: `Updated status to ${status} successfully`
      });
    } else if (payload.type === 'inquiry') {
      const now = new Date().toISOString();
      const newInquiry = {
        Timestamp: now,
        Name: payload.name,
        Email: payload.email,
        Phone: payload.phone,
        Subject: payload.subject,
        Message: payload.message,
        Status: 'New'
      };
      if (!fallbackData.inquiries) {
        fallbackData.inquiries = [];
      }
      fallbackData.inquiries.unshift(newInquiry);

      // Create Admin Notification
      const adminNotif = {
        ID: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        Timestamp: now,
        CreatedAt: now,
        Title: 'New Inquiry Received',
        Message: `Inquiry from ${payload.name}: "${payload.subject}"`,
        Read: false,
        Status: 'Published',
        Role: 'Admin',
        Category: 'Inquiries',
        Priority: 'Medium',
        ActionLink: 'inquiries',
      };
      if (!fallbackData.notifications) fallbackData.notifications = [];
      fallbackData.notifications.unshift(adminNotif);

      await syncLocalDB('save');
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
    } else if (payload.type === 'accountSettings') {
      const action = String(payload.action || '');
      const userIndex = fallbackData.users.findIndex((user: any) => String(user.ID) === String(payload.userId));
      if (userIndex < 0) {
        return NextResponse.json({ success: false, message: 'Account not found.' }, { status: 404 });
      }

      const currentUser = fallbackData.users[userIndex];
      if (action === 'getPreferences') {
        const preferences = normalizeEmailPreferences(currentUser.EmailPreferences);
        currentUser.EmailPreferences = JSON.stringify(preferences);
        await syncLocalDB('save');
        return NextResponse.json({ success: true, message: 'Preferences loaded.', preferences });
      }

      if (action === 'updatePreferences') {
        const preferences = normalizeEmailPreferences(payload.preferences);
        currentUser.EmailPreferences = JSON.stringify(preferences);
        await syncLocalDB('save');
        return NextResponse.json({ success: true, message: 'Email preferences saved.', preferences });
      }

      const activeStatuses = new Set(['pending', 'confirmed', 'processing', 'packed', 'out for delivery', 'in transit']);
      const ownedOrders = fallbackData.orders.filter((order: any) =>
        String(order.userId || order.customer?.userId || '').trim() === String(payload.userId).trim()
      );
      const activeOrders = ownedOrders
        .filter((order: any) => activeStatuses.has(String(order.status || '').trim().toLowerCase()))
        .map((order: any) => ({ orderId: order.orderId, status: order.status }));

      if (action === 'getDeletionStatus') {
        return NextResponse.json({ success: true, message: activeOrders.length ? 'Active orders must be completed or cancelled before account deletion.' : 'Account can be deleted.', hasActiveOrders: activeOrders.length > 0, activeOrders });
      }

      const registeredEmail = String(currentUser.Username || '').trim().toLowerCase();
      if (action === 'sendDeletionOTP') {
        const requestedEmail = String(payload.email || '').trim().toLowerCase();
        if (!requestedEmail || requestedEmail !== registeredEmail) {
          return NextResponse.json({ success: false, message: 'The email address must match your registered email.' }, { status: 400 });
        }
        if (activeOrders.length) return NextResponse.json({ success: false, message: 'Your account cannot be deleted while active orders exist.', hasActiveOrders: true }, { status: 409 });
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        localDeletionOTPCache.set(String(payload.userId), { otp, email: registeredEmail, expiresAt: Date.now() + 10 * 60 * 1000, attempts: 0 });
        console.info(`[Local fallback] Account deletion OTP for ${registeredEmail}: ${otp}`);
        return NextResponse.json({ success: true, message: 'OTP sent successfully to your registered email.' });
      }

      if (action === 'verifyDeletionOTP') {
        const state = localDeletionOTPCache.get(String(payload.userId));
        if (!state || Date.now() > state.expiresAt) {
          localDeletionOTPCache.delete(String(payload.userId));
          return NextResponse.json({ success: false, message: 'OTP has expired. Please request a new code.', expired: true }, { status: 400 });
        }
        if (String(payload.email || '').trim().toLowerCase() !== state.email) return NextResponse.json({ success: false, message: 'The email address must match your registered email.' }, { status: 400 });
        if (String(payload.otp || '') !== state.otp) {
          state.attempts += 1;
          if (state.attempts >= 5) localDeletionOTPCache.delete(String(payload.userId));
          return NextResponse.json({ success: false, message: state.attempts >= 5 ? 'Maximum OTP attempts reached. Request a new code.' : 'Incorrect OTP.', attemptsRemaining: Math.max(0, 5 - state.attempts) }, { status: 400 });
        }
        state.verified = true;
        state.otp = '';
        return NextResponse.json({ success: true, message: 'Email verified successfully.', otpVerified: true });
      }

      if (action === 'changePassword') {
        const currentPassword = String(payload.currentPassword || '');
        const newPassword = String(payload.newPassword || '');
        if (!localPasswordMatches(currentUser.Password, currentPassword)) {
          return NextResponse.json({ success: false, message: 'Current password is incorrect.' }, { status: 400 });
        }
        if (newPassword.length < 6) {
          return NextResponse.json({ success: false, message: 'New password must be at least 6 characters.' }, { status: 400 });
        }
        currentUser.Password = hashLocalPassword(newPassword);
        await syncLocalDB('save');
        return NextResponse.json({ success: true, message: 'Password changed successfully.' });
      }

      if (action === 'deleteAccount') {
        if (activeOrders.length) {
          return NextResponse.json({ success: false, message: 'Your account cannot be deleted until all active orders are completed or cancelled.', hasActiveOrders: true, activeOrders }, { status: 409 });
        }
        const deletionVerification = localDeletionOTPCache.get(String(payload.userId));
        if (!deletionVerification?.verified || deletionVerification.email !== registeredEmail || Date.now() > deletionVerification.expiresAt) {
          return NextResponse.json({ success: false, message: 'Email verification is required before deleting your account.' }, { status: 403 });
        }
        fallbackData.users.splice(userIndex, 1);
        fallbackData.carts = (fallbackData.carts || []).filter((cart: any) => String(cart.userId) !== String(payload.userId));
        fallbackData.orders = fallbackData.orders.filter((order: any) => String(order.userId || order.customer?.userId || '').trim() !== String(payload.userId).trim());
        fallbackData.notifications = (fallbackData.notifications || []).filter((event: any) => String(event.UserID || event.UserId || '').trim() !== String(payload.userId).trim());
        localDeletionOTPCache.delete(String(payload.userId));
        await syncLocalDB('save');
        return NextResponse.json({ success: true, message: 'Account deleted successfully.', confirmationEmailSent: false });
      }

      return NextResponse.json({ success: false, message: 'Unsupported account settings action.' }, { status: 400 });
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
        if (userIndex >= 0) {
          return NextResponse.json({ success: false, message: 'An account with this email already exists.' }, { status: 409 });
        }
        const password = String(incomingUser.Password || '');
        const newUser = {
          ID: incomingUser.ID || Date.now(),
          ...incomingUser,
          Password: password ? hashLocalPassword(password) : '',
          SavedAddresses: incomingUser.SavedAddresses || '[]',
          RecentlyViewed: incomingUser.RecentlyViewed || '[]',
          EmailPreferences: incomingUser.EmailPreferences || JSON.stringify(EMAIL_PREFERENCE_DEFAULTS)
        };
        fallbackData.users.push(newUser);
        await syncLocalDB('save');
        return NextResponse.json({ success: true, message: 'User created successfully', ID: newUser.ID });
      }

      if (action === 'delete') {
        if (userIndex < 0) {
          return NextResponse.json({ success: false, message: 'User record not found for deletion.' }, { status: 404 });
        }
        const [deletedUser] = fallbackData.users.splice(userIndex, 1);
        await syncLocalDB('save');
        return NextResponse.json({ success: true, message: 'User deleted successfully', ID: deletedUser.ID });
      }

      return NextResponse.json({ success: false, message: 'Unsupported user action.' }, { status: 400 });
    } else if (payload.type === 'eventCRUD') {
      const action = payload.action || 'create';
      const incomingEvent = payload.event || {};
      const eventId = incomingEvent.EventID || incomingEvent.ID;
      if (action === 'delete') {
        fallbackData.notifications = fallbackData.notifications.filter((event: any) => String(event.EventID || event.ID) !== String(eventId));
        await syncLocalDB('save');
        return NextResponse.json({ success: true, message: 'Event deleted successfully' });
      }
      if (action === 'update') {
        const eventIndex = fallbackData.notifications.findIndex((event: any) => String(event.EventID || event.ID) === String(eventId));
        if (eventIndex < 0) return NextResponse.json({ success: false, message: 'Event not found.' }, { status: 404 });
        fallbackData.notifications[eventIndex] = { ...fallbackData.notifications[eventIndex], ...incomingEvent };
        await syncLocalDB('save');
        return NextResponse.json({ success: true, message: 'Event updated successfully', ID: eventId });
      }
      if (action === 'create') {
        const allowedCategories = ['Offers/Promotions', 'News', 'Updates'];
        if (incomingEvent.EventType === 'ADMIN_BROADCAST' && (
          incomingEvent.TargetAudience !== 'CUSTOMER_NOTIFICATION' || !allowedCategories.includes(incomingEvent.Category)
        )) {
          return NextResponse.json({ success: false, message: 'Customer broadcasts must use Offers/Promotions, News, or Updates.' }, { status: 400 });
        }
        const newEvent = {
          ...incomingEvent,
          ID: eventId || Date.now(),
          EventID: eventId || Date.now(),
          Timestamp: new Date().toISOString(),
          CreatedAt: new Date().toISOString(),
          Status: incomingEvent.Status || 'Published',
          Read: false,
          ActionLink: incomingEvent.EventType === 'ADMIN_BROADCAST' ? '' : incomingEvent.ActionLink,
        };
        fallbackData.notifications.push(newEvent);
        await syncLocalDB('save');
        return NextResponse.json({ success: true, message: 'Event created successfully', ID: newEvent.EventID });
      }
      return NextResponse.json({ success: false, message: 'Unsupported event action.' }, { status: 400 });
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
      const { oldImagePath: _opLocal, ...productPayload } = payload.product || {};
      const incomingProduct = {
        ...productPayload,
        ...(localProductImagePath ? { ImageUrl: localProductImagePath } : {}),
      };
      if (action === 'delete') {
        const idToDelete = incomingProduct.ID;
        const existing = fallbackData.products.find((p: any) => String(p.ID) === String(idToDelete));
        fallbackData.products = fallbackData.products.filter((p: any) => String(p.ID) !== String(idToDelete));
        await syncLocalDB('save');
        // Delete associated image file from disk
        if (existing?.ImageUrl) {
          await deleteUploadedFile(existing.ImageUrl);
        }
        return NextResponse.json({ success: true, message: 'Product deleted successfully' });
      }
      if (action === 'update') {
        const idx = fallbackData.products.findIndex((p: any) => String(p.ID) === String(incomingProduct.ID));
        if (idx >= 0) {
          const oldImagePath = String(fallbackData.products[idx].ImageUrl || '');
          fallbackData.products[idx] = { ...fallbackData.products[idx], ...incomingProduct };
          await syncLocalDB('save');
          // Delete old image if a different image was provided
          const newImagePath = String(incomingProduct.ImageUrl || '');
          if (oldImagePath && newImagePath && newImagePath !== oldImagePath) {
            await deleteUploadedFile(oldImagePath);
          }
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
      const { oldImagePath: _obLocal, ...bannerPayload } = payload.banner || {};
      const incomingBanner = {
        ...bannerPayload,
        ...(localBannerImagePath ? { ImageUrl: localBannerImagePath } : {}),
      };
      if (action === 'delete') {
        const idToDelete = incomingBanner.ID;
        const existing = fallbackData.banners.find((b: any) => String(b.ID) === String(idToDelete));
        fallbackData.banners = fallbackData.banners.filter((b: any) => String(b.ID) !== String(idToDelete));
        await syncLocalDB('save');
        // Delete associated image file from disk
        if (existing?.ImageUrl) {
          await deleteUploadedFile(existing.ImageUrl);
        }
        return NextResponse.json({ success: true, message: 'Banner deleted successfully' });
      }
      if (action === 'update') {
        const idx = fallbackData.banners.findIndex((b: any) => String(b.ID) === String(incomingBanner.ID));
        if (idx >= 0) {
          const oldImagePath = String(fallbackData.banners[idx].ImageUrl || '');
          fallbackData.banners[idx] = { ...fallbackData.banners[idx], ...incomingBanner };
          await syncLocalDB('save');
          // Delete old image if a different image was provided
          const newImagePath = String(incomingBanner.ImageUrl || '');
          if (oldImagePath && newImagePath && newImagePath !== oldImagePath) {
            await deleteUploadedFile(oldImagePath);
          }
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
