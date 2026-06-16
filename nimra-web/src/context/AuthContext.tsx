'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for stored user session on mount
    const storedUser = Cookies.get('nimra_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user session');
        Cookies.remove('nimra_user', { path: '/' });
      }
    }
    setIsLoading(false);
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
    } else {
      localStorage.removeItem('nimra_admin_user');
    }
    router.replace(isAdminUser ? '/admin' : (safeNextPath || '/customer-portal'));
  };

  const logout = () => {
    setUser(null);
    Cookies.remove('nimra_user', { path: '/' });
    localStorage.removeItem('nimra_admin_user');
    router.replace('/');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
