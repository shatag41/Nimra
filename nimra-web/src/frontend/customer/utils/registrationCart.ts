import type { CartItem } from '@/types/cms';
import { fetchCart, syncCart } from '@/utils/api';
import { mergeCartSnapshots, normalizeCartItem } from './commerce';

export const REGISTRATION_CONTEXT_KEY = 'nimra_registration_redirect_context';

export type RegistrationSource = 'cart' | 'portal';

const GUEST_CART_KEYS = ['nimra-cart', 'nimra-cart-v2:guest'] as const;

const readCart = (key: string): CartItem[] => {
  try {
    const raw = localStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.map((item) => normalizeCartItem(item as CartItem))
      : [];
  } catch {
    return [];
  }
};

export const registrationSourceFromSearch = (search: string): RegistrationSource => {
  const params = new URLSearchParams(search);
  const nextPath = params.get('next');
  return params.get('source') === 'cart' || nextPath === '/cart' || nextPath === '/checkout' || nextPath?.startsWith('/checkout?')
    ? 'cart'
    : 'portal';
};

export const hasGuestCartItems = () =>
  GUEST_CART_KEYS.some((key) => readCart(key).length > 0);

/**
 * Associates the guest snapshot with a newly-created customer. Guest storage is
 * deliberately retained until the customer cart has been accepted by the API.
 */
export const mergeGuestCartIntoNewCustomer = async (userId: string | number) => {
  const guestItems = mergeCartSnapshots(GUEST_CART_KEYS.flatMap(readCart));
  if (guestItems.length === 0) return { success: true, merged: false };

  const userCartKey = `nimra-cart-${userId}`;
  const localCustomerItems = readCart(userCartKey);
  let cloudItems: CartItem[] = [];

  try {
    cloudItems = await fetchCart(userId);
  } catch {
    // A brand-new account may not have a cart row yet; cartSync creates it.
  }

  const mergedItems = mergeCartSnapshots([
    ...cloudItems.map(normalizeCartItem),
    ...localCustomerItems,
    ...guestItems,
  ]);
  const result = await syncCart(userId, mergedItems);

  if (!result.success) {
    return { success: false, merged: false, message: result.message };
  }

  localStorage.setItem(userCartKey, JSON.stringify(mergedItems));
  GUEST_CART_KEYS.forEach((key) => localStorage.removeItem(key));
  return { success: true, merged: true };
};
