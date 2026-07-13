'use client';

import { useSyncExternalStore } from 'react';
import { normalizeRole } from '@/frontend/admin/utils/accessControl';

export type NavigationEntry = { path: string; label: string };
type NavigationState = { root: NavigationEntry; stack: NavigationEntry[] };

const STORAGE_KEY = 'nimra_navigation_history_v2';
const listeners = new Set<() => void>();
const guestRoot = { path: '/', label: 'Home' };
let snapshot: NavigationState = { root: guestRoot, stack: [guestRoot] };
const serverSnapshot: NavigationState = { root: guestRoot, stack: [guestRoot] };

const rootForRole = (role?: string): NavigationEntry =>
  normalizeRole(role) === 'CUSTOMER'
    ? { path: '/customer-portal', label: 'Portal' }
    : { path: '/admin', label: 'Dashboard' };

const labelForPath = (path: string) => {
  if (path === '/') return 'Home';
  if (path === '/admin') return 'Dashboard';
  if (path.startsWith('/admin')) return 'Dashboard';
  if (path.startsWith('/customer-portal')) {
    const tab = new URL(path, 'https://nimra.local').searchParams.get('tab');
    const labels: Record<string, string> = {
      orders: 'Orders', addresses: 'Addresses', profile: 'Profile', wishlist: 'Wishlist',
      payment: 'Payment Methods', notifications: 'Notifications', faqs: 'FAQs', settings: 'Settings',
    };
    return tab ? labels[tab] || 'Portal' : 'Portal';
  }
  if (/^\/products\/[^/]+/.test(path)) return 'Product Details';
  if (path.startsWith('/products')) return 'Products';
  if (path.startsWith('/cart')) return 'Cart';
  if (path.startsWith('/checkout')) return 'Checkout';
  if (path.startsWith('/orders')) return 'Orders';
  if (path.startsWith('/track')) return 'Track Order';
  if (path.startsWith('/contact')) return 'Contact';
  if (path.startsWith('/about')) return 'About';
  if (path.startsWith('/settings')) return 'Settings';
  if (path.startsWith('/login')) return 'Login';
  return 'Back';
};

export const meaningfulPath = (pathname: string, query = '') => {
  if (pathname === '/customer-portal') {
    const tab = new URLSearchParams(query).get('tab');
    return tab && tab !== 'overview' ? `${pathname}?tab=${encodeURIComponent(tab)}` : pathname;
  }
  return pathname;
};

const persist = () => {
  if (typeof window !== 'undefined') window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  listeners.forEach((listener) => listener());
};

const restore = (expectedRoot: NavigationEntry) => {
  if (typeof window === 'undefined') return;
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || 'null') as NavigationState | null;
    if (parsed?.root?.path === expectedRoot.path && Array.isArray(parsed.stack) && parsed.stack.length) {
      snapshot = parsed;
      return;
    }
  } catch { /* Reset malformed navigation state below. */ }
  snapshot = { root: expectedRoot, stack: [expectedRoot] };
};

export const resetNavigationHistory = (role?: string) => {
  const root = role ? rootForRole(role) : guestRoot;
  snapshot = { root, stack: [root] };
  persist();
};

export const recordNavigation = (path: string, role?: string) => {
  const expectedRoot = role ? rootForRole(role) : guestRoot;
  restore(expectedRoot);

  // Authentication screens are transitional entry points, not meaningful
  // destinations. In particular, never place Login between an authenticated
  // user's root and the page they reach after signing in.
  if (['/login', '/register', '/forgot-password', '/admin/login'].includes(path.split('?')[0])) {
    if (snapshot.root.path !== expectedRoot.path) {
      snapshot = { root: expectedRoot, stack: [expectedRoot] };
      persist();
    }
    return;
  }

  const entry = { path, label: labelForPath(path) };
  const stack = [...snapshot.stack];

  if (entry.path === expectedRoot.path) {
    snapshot = { root: expectedRoot, stack: [expectedRoot] };
  } else if (stack[stack.length - 1]?.path !== entry.path) {
    if (stack.length > 1 && stack[stack.length - 2]?.path === entry.path) stack.pop();
    else stack.push(entry);
    snapshot = { root: expectedRoot, stack: stack.slice(-50) };
  } else {
    snapshot = { root: expectedRoot, stack };
  }
  persist();
};

export const consumeBackDestination = (currentPath: string, role?: string) => {
  restore(role ? rootForRole(role) : guestRoot);
  const stack = [...snapshot.stack];
  if (stack[stack.length - 1]?.path === currentPath && stack.length > 1) stack.pop();
  snapshot = { ...snapshot, stack };
  persist();
  return stack[stack.length - 1] || snapshot.root;
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => snapshot;
const getServerSnapshot = () => serverSnapshot;

export const useNavigationHistory = (role?: string) => {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const expectedRoot = role ? rootForRole(role) : guestRoot;

  // Authentication state is authoritative. This avoids one render using the
  // persisted guest root while the route-tracking effect catches up after login.
  if (state.root.path !== expectedRoot.path) {
    return { root: expectedRoot, stack: [expectedRoot] };
  }

  return state;
};
