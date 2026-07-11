'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { discardLegacyRecentlyViewed, notifyRecentlyViewedChanged, recentlyViewedKey } from '../utils/recentlyViewed';
import { isAdminRole } from '@/frontend/admin/utils/accessControl';
import type { CartItem } from '@/types/cms';
import { mergeCartItems, mergeCartSnapshots, normalizeCartItem } from '../utils/commerce';

export interface User {
  ID: number;
  Name: string;
  Username: string; // Email
  Mobile?: string;
  AlternateMobile?: string;
  Role: string; // 'Admin' | 'Customer'
  Active: boolean;
  CreatedAt?: string;
  createdAt?: string;
  SavedAddresses?: string;
  RecentlyViewed?: string;
  EmailPreferences?: string;
}

type StoredSession = {
  token: string;
  userId?: number | string;
  role?: string;
  expiresAt: number;
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  clearSession: () => void;
  updateUserSession: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
  clearSession: () => {},
  updateUserSession: () => {},
});

const SESSION_DAYS = 7;
const SESSION_COOKIE = 'nimra_session';
const USER_COOKIE = 'nimra_user';
const TAB_SESSION_KEY = 'nimra_live_tab_session';

const createSessionToken = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
};

export const clearBrowserSession = () => {
  Cookies.remove(USER_COOKIE, { path: '/' });
  Cookies.remove(USER_COOKIE);
  Cookies.remove(SESSION_COOKIE, { path: '/' });
  Cookies.remove(SESSION_COOKIE);
  Cookies.remove('nimra_admin_user', { path: '/' });
  Cookies.remove('nimra_admin_user');

  if (typeof window === 'undefined') return;

  // Authentication cleanup must never remove durable UI preferences such as
  // theme, location, cart, notification state, or recently viewed products.
  window.localStorage.removeItem('nimra_admin_user');
  window.localStorage.removeItem('nimra_admin_active_tab');
  window.sessionStorage.removeItem(TAB_SESSION_KEY);
};

const readStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;

  const storedUser = Cookies.get(USER_COOKIE);
  const storedSession = Cookies.get(SESSION_COOKIE);
  const liveTabSession = window.sessionStorage.getItem(TAB_SESSION_KEY);
  if (!storedUser || !storedSession || !liveTabSession) {
    clearBrowserSession();
    return null;
  }

  try {
    const parsedUser = JSON.parse(storedUser) as User;
    const parsedSession = JSON.parse(storedSession) as StoredSession;

    if (
      !parsedSession.token ||
      parsedSession.token !== liveTabSession ||
      !parsedSession.expiresAt ||
      Date.now() >= Number(parsedSession.expiresAt)
    ) {
      clearBrowserSession();
      return null;
    }

    if (parsedSession.role && parsedUser.Role && parsedSession.role !== parsedUser.Role) {
      clearBrowserSession();
      return null;
    }

    if (parsedSession.userId && parsedUser.ID && String(parsedSession.userId) !== String(parsedUser.ID)) {
      clearBrowserSession();
      return null;
    }

    if (String((parsedUser as User & { Active?: boolean | string }).Active).toLowerCase() === 'false') {
      clearBrowserSession();
      return null;
    }

    return parsedUser;
  } catch {
    console.error('Failed to parse user session');
    clearBrowserSession();
    return null;
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;
      setUser(readStoredUser());
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback((userData: User) => {
    if (!userData || !userData.Username || !userData.Role) {
      throw new Error('Invalid login response. Missing user identity.');
    }

    const isAdminUser = isAdminRole(userData.Role);
    const nextPath = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('next') : null;
    const safeNextPath = nextPath?.startsWith('/') && !nextPath.startsWith('//') ? nextPath : null;
    const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
    const session: StoredSession = {
      token: createSessionToken(),
      userId: userData.ID,
      role: userData.Role,
      expiresAt,
    };

    setUser(userData);
    Cookies.set(USER_COOKIE, JSON.stringify(userData), { path: '/', sameSite: 'lax' });
    Cookies.set(SESSION_COOKIE, JSON.stringify(session), { path: '/', sameSite: 'lax' });

    if (typeof window !== 'undefined') {
      discardLegacyRecentlyViewed();
      window.sessionStorage.setItem(TAB_SESSION_KEY, session.token);
      notifyRecentlyViewedChanged();

      try {
        const guestCart1Str = localStorage.getItem('nimra-cart');
        const guestCart2Str = localStorage.getItem('nimra-cart-v2:guest');
        const guestCart1: unknown = guestCart1Str ? JSON.parse(guestCart1Str) : [];
        const guestCart2: unknown = guestCart2Str ? JSON.parse(guestCart2Str) : [];
        const guestItems = mergeCartSnapshots([
          ...(Array.isArray(guestCart1) ? guestCart1 : []),
          ...(Array.isArray(guestCart2) ? guestCart2 : []),
        ].map((item) => normalizeCartItem(item as CartItem)));
        
        if (guestItems.length > 0) {
          const userCartKey = `nimra-cart-${userData.ID}`;
          const userCartStr = localStorage.getItem(userCartKey);
          const userCart: unknown = userCartStr ? JSON.parse(userCartStr) : [];
          const userItems = mergeCartSnapshots(
            (Array.isArray(userCart) ? userCart : []).map((item) => normalizeCartItem(item as CartItem))
          );
          const mergedList = mergeCartItems([...userItems, ...guestItems]);
          localStorage.setItem(userCartKey, JSON.stringify(mergedList));

          // Remove guest snapshots only after the authenticated cart is safely persisted.
          localStorage.removeItem('nimra-cart');
          localStorage.removeItem('nimra-cart-v2:guest');
        }
      } catch (e) {
        console.error('Error merging guest cart on login:', e);
      }
    }

    if (isAdminUser) {
      localStorage.setItem(
        'nimra_admin_user',
        JSON.stringify({
          username: userData.Username,
          role: userData.Role,
          name: userData.Name,
        })
      );
      localStorage.setItem('nimra_admin_active_tab', 'dashboard');
    } else {
      localStorage.removeItem('nimra_admin_user');
    }
    router.replace(isAdminUser ? '/admin' : (safeNextPath || '/customer-portal'));
  }, [router]);

  const clearSession = useCallback(() => {
    setUser(null);
    clearBrowserSession();
    notifyRecentlyViewedChanged();
  }, []);

  const updateUserSession = useCallback((userData: User) => {
    setUser(userData);
    Cookies.set(USER_COOKIE, JSON.stringify(userData), { path: '/', sameSite: 'lax' });
  }, []);

  useEffect(() => {
    if (!user || typeof window === 'undefined') return;

    const expireIfNeeded = () => {
      const currentUser = readStoredUser();
      if (!currentUser) {
        setUser(null);
        router.replace('/');
      }
    };

    let timeoutId: number | null = null;
    try {
      const storedSession = Cookies.get(SESSION_COOKIE);
      const parsedSession = storedSession ? JSON.parse(storedSession) as StoredSession : null;
      const delay = Number(parsedSession?.expiresAt || 0) - Date.now();

      if (delay <= 0) {
        expireIfNeeded();
      } else {
        timeoutId = window.setTimeout(expireIfNeeded, delay);
      }
    } catch {
      expireIfNeeded();
    }

    window.addEventListener('focus', expireIfNeeded);
    document.addEventListener('visibilitychange', expireIfNeeded);

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      window.removeEventListener('focus', expireIfNeeded);
      document.removeEventListener('visibilitychange', expireIfNeeded);
    };
  }, [router, user]);

  const logout = useCallback(() => {
    setUser(null);
    clearBrowserSession();
    notifyRecentlyViewedChanged();

    if (typeof window !== 'undefined') {
      window.location.replace('/');
      return;
    }

    setUser(null);
    router.replace('/');
  }, [router]);

  // Synchronize Recently Viewed Products with Database
  useEffect(() => {
    if (!user || typeof window === 'undefined') return;

    const key = recentlyViewedKey(user.ID);

    // 1. Initial sync: if user has RecentlyViewed, load it into localStorage
    try {
      const storedLocal = localStorage.getItem(key);
      const localIds = storedLocal ? JSON.parse(storedLocal).map((p: any) => String(p.ID || p.Name)) : [];
      
      if (user.RecentlyViewed) {
        const dbParsed = typeof user.RecentlyViewed === 'string' ? JSON.parse(user.RecentlyViewed) : user.RecentlyViewed;
        if (Array.isArray(dbParsed)) {
          const dbIdsStr = dbParsed.map((id: any) => String(id));
          
          if (JSON.stringify(localIds) !== JSON.stringify(dbIdsStr)) {
            const newLocal = dbParsed.map((id: any) => ({ ID: id, Name: String(id) }));
            localStorage.setItem(key, JSON.stringify(newLocal));
            notifyRecentlyViewedChanged();
          }
        }
      }
    } catch (e) {
      console.error('Error syncing recently viewed on mount:', e);
    }

    // 2. Listen to updates to localStorage and sync to database
    const handleUpdate = async () => {
      try {
        const storedLocal = localStorage.getItem(key);
        if (!storedLocal) return;
        const localParsed = JSON.parse(storedLocal);
        const ids = localParsed.map((p: any) => p.ID || p.Name).filter(Boolean);
        const currentDbStr = user.RecentlyViewed || '[]';
        const currentDbIds = JSON.parse(currentDbStr);

        if (JSON.stringify(ids) !== JSON.stringify(currentDbIds)) {
          const res = await fetch('/api/cms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'userCRUD',
              action: 'update',
              user: {
                ID: user.ID,
                RecentlyViewed: JSON.stringify(ids)
              }
            }),
          });
          const data = await res.json();
          if (data.success) {
            updateUserSession({
              ...user,
              RecentlyViewed: JSON.stringify(ids)
            });
          }
        }
      } catch (e) {
        console.error('Error syncing recently viewed update:', e);
      }
    };

    window.addEventListener('nimra-recently-viewed-updated', handleUpdate);
    return () => {
      window.removeEventListener('nimra-recently-viewed-updated', handleUpdate);
    };
  }, [user, updateUserSession]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, clearSession, updateUserSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
