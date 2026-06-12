import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem, Product } from '../types/cms';
import { cartSubtotal, deliveryChargeFor, productToCartItem } from '../utils/commerce';

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  deliveryCharge: number;
  grandTotal: number;
  hydrated: boolean;
  addProduct: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  increment: (productId: string) => void;
  decrement: (productId: string) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string) => number;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'nimra-mobile-cart-v1';

const mergeItemsByProductId = (cartItems: CartItem[]) => {
  const merged = new Map<string, CartItem>();

  for (const item of cartItems) {
    const existing = merged.get(item.productId);
    if (!existing) {
      merged.set(item.productId, { ...item, quantity: Math.max(1, Number(item.quantity) || 1) });
      continue;
    }

    merged.set(item.productId, {
      ...existing,
      quantity: existing.quantity + Math.max(1, Number(item.quantity) || 1),
    });
  }

  return Array.from(merged.values());
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;

    const restoreCart = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved && mounted) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setItems(mergeItemsByProductId(parsed));
          }
        }
      } catch (error) {
        console.warn('Unable to restore mobile cart', error);
      } finally {
        if (mounted) setHydrated(true);
      }
    };

    restoreCart();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch((error) => {
      console.warn('Unable to persist mobile cart', error);
    });
  }, [hydrated, items]);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = cartSubtotal(items);
    const deliveryCharge = deliveryChargeFor(subtotal);

    const updateItemQuantity = (productId: string, quantity: number) => {
      setItems((current) =>
        quantity <= 0
          ? current.filter((item) => item.productId !== productId)
          : current.map((item) =>
              item.productId === productId ? { ...item, quantity } : item
            )
      );
    };

    return {
      items,
      totalItems: items.reduce((total, item) => total + item.quantity, 0),
      subtotal,
      deliveryCharge,
      grandTotal: subtotal + deliveryCharge,
      hydrated,
      addProduct(product, quantity = 1) {
        const nextItem = productToCartItem(product, quantity);
        setItems((current) => {
          return mergeItemsByProductId([...current, nextItem]);
        });
      },
      updateQuantity: updateItemQuantity,
      increment(productId) {
        const existing = items.find((item) => item.productId === productId);
        if (!existing) return;
        updateItemQuantity(productId, existing.quantity + 1);
      },
      decrement(productId) {
        const existing = items.find((item) => item.productId === productId);
        if (!existing) return;
        updateItemQuantity(productId, existing.quantity - 1);
      },
      removeItem(productId) {
        setItems((current) => current.filter((item) => item.productId !== productId));
      },
      clearCart() {
        setItems([]);
      },
      getItemQuantity(productId) {
        return items.find((item) => item.productId === productId)?.quantity || 0;
      },
    };
  }, [hydrated, items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used inside CartProvider');
  return value;
};