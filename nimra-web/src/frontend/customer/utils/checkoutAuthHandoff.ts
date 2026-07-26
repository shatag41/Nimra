import type { CartItem } from '@/types/cms';
import { mergeCartSnapshots, normalizeCartItem } from './commerce';

const RETURN_KEY = 'nimra_auth_return_to';
const CART_SNAPSHOT_KEY = 'nimra_auth_guest_cart_snapshot';
const RETURN_COOKIE = 'nimra_auth_return_to';
const MAX_AGE_MS = 60 * 60 * 1000;
const GUEST_CART_KEYS = ['nimra-cart', 'nimra-cart-v2:guest'] as const;

type StoredReturn = {
  path: string;
  createdAt: number;
};

const safeCheckoutPath = (value?: string | null) =>
  value?.startsWith('/checkout') && !value.startsWith('//') ? value : null;

const readCookie = () => {
  if (typeof document === 'undefined') return null;
  const prefix = `${RETURN_COOKIE}=`;
  const value = document.cookie.split('; ').find(item => item.startsWith(prefix))?.slice(prefix.length);
  if (!value) return null;
  try {
    return safeCheckoutPath(decodeURIComponent(value));
  } catch {
    return null;
  }
};

const readStoredReturn = (storage: Storage) => {
  try {
    const raw = storage.getItem(RETURN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredReturn;
    if (Date.now() - Number(parsed.createdAt || 0) > MAX_AGE_MS) {
      storage.removeItem(RETURN_KEY);
      return null;
    }
    return safeCheckoutPath(parsed.path);
  } catch {
    return null;
  }
};

const readGuestItems = () => {
  if (typeof window === 'undefined') return [];
  return mergeCartSnapshots(GUEST_CART_KEYS.flatMap(key => {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(parsed) ? parsed.map(item => normalizeCartItem(item as CartItem)) : [];
    } catch {
      return [];
    }
  }));
};

export const persistCheckoutAuthHandoff = (returnTo = '/checkout') => {
  if (typeof window === 'undefined') return;
  const path = safeCheckoutPath(returnTo) || '/checkout';
  const payload = JSON.stringify({ path, createdAt: Date.now() } satisfies StoredReturn);
  sessionStorage.setItem(RETURN_KEY, payload);
  localStorage.setItem(RETURN_KEY, payload);

  const guestItems = readGuestItems();
  if (guestItems.length > 0) {
    const snapshot = JSON.stringify(guestItems);
    sessionStorage.setItem(CART_SNAPSHOT_KEY, snapshot);
    localStorage.setItem(CART_SNAPSHOT_KEY, snapshot);
  }

  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${RETURN_COOKIE}=${encodeURIComponent(path)}; Path=/; Max-Age=3600; SameSite=Lax${secure}`;
};

export const readCheckoutAuthReturn = () => {
  if (typeof window === 'undefined') return null;
  return readStoredReturn(sessionStorage) || readStoredReturn(localStorage) || readCookie();
};

export const restoreGuestCartFromAuthHandoff = () => {
  if (typeof window === 'undefined' || readGuestItems().length > 0) return;
  const raw = sessionStorage.getItem(CART_SNAPSHOT_KEY) || localStorage.getItem(CART_SNAPSHOT_KEY);
  if (!raw) return;
  try {
    const parsed: unknown = JSON.parse(raw);
    const items = Array.isArray(parsed)
      ? mergeCartSnapshots(parsed.map(item => normalizeCartItem(item as CartItem)))
      : [];
    if (items.length > 0) localStorage.setItem('nimra-cart', JSON.stringify(items));
  } catch {
    // Ignore an invalid recovery snapshot and leave the active cart untouched.
  }
};

export const clearCheckoutAuthHandoff = () => {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(RETURN_KEY);
  sessionStorage.removeItem(CART_SNAPSHOT_KEY);
  localStorage.removeItem(RETURN_KEY);
  localStorage.removeItem(CART_SNAPSHOT_KEY);
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${RETURN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
};
