'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { CartItem, Product } from '../types/cms';
import { useAuth } from '../context/AuthContext';
import { cartSubtotal, deliveryChargeFor, productToCartItem } from '../utils/commerce';
import { syncCart, fetchCart } from '../utils/api';
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
const STORAGE_KEY_PREFIX = 'nimra-cart-v2';

const getCartOwnerKey = (user: ReturnType<typeof useAuth>['user']) => {
  if (!user) return 'guest';
  return String(user.ID || user.Username || user.Mobile || 'guest').trim() || 'guest';
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const storageKey = `${STORAGE_KEY_PREFIX}:${getCartOwnerKey(user)}`;
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [activeStorageKey, setActiveStorageKey] = useState('');

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
          const cloudItems = await fetchCart(user.ID);
          if (cloudItems && cloudItems.length > 0) {
            localItems = cloudItems;
            localStorage.setItem(storageKey, JSON.stringify(localItems));
          }
        }
        
        if (!cancelled) {
          setItems(localItems);
          setActiveStorageKey(storageKey);
          setHydrated(true);
        }
      } catch {
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
    const updateCartItems = (updater: (current: CartItem[]) => CartItem[]) => {
      setActiveStorageKey(storageKey);
      setHydrated(true);
      setItems((current) => updater(activeStorageKey === storageKey ? current : []));
    };

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
        toast.success(`Added ${product.Name} to cart`);
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
        toast.info('Item removed from cart');
      },
      clearCart() {
        setActiveStorageKey(storageKey);
        setHydrated(true);
        setItems([]);
      },
    };
  }, [activeStorageKey, hydrated, items, storageKey]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used inside CartProvider');
  return value;
};
