'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CartItem, Product } from '@/types/cms';
import { useAuth } from './AuthContext';
import { cartSubtotal, deliveryChargeFor, hydrateCartItemsFromCatalog, mergeCartItems, mergeCartSnapshots, normalizeCartItem, productToCartItem } from '../utils/commerce';
import { syncCart, fetchCart, fetchProducts } from '@/utils/api';
import { useNotification } from './NotificationContext';

interface CartContextValue {
  items: CartItem[];
  isHydrated: boolean;
  totalItems: number;
  subtotal: number;
  deliveryCharge: number;
  grandTotal: number;
  addProduct: (product: Product, quantity?: number) => void;
  addItems: (items: CartItem[], message?: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const getStorageKey = (user: ReturnType<typeof useAuth>['user']) => {
  if (!user || !user.ID) return 'nimra-cart';
  return `nimra-cart-${user.ID}`;
};

const readStoredCartItems = (key: string): CartItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.map(normalizeCartItem) : [];
  } catch {
    return [];
  }
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const storageKey = getStorageKey(user);
  const [items, setItems] = useState<CartItem[]>([]);
  const itemsRef = useRef<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [activeStorageKey, setActiveStorageKey] = useState('');
  const activeStorageKeyRef = useRef(activeStorageKey);
  const cartMutationVersionRef = useRef(0);
  const backendSyncAllowedRef = useRef(false);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const recentlyAddedCountRef = useRef(0);
  const toastResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { notify } = useNotification();

  useEffect(() => {
    activeStorageKeyRef.current = activeStorageKey;
  }, [activeStorageKey]);

  const updateCartItems = useCallback((updater: (current: CartItem[]) => CartItem[]) => {
    cartMutationVersionRef.current += 1;
    backendSyncAllowedRef.current = true;
    const currentItems = activeStorageKeyRef.current === storageKey
      ? itemsRef.current
      : readStoredCartItems(storageKey);
    const nextItems = mergeCartSnapshots(updater(mergeCartSnapshots(currentItems)));

    activeStorageKeyRef.current = storageKey;
    itemsRef.current = nextItems;
    localStorage.setItem(storageKey, JSON.stringify(nextItems));
    setActiveStorageKey(storageKey);
    setHydrated(true);
    setItems(nextItems);
  }, [storageKey]);

  const showAddedToCartToast = useCallback((productName: string, quantity: number) => {
    const nextCount = itemsRef.current.reduce((sum, item) => sum + item.quantity, 0);
    notify.cart(productName, quantity, nextCount);
  }, [notify]);

  useEffect(() => {
    if (isLoading) return;

    let cancelled = false;
    backendSyncAllowedRef.current = !(user && user.ID);
    const hydrationStartedAtVersion = cartMutationVersionRef.current;
    const storedItems = mergeCartSnapshots(readStoredCartItems(storageKey));
    activeStorageKeyRef.current = storageKey;
    itemsRef.current = storedItems;

    queueMicrotask(async () => {
      if (cancelled) return;
      setActiveStorageKey(storageKey);
      const hasLocalItems = storedItems.length > 0;
      setHydrated(hasLocalItems || !(user && user.ID));
      setItems(storedItems);

      if (!hasLocalItems && !(user && user.ID)) {
        return;
      }

      try {
        const fetchedCloudItems = user && user.ID ? await fetchCart(user.ID) : [];
        const guestItemsSnapshot = user && user.ID
          ? [
              ...readStoredCartItems('nimra-cart'),
              ...readStoredCartItems('nimra-cart-v2:guest'),
            ]
          : [];
        const needsCatalogHydration =
          hasLocalItems ||
          fetchedCloudItems.length > 0 ||
          guestItemsSnapshot.length > 0;
        const catalog = needsCatalogHydration ? await fetchProducts() : [];
        let localItems = hydrateCartItemsFromCatalog(readStoredCartItems(storageKey), catalog);
        
        if (user && user.ID) {
          // 1. Read guest cart from localStorage
          const guestKey = 'nimra-cart';
          const guestItems = hydrateCartItemsFromCatalog(guestItemsSnapshot, catalog);
          
          // 2. Fetch user's server cart (if exists)
          const cloudItems = hydrateCartItemsFromCatalog(fetchedCloudItems.map(normalizeCartItem), catalog);
          const baseItems = mergeCartSnapshots([...cloudItems, ...localItems]);

          // 3. Merge carts intelligently
          if (guestItems && guestItems.length > 0) {
            localItems = mergeCartSnapshots([...baseItems, ...guestItems]);
            
            // 6. Do NOT clear cart until merge succeeds
            localStorage.removeItem(guestKey);
            localStorage.removeItem('nimra-cart-v2:guest');
          } else {
            localItems = mergeCartSnapshots(baseItems);
          }
        } else {
          localItems = mergeCartSnapshots(localItems);
        }
        
        if (!cancelled && hydrationStartedAtVersion === cartMutationVersionRef.current) {
          backendSyncAllowedRef.current = true;
          localStorage.setItem(storageKey, JSON.stringify(localItems));
          itemsRef.current = localItems;
          activeStorageKeyRef.current = storageKey;
          setItems(localItems);
          setActiveStorageKey(storageKey);
          setHydrated(true);
        } else if (!cancelled) {
          backendSyncAllowedRef.current = true;
          const mergedItems = mergeCartSnapshots([...localItems, ...itemsRef.current]);
          localStorage.setItem(storageKey, JSON.stringify(mergedItems));
          itemsRef.current = mergedItems;
          activeStorageKeyRef.current = storageKey;
          setItems(mergedItems);
          setActiveStorageKey(storageKey);
          setHydrated(true);
        }
      } catch {
        // A temporary cloud-cart failure is recoverable: retain the local cart
        // and keep backend syncing disabled so it cannot overwrite cloud data.
        console.warn('Cloud cart unavailable; retained the locally saved cart.');
        if (!cancelled) {
          const safeItems = mergeCartSnapshots(readStoredCartItems(storageKey));
          itemsRef.current = safeItems;
          activeStorageKeyRef.current = storageKey;
          setItems(safeItems);
          setActiveStorageKey(storageKey);
          setHydrated(true);
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isLoading, storageKey, user]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      const storedItems = mergeCartSnapshots(readStoredCartItems(storageKey));
      backendSyncAllowedRef.current = true;
      itemsRef.current = storedItems;
      activeStorageKeyRef.current = storageKey;
      setItems(storedItems);
      setActiveStorageKey(storageKey);
      setHydrated(true);
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [storageKey]);

  useEffect(() => {
    if (hydrated && activeStorageKey === storageKey) {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      localStorage.setItem(storageKey, JSON.stringify(items));
      if (user && user.ID) {
        if (!backendSyncAllowedRef.current) return;
        syncTimerRef.current = setTimeout(() => {
          void syncCart(user.ID, items, new Date().toISOString());
        }, 500);
      }
    }
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [activeStorageKey, hydrated, items, storageKey, user]);

  const value = useMemo<CartContextValue>(() => {
    const isHydrated = hydrated && activeStorageKey === storageKey;
    const visibleItems = isHydrated ? items : [];
    const subtotal = cartSubtotal(visibleItems);
    const deliveryCharge = deliveryChargeFor(subtotal);

    return {
      items: visibleItems,
      isHydrated,
      totalItems: visibleItems.reduce((total, item) => total + item.quantity, 0),
      subtotal,
      deliveryCharge,
      grandTotal: subtotal + deliveryCharge,
      addProduct(product, quantity = 1) {
        const nextItem = productToCartItem(product, Math.max(1, Math.floor(Number(quantity) || 1)));
        updateCartItems((current) => {
          const existing = current.find((item) => String(item.productId) === String(nextItem.productId));
          if (!existing) return [...current, nextItem];
          return current.map((item) => String(item.productId) === String(nextItem.productId)
            ? { ...item, ...nextItem, quantity: item.quantity + nextItem.quantity }
            : item);
        });
        showAddedToCartToast(product.Name, Math.max(1, Math.floor(Number(quantity) || 1)));
      },
      addItems(newItems, message) {
        const normalizedItems = mergeCartItems(newItems.map(normalizeCartItem));
        if (!normalizedItems.length) {
          notify.error('No reorderable items', 'No reorderable items were found for this order.');
          return;
        }
        updateCartItems((current) => {
          return mergeCartItems([...current, ...normalizedItems]);
        });
        const quantity = normalizedItems.reduce((sum, item) => sum + item.quantity, 0);
        showAddedToCartToast(
          normalizedItems[0]?.name || 'Items',
          quantity
        );
      },
      updateQuantity(productId, quantity) {
        const targetProductId = String(productId);
        const nextQuantity = Math.max(0, Math.floor(Number(quantity) || 0));
        updateCartItems((current) =>
          nextQuantity <= 0
            ? current.filter((item) => String(item.productId) !== targetProductId)
            : current.map((item) => String(item.productId) === targetProductId ? { ...item, quantity: nextQuantity } : item)
        );
      },
      removeItem(productId) {
        const targetProductId = String(productId);
        updateCartItems((current) => current.filter((item) => String(item.productId) !== targetProductId));
        notify.info('Item Removed', 'Item removed from cart');
      },
      clearCart() {
        updateCartItems(() => []);
        notify.success('Cart Cleared', 'Cart cleared successfully.');
      }
    };
  }, [activeStorageKey, hydrated, items, showAddedToCartToast, storageKey, updateCartItems]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used inside CartProvider');
  return value;
};

