import type { CartItem, OrderRecord } from '@/types/cms';
import { cartSubtotal, deliveryChargeFor, mergeCartItems, normalizeCartItem } from './commerce';

const REORDER_DRAFT_KEY = 'nimra-reorder-checkout-draft';

export interface ReorderCheckoutDraft {
  sourceOrderId: string;
  createdAt: string;
  items: CartItem[];
}

export const normalizeReorderItems = (items: CartItem[] = []) =>
  mergeCartItems(
    items
      .filter(Boolean)
      .map(normalizeCartItem)
      .filter((item) => item.productId && item.name && item.quantity > 0)
  );

export const createReorderCheckoutDraft = (order: OrderRecord) => {
  const items = normalizeReorderItems(order.items || []);
  if (!items.length) return null;
  const draft: ReorderCheckoutDraft = {
    sourceOrderId: order.orderId,
    createdAt: new Date().toISOString(),
    items,
  };
  sessionStorage.setItem(REORDER_DRAFT_KEY, JSON.stringify(draft));
  return draft;
};

export const readReorderCheckoutDraft = (): ReorderCheckoutDraft | null => {
  try {
    const raw = sessionStorage.getItem(REORDER_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ReorderCheckoutDraft;
    const items = normalizeReorderItems(parsed.items || []);
    if (!items.length) {
      sessionStorage.removeItem(REORDER_DRAFT_KEY);
      return null;
    }
    return { ...parsed, items };
  } catch {
    sessionStorage.removeItem(REORDER_DRAFT_KEY);
    return null;
  }
};

export const clearReorderCheckoutDraft = () => {
  sessionStorage.removeItem(REORDER_DRAFT_KEY);
};

export const totalsForCheckoutItems = (items: CartItem[]) => {
  const subtotal = cartSubtotal(items);
  const deliveryCharge = deliveryChargeFor(subtotal);
  return {
    subtotal,
    deliveryCharge,
    grandTotal: subtotal + deliveryCharge,
  };
};
