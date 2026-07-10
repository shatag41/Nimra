import { Product } from '@/types/cms';

export const RECENTLY_VIEWED_EVENT = 'nimra-recently-viewed-updated';
export const RECENTLY_VIEWED_GUEST_KEY = 'recentlyViewed_guest';
export const LEGACY_RECENTLY_VIEWED_KEY = 'nimra-recently-viewed';
export const MAX_RECENTLY_VIEWED_PRODUCTS = 10;

export const recentlyViewedKey = (userId?: number | string | null) =>
  userId !== undefined && userId !== null && String(userId).length > 0
    ? `recentlyViewed_user_${userId}`
    : RECENTLY_VIEWED_GUEST_KEY;

export const readRecentlyViewed = (userId?: number | string | null): Product[] => {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(recentlyViewedKey(userId)) || '[]');
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENTLY_VIEWED_PRODUCTS) : [];
  } catch {
    return [];
  }
};

export const notifyRecentlyViewedChanged = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(RECENTLY_VIEWED_EVENT));
};

export const discardLegacyRecentlyViewed = () => {
  if (typeof window !== 'undefined') window.localStorage.removeItem(LEGACY_RECENTLY_VIEWED_KEY);
};
