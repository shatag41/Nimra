'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { discardLegacyRecentlyViewed, notifyRecentlyViewedChanged, recentlyViewedKey } from '../utils/recentlyViewed';
import { isAdminRole } from '@/frontend/admin/utils/accessControl';
import type { CartItem } from '@/types/cms';
import { mergeCartItems, mergeCartSnapshots, normalizeCartItem } from '../utils/commerce';
import { resetNavigationHistory } from '../navigation/navigationHistory';
import { clearCheckoutAuthHandoff, readCheckoutAuthReturn } from '../utils/checkoutAuthHandoff';

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
  isNewAccount?: boolean;
};

type LoginOptions = {
  isNewAccount?: boolean;
  redirectTo?: string;
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingOut: boolean;
  isNewAccountSession: boolean;
  login: (userData: User, options?: LoginOptions) => void;
  logout: (beforeNavigate?: () => void) => Promise<void>;
  clearSession: () => void;
  updateUserSession: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isLoggingOut: false,
  isNewAccountSession: false,
  login: () => {},
  logout: async () => {},
  clearSession: () => {},
  updateUserSession: () => {},
});

const SESSION_DAYS = 7;
const SESSION_COOKIE = 'nimra_session';
const USER_COOKIE = 'nimra_user';
const USER_PROFILE_STORAGE_KEY = 'nimra_user_profile';
const TAB_SESSION_KEY = 'nimra_live_tab_session';
export const LOGIN_REDIRECT_STORAGE_KEY = 'nimra_login_redirect_to';

const getSessionUser = (userData: User): User => ({
  ID: userData.ID,
  Name: userData.Name,
  Username: userData.Username,
  Mobile: userData.Mobile,
  Role: userData.Role,
  Active: userData.Active,
});

const persistUserSession = (userData: User) => {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(userData));
    } catch (error) {
      console.warn('Could not persist the full user profile locally.', error);
    }
  }

  const secureCookie = typeof window !== 'undefined' && window.location.protocol === 'https:';
  Cookies.set(USER_COOKIE, JSON.stringify(getSessionUser(userData)), {
    path: '/',
    sameSite: 'lax',
    secure: secureCookie,
  });
};

const safeInternalRedirect = (value?: string | null) =>
  value?.startsWith('/') && !value.startsWith('//') && !value.includes('\\')
    ? value
    : null;

export const consumeLoginRedirect = () => {
  if (typeof window === 'undefined') return null;
  const pending = window.sessionStorage.getItem(LOGIN_REDIRECT_STORAGE_KEY);
  window.sessionStorage.removeItem(LOGIN_REDIRECT_STORAGE_KEY);
  return safeInternalRedirect(pending);
};

const createSessionToken = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
};

export const clearBrowserSession = () => {
  const secureCookie = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const cookieOptions = { path: '/', sameSite: 'lax' as const, secure: secureCookie };
  Cookies.remove(USER_COOKIE, cookieOptions);
  Cookies.remove(USER_COOKIE);
  Cookies.remove(SESSION_COOKIE, cookieOptions);
  Cookies.remove(SESSION_COOKIE);
  Cookies.remove('nimra_admin_user', cookieOptions);
  Cookies.remove('nimra_admin_user');

  if (typeof window === 'undefined') return;

  // Authentication cleanup must never remove durable UI preferences such as
  // theme, location, cart, notification state, or recently viewed products.
  window.localStorage.removeItem('nimra_admin_user');
  window.localStorage.removeItem('nimra_admin_active_tab');
  window.localStorage.removeItem(USER_PROFILE_STORAGE_KEY);
  window.sessionStorage.removeItem(TAB_SESSION_KEY);
  window.sessionStorage.removeItem(LOGIN_REDIRECT_STORAGE_KEY);
  resetNavigationHistory();
};

type RestoredAuthState = { user: User; isNewAccount: boolean };

const readStoredUser = (): RestoredAuthState | null => {
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

    try {
      const profileRaw = window.localStorage.getItem(USER_PROFILE_STORAGE_KEY);
      const profile = profileRaw ? JSON.parse(profileRaw) as User : null;
      if (profile && String(profile.ID) === String(parsedUser.ID)) {
        return {
          user: { ...profile, ...parsedUser },
          isNewAccount: parsedSession.isNewAccount === true,
        };
      }
    } catch {
      // The compact identity cookie remains sufficient to restore authentication.
    }

    return { user: parsedUser, isNewAccount: parsedSession.isNewAccount === true };
  } catch {
    console.error('Failed to parse user session');
    clearBrowserSession();
    return null;
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isNewAccountSession, setIsNewAccountSession] = useState(false);
  const sessionMutationRef = useRef(0);
  const sessionRestoreStartedRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (sessionRestoreStartedRef.current) return;
    sessionRestoreStartedRef.current = true;
    const restoreVersion = sessionMutationRef.current;
    const restoredSession = readStoredUser();
    if (restoreVersion !== sessionMutationRef.current) return;
    setUser(restoredSession?.user || null);
    setIsNewAccountSession(Boolean(restoredSession?.isNewAccount));
    setIsLoading(false);
  }, []);

  const login = useCallback((userData: User, options?: LoginOptions) => {
    if (!userData || !userData.Username || !userData.Role) {
      throw new Error('Invalid login response. Missing user identity.');
    }

    const roleValue = userData.Role.trim().toUpperCase().replace(/[\s-]+/g, '_');
    if (!isAdminRole(userData.Role) && roleValue !== 'CUSTOMER') {
      throw new Error('Invalid login response. Unrecognized account role.');
    }

    const isAdminUser = isAdminRole(userData.Role);
    const nextPath = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('next') : null;
    const requestedRedirect = options?.redirectTo || nextPath || readCheckoutAuthReturn();
    const safeNextPath = safeInternalRedirect(requestedRedirect);
    const destination = isAdminUser ? '/admin' : (safeNextPath || '/customer-portal');
    const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
    const session: StoredSession = {
      token: createSessionToken(),
      userId: userData.ID,
      role: userData.Role,
      expiresAt,
      isNewAccount: options?.isNewAccount === true,
    };

    sessionMutationRef.current += 1;
    const secureCookie = typeof window !== 'undefined' && window.location.protocol === 'https:';
    persistUserSession(userData);
    Cookies.set(SESSION_COOKIE, JSON.stringify(session), { path: '/', sameSite: 'lax', secure: secureCookie });

    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(TAB_SESSION_KEY, session.token);
      window.sessionStorage.setItem(LOGIN_REDIRECT_STORAGE_KEY, destination);
      resetNavigationHistory(userData.Role);
      discardLegacyRecentlyViewed();
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
    setUser(userData);
    setIsNewAccountSession(session.isNewAccount === true);
    setIsLoading(false);
    window.location.replace(destination);
  }, []);

  const clearSession = useCallback(() => {
    sessionMutationRef.current += 1;
    setUser(null);
    setIsLoading(false);
    setIsNewAccountSession(false);
    clearBrowserSession();
    clearCheckoutAuthHandoff();
    resetNavigationHistory();
    notifyRecentlyViewedChanged();
  }, []);

  const updateUserSession = useCallback((userData: User) => {
    sessionMutationRef.current += 1;
    setUser(userData);
    persistUserSession(userData);
  }, []);

  useEffect(() => {
    if (!user || typeof window === 'undefined') return;

    const expireIfNeeded = () => {
      const currentSession = readStoredUser();
      if (!currentSession) {
        setUser(null);
        setIsNewAccountSession(false);
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

  const logout = useCallback(async (beforeNavigate?: () => void) => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
      });
    } catch (error) {
      console.error('Server logout failed; completing local logout:', error);
    }

    setUser(null);
    setIsNewAccountSession(false);
    clearBrowserSession();
    clearCheckoutAuthHandoff();
    resetNavigationHistory();
    notifyRecentlyViewedChanged();

    if (typeof window !== 'undefined') {
      Object.keys(window.sessionStorage)
        .filter((key) =>
          key.startsWith('nimra-orders:')
          || key.startsWith('nimra_navigation_')
          || key.startsWith('nimra_registration_')
        )
        .forEach((key) => window.sessionStorage.removeItem(key));
      window.dispatchEvent(new Event('nimra-auth-logout'));
    }

    beforeNavigate?.();
    router.replace('/');

    await new Promise<void>((resolve) => {
      if (typeof window === 'undefined') {
        resolve();
        return;
      }
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
    });
    router.refresh();

    if (typeof window !== 'undefined') {
      if (window.location.pathname === '/') {
        setIsLoggingOut(false);
        return;
      }
      window.setTimeout(() => {
        if (window.location.pathname !== '/') {
          window.location.replace('/');
        } else {
          setIsLoggingOut(false);
        }
      }, 1500);
      return;
    }
    setIsLoggingOut(false);
  }, [isLoggingOut, router]);

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

  const contextValue = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    isLoggingOut,
    isNewAccountSession,
    login,
    logout,
    clearSession,
    updateUserSession,
  }), [user, isLoading, isLoggingOut, isNewAccountSession, login, logout, clearSession, updateUserSession]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
