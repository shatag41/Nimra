'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CartItem, Product } from '@/types/cms';
import { useAuth } from './AuthContext';
import { cartSubtotal, deliveryChargeFor, hydrateCartItemsFromCatalog, mergeCartItems, mergeCartSnapshots, normalizeCartItem, productToCartItem } from '../utils/commerce';
import { syncCart, fetchCart, fetchProducts } from '@/utils/api';
import { toast } from 'sonner';

interface CartContextValue {
  items: CartItem[];
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
const showAddedToast = (title: string) => {
  toast.custom((t) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      background: 'var(--bg-primary, #ffffff)',
      border: '1px solid var(--border-color, #e5e7eb)',
      borderRadius: '999px',
      padding: '8px 12px 8px 16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      color: 'var(--text-primary, #000)',
      fontSize: '0.9rem',
      width: 'max-content',
      maxWidth: '90vw',
      margin: '0 auto',
      pointerEvents: 'auto'
    }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
        {title}
      </span>
      <button 
        onClick={() => { toast.dismiss(t); window.location.assign('/cart'); }}
        style={{
          background: 'var(--primary-color, #2563eb)',
          color: 'white',
          border: 'none',
          padding: '6px 14px',
          borderRadius: '999px',
          fontSize: '0.8rem',
          fontWeight: 700,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          marginLeft: '4px'
        }}
      >
        Go to Cart &rarr;
      </button>
      <button 
        onClick={() => toast.dismiss(t)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted, #6b7280)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px',
          marginLeft: '2px'
        }}
        aria-label="Close"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  ), {
    id: 'cart-added',
    position: 'bottom-center',
    duration: 4000,
  });
};
const getStorageKey = (user: ReturnType<typeof useAuth>['user']) => {
  if (!user) return 'nimra-cart';
  const ownerId = String(user.ID || user.Username || user.Mobile || '').trim();
  return ownerId ? `nimra-cart-${ownerId}` : 'nimra-cart';
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
  const [hydrated, setHydrated] = useState(false);
  const [activeStorageKey, setActiveStorageKey] = useState('');
  const activeStorageKeyRef = useRef(activeStorageKey);
  const cartMutationVersionRef = useRef(0);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    activeStorageKeyRef.current = activeStorageKey;
  }, [activeStorageKey]);

  const updateCartItems = useCallback((updater: (current: CartItem[]) => CartItem[]) => {
    cartMutationVersionRef.current += 1;
    activeStorageKeyRef.current = storageKey;
    setActiveStorageKey(storageKey);
    setHydrated(true);
    setItems((current) => {
      const currentItems = activeStorageKeyRef.current === storageKey ? current : [];
      const baseItems = currentItems.length ? currentItems : readStoredCartItems(storageKey);
      return updater(mergeCartSnapshots(baseItems));
    });
  }, [storageKey]);

  useEffect(() => {
    if (isLoading) return;

    let cancelled = false;
    const hydrationStartedAtVersion = cartMutationVersionRef.current;
    const storedItems = mergeCartSnapshots(readStoredCartItems(storageKey));
    activeStorageKeyRef.current = storageKey;
    setActiveStorageKey(storageKey);
    setHydrated(true);
    setItems(storedItems);

    queueMicrotask(async () => {
      if (cancelled) return;
      try {
        const catalog = await fetchProducts();
        let localItems = hydrateCartItemsFromCatalog(readStoredCartItems(storageKey), catalog);
        
        if (user && user.ID) {
          // 1. Read guest cart from localStorage
          const guestKey = 'nimra-cart';
          const guestItems = hydrateCartItemsFromCatalog([
            ...readStoredCartItems(guestKey),
            ...readStoredCartItems('nimra-cart-v2:guest'),
          ], catalog);
          
          // 2. Fetch user's server cart (if exists)
          const cloudItems = hydrateCartItemsFromCatalog((await fetchCart(user.ID)).map(normalizeCartItem), catalog);
          const baseItems: CartItem[] = localItems.length > 0 ? localItems : cloudItems;

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
          setItems(localItems);
          setActiveStorageKey(storageKey);
          setHydrated(true);
        } else if (!cancelled) {
          setActiveStorageKey(storageKey);
          setHydrated(true);
        }
      } catch (err) {
        console.error("Cart hydration error:", err);
        if (!cancelled) {
          setItems([]);
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
    if (hydrated && activeStorageKey === storageKey) {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      localStorage.setItem(storageKey, JSON.stringify(items));
      if (user && user.ID) {
        syncTimerRef.current = setTimeout(() => {
          syncCart(user.ID, items, new Date().toISOString());
        }, 500);
      }
    }
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [activeStorageKey, hydrated, items, storageKey, user]);

  const value = useMemo<CartContextValue>(() => {
    const visibleItems = hydrated && activeStorageKey === storageKey ? items : items;
    const subtotal = cartSubtotal(visibleItems);
    const deliveryCharge = deliveryChargeFor(subtotal);

    return {
      items: visibleItems,
      totalItems: visibleItems.reduce((total, item) => total + item.quantity, 0),
      subtotal,
      deliveryCharge,
      grandTotal: subtotal + deliveryCharge,
      addProduct(product, quantity = 1) {
        const nextItem = productToCartItem(product, Math.max(1, Math.floor(Number(quantity) || 1)));
        updateCartItems((current) => {
          const existing = current.find((item) => String(item.productId) === String(nextItem.productId));
          if (!existing) return [...current, nextItem];
          return current;
        });
        showAddedToast(product.Name);
      },
      addItems(newItems, message) {
        const normalizedItems = mergeCartItems(newItems.map(normalizeCartItem));
        if (!normalizedItems.length) {
          toast.error('No reorderable items were found for this order.');
          return;
        }
        updateCartItems((current) => {
          return mergeCartItems([...current, ...normalizedItems]);
        });
        const quantity = normalizedItems.reduce((sum, item) => sum + item.quantity, 0);
        showAddedToast(message || `${quantity} item${quantity === 1 ? '' : 's'} added`);
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
        const toastId = `cart-remove-${Date.now()}`;
        toast.info(
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>Item removed from cart</span>
            <button
              onClick={() => toast.dismiss(toastId)}
              className="toast-close-btn"
              aria-label="Close notification"
            >
              <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.8536 2.85355C13.0488 2.65829 13.0488 2.34171 12.8536 2.14645C12.6583 1.95118 12.3417 1.95118 12.1464 2.14645L7.5 6.79289L2.85355 2.14645C2.65829 1.95118 2.34171 1.95118 2.14645 2.14645C1.95118 2.34171 1.95118 2.65829 2.14645 2.85355L6.79289 7.5L2.14645 12.1464C1.95118 12.3417 1.95118 12.6583 2.14645 12.8536C2.34171 13.0488 2.65829 13.0488 2.85355 12.8536L7.5 8.20711L12.1464 12.8536C12.3417 13.0488 12.6583 13.0488 12.8536 12.8536C13.0488 12.6583 13.0488 12.3417 12.8536 12.1464L8.20711 7.5L12.8536 2.85355Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
            </button>
          </div>,
          { 
            id: toastId,
            style: { width: 'auto', minWidth: 'max-content', paddingRight: '12px' } 
          }
        );
      },
      clearCart() {
        updateCartItems(() => []);
        toast.success('Cart cleared successfully.');
      }
    };
  }, [activeStorageKey, hydrated, items, storageKey, updateCartItems]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used inside CartProvider');
  return value;
};
