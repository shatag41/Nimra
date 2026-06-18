'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CartItem, Product } from '@/types/cms';
import { useAuth } from './AuthContext';
import { cartSubtotal, deliveryChargeFor, productToCartItem } from '../utils/commerce';
import { syncCart, fetchCart } from '@/utils/api';
import { toast } from 'sonner';

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  deliveryCharge: number;
  grandTotal: number;
  addProduct: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const getStorageKey = (user: ReturnType<typeof useAuth>['user']) => {
  if (!user) return 'nimra-cart';
  const ownerId = String(user.ID || user.Username || user.Mobile || '').trim();
  return ownerId ? `nimra-cart-${ownerId}` : 'nimra-cart';
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const storageKey = getStorageKey(user);
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [activeStorageKey, setActiveStorageKey] = useState('');

  const updateCartItems = useCallback((updater: (current: CartItem[]) => CartItem[]) => {
    setActiveStorageKey(storageKey);
    setHydrated(true);
    setItems((current) => updater(activeStorageKey === storageKey ? current : []));
  }, [activeStorageKey, storageKey]);

  useEffect(() => {
    if (isLoading) return;
    let cancelled = false;
    queueMicrotask(async () => {
      if (cancelled) return;
      setHydrated(false);
      try {
        const saved = localStorage.getItem(storageKey);
        let localItems = saved ? JSON.parse(saved) : [];
        
        if (user && user.ID) {
          // 1. Read guest cart from localStorage
          const guestKey = 'nimra-cart';
          const guestSaved = localStorage.getItem(guestKey);
          // Also check legacy key
          const legacyGuestSaved = localStorage.getItem('nimra-cart-v2:guest');
          
          let guestItems: CartItem[] = [];
          if (guestSaved) {
            guestItems = JSON.parse(guestSaved);
          } else if (legacyGuestSaved) {
            guestItems = JSON.parse(legacyGuestSaved);
          }
          
          // 2. Fetch user's server cart (if exists)
          const cloudItems = await fetchCart(user.ID);
          const baseItems: CartItem[] = cloudItems && cloudItems.length > 0 ? cloudItems : localItems;

          // 3. Merge carts intelligently
          if (guestItems && guestItems.length > 0) {
            const mergedMap = new Map<string, CartItem>();
            
            baseItems.forEach(item => {
              mergedMap.set(item.productId, { ...item });
            });
            
            guestItems.forEach(gItem => {
              const existing = mergedMap.get(gItem.productId);
              if (existing) {
                // same product -> increase quantity
                existing.quantity += gItem.quantity;
              } else {
                // new product -> add item
                mergedMap.set(gItem.productId, { ...gItem });
              }
            });
            
            localItems = Array.from(mergedMap.values());
            
            // 6. Do NOT clear cart until merge succeeds
            localStorage.removeItem(guestKey);
            localStorage.removeItem('nimra-cart-v2:guest');
          } else {
            localItems = baseItems;
          }
          
          localStorage.setItem(storageKey, JSON.stringify(localItems));
        }
        
        if (!cancelled) {
          setItems(localItems);
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
      localStorage.setItem(storageKey, JSON.stringify(items));
      if (user && user.ID) {
        syncCart(user.ID, items);
      }
    }
  }, [activeStorageKey, hydrated, items, storageKey, user]);

  const value = useMemo<CartContextValue>(() => {
    const visibleItems = hydrated && activeStorageKey === storageKey ? items : [];
    const subtotal = cartSubtotal(visibleItems);
    const deliveryCharge = deliveryChargeFor(subtotal);

    return {
      items: visibleItems,
      totalItems: visibleItems.reduce((total, item) => total + item.quantity, 0),
      subtotal,
      deliveryCharge,
      grandTotal: subtotal + deliveryCharge,
      addProduct(product, quantity = 1) {
        const nextItem = productToCartItem(product, quantity);
        updateCartItems((current) => {
          const existing = current.find((item) => item.productId === nextItem.productId);
          if (!existing) return [...current, nextItem];
          return current.map((item) =>
            item.productId === nextItem.productId
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        });
        const toastId = `cart-add-${Date.now()}`;
        toast.success(
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>Added {product.Name} to cart</span>
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
      updateQuantity(productId, quantity) {
        updateCartItems((current) =>
          quantity <= 0
            ? current.filter((item) => item.productId !== productId)
            : current.map((item) => item.productId === productId ? { ...item, quantity } : item)
        );
      },
      removeItem(productId) {
        updateCartItems((current) => current.filter((item) => item.productId !== productId));
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
        setActiveStorageKey(storageKey);
        setHydrated(true);
        setItems([]);
      },
    };
  }, [activeStorageKey, hydrated, items, storageKey, updateCartItems]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used inside CartProvider');
  return value;
};
