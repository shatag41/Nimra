import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem, Product } from '../types/cms';
import { useAuth } from './AuthContext';
import { cartSubtotal, deliveryChargeFor, productToCartItem } from '../utils/commerce';
import { syncCart, fetchCart } from '../utils/api';
import Toast from 'react-native-toast-message';

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
const STORAGE_KEY_PREFIX = 'nimra-mobile-cart-v2';

const getCartOwnerKey = (user: ReturnType<typeof useAuth>['user']) => {
  if (!user) return 'guest';
  return String(user.ID || user.Username || user.Mobile || 'guest').trim() || 'guest';
};

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
  const { user, isLoading } = useAuth();
  const storageKey = `${STORAGE_KEY_PREFIX}:${getCartOwnerKey(user)}`;
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [activeStorageKey, setActiveStorageKey] = useState('');

  useEffect(() => {
    let mounted = true;
    if (isLoading) return;
    setHydrated(false);

    const restoreCart = async () => {
      try {
        const saved = await AsyncStorage.getItem(storageKey);
        let localItems: CartItem[] = [];
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            localItems = mergeItemsByProductId(parsed);
          }
        }
        // Fetch from cloud and prefer cloud data if user is logged in
        if (user && user.ID) {
          const cloudItems = await fetchCart(user.ID);
          if (cloudItems && cloudItems.length > 0) {
            localItems = cloudItems;
            await AsyncStorage.setItem(storageKey, JSON.stringify(localItems));
          }
        }
        if (mounted) setItems(localItems);
      } catch (error) {
        if (mounted) setItems([]);
        console.warn('Unable to restore mobile cart', error);
      } finally {
        if (mounted) {
          setActiveStorageKey(storageKey);
          setHydrated(true);
        }
      }
    };

    restoreCart();

    return () => {
      mounted = false;
    };
  }, [isLoading, storageKey, user]);

  useEffect(() => {
    if (!hydrated || activeStorageKey !== storageKey) return;
    AsyncStorage.setItem(storageKey, JSON.stringify(items)).catch((error: any) => {
      console.warn('Unable to persist mobile cart', error);
    });
    // Cloud sync for logged-in users
    if (user && user.ID) {
      syncCart(user.ID, items);
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

    const updateItemQuantity = (productId: string, quantity: number) => {
      updateCartItems((current) =>
        quantity <= 0
          ? current.filter((item) => item.productId !== productId)
          : current.map((item) =>
              item.productId === productId ? { ...item, quantity } : item
            )
      );
    };

    return {
      items: visibleItems,
      totalItems: visibleItems.reduce((total, item) => total + item.quantity, 0),
      subtotal,
      deliveryCharge,
      grandTotal: subtotal + deliveryCharge,
      hydrated: hydrated && activeStorageKey === storageKey,
      addProduct(product, quantity = 1) {
        const nextItem = productToCartItem(product, quantity);
        updateCartItems((current) => {
          return mergeItemsByProductId([...current, nextItem]);
        });
        Toast.show({ type: 'success', text1: 'Added to Cart', text2: product.Name, visibilityTime: 2000 });
      },
      updateQuantity: updateItemQuantity,
      increment(productId) {
        const existing = visibleItems.find((item) => item.productId === productId);
        if (!existing) return;
        updateItemQuantity(productId, existing.quantity + 1);
      },
      decrement(productId) {
        const existing = visibleItems.find((item) => item.productId === productId);
        if (!existing) return;
        updateItemQuantity(productId, existing.quantity - 1);
      },
      removeItem(productId) {
        updateCartItems((current) => current.filter((item) => item.productId !== productId));
        Toast.show({ type: 'info', text1: 'Item Removed', visibilityTime: 1500 });
      },
      clearCart() {
        setActiveStorageKey(storageKey);
        setHydrated(true);
        setItems([]);
      },
      getItemQuantity(productId) {
        return visibleItems.find((item) => item.productId === productId)?.quantity || 0;
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
