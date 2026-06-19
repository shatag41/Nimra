'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

export interface User {
  ID: number;
  Name: string;
  Username: string; // Email
  Mobile?: string;
  Role: string; // 'Admin' | 'Customer'
  Active: boolean;
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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
  clearSession: () => {},
});

const SESSION_DAYS = 7;
const SESSION_COOKIE = 'nimra_session';
const USER_COOKIE = 'nimra_user';

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

  const preservedTheme = window.localStorage.getItem('theme');
  const keysToRemove = [
    USER_COOKIE,
    SESSION_COOKIE,
    'nimra_admin_user',
    'nimra_admin_active_tab',
    'nimra_profile',
    'nimra_auth',
    'nimra_session',
    'nimra_token',
  ];

  keysToRemove.forEach((key) => window.localStorage.removeItem(key));
  Object.keys(window.localStorage).forEach((key) => {
    if (
      key.toLowerCase().includes('auth') ||
      key.toLowerCase().includes('token') ||
      key.toLowerCase().includes('session')
    ) {
      window.localStorage.removeItem(key);
    }
  });
  window.sessionStorage.clear();

  if (preservedTheme) {
    window.localStorage.setItem('theme', preservedTheme);
  }
};

const readStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;

  const storedUser = Cookies.get(USER_COOKIE);
  const storedSession = Cookies.get(SESSION_COOKIE);
  if (!storedUser || !storedSession) {
    clearBrowserSession();
    return null;
  }

  try {
    const parsedUser = JSON.parse(storedUser) as User;
    const parsedSession = JSON.parse(storedSession) as StoredSession;

    if (!parsedSession.token || !parsedSession.expiresAt || Date.now() >= Number(parsedSession.expiresAt)) {
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

    const isAdminUser = userData.Role === 'Admin';
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
    Cookies.set(USER_COOKIE, JSON.stringify(userData), { path: '/', sameSite: 'lax', expires: SESSION_DAYS });
    Cookies.set(SESSION_COOKIE, JSON.stringify(session), { path: '/', sameSite: 'lax', expires: SESSION_DAYS });

    if (typeof window !== 'undefined') {
      try {
        const guestAddrs = localStorage.getItem('nimra_saved_addresses_guest');
        if (guestAddrs) {
          const userKey = `nimra_saved_addresses_${userData.ID}`;
          const userAddrs = localStorage.getItem(userKey);
          if (!userAddrs) {
            localStorage.setItem(userKey, guestAddrs);
          } else {
            const parsedGuest = JSON.parse(guestAddrs);
            const parsedUser = JSON.parse(userAddrs);
            if (Array.isArray(parsedGuest) && Array.isArray(parsedUser)) {
              // merge and remove exact duplicates based on fullAddress
              const merged = [...parsedUser];
              parsedGuest.forEach(ga => {
                if (!merged.find(ua => ua.fullAddress === ga.fullAddress)) {
                  merged.push({ ...ga, id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() });
                }
              });
              localStorage.setItem(userKey, JSON.stringify(merged));
            }
          }
          localStorage.removeItem('nimra_saved_addresses_guest');
        }
      } catch (e) {
        console.error('Failed to migrate guest addresses', e);
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
  }, []);

  const logout = useCallback(() => {
    clearSession();
    window.location.href = '/';
  }, [clearSession]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, clearSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
