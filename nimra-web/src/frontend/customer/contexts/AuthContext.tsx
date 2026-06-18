'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
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

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
});

const clearBrowserSession = () => {
  Cookies.remove('nimra_user', { path: '/' });
  Cookies.remove('nimra_user');

  if (typeof window === 'undefined') return;

  window.localStorage.clear();
  window.sessionStorage.clear();
};

const readStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;

  const storedUser = Cookies.get('nimra_user');
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser);
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

  const login = (userData: User) => {
    const isAdminUser = userData.Role === 'Admin';
    const nextPath = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('next') : null;
    const safeNextPath = nextPath?.startsWith('/') && !nextPath.startsWith('//') ? nextPath : null;
    setUser(userData);
    // Session cookie: removed { expires: 7 } so it expires on window close
    Cookies.set('nimra_user', JSON.stringify(userData), { path: '/', sameSite: 'lax' }); 
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
  };

  const logout = () => {
    setUser(null);
    clearBrowserSession();
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
