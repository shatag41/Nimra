'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { CompanyInfo, Notification } from '@/types/cms';
import { useCart } from '../contexts/CartProvider';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';
import { fetchNotifications, saveNotification } from '@/utils/api';
import LogoutConfirmationModal from './LogoutConfirmationModal';
import { AppTheme, applyTheme, initializeTheme, THEME_CHANGE_EVENT } from '../utils/theme';
import { isAdminRole, normalizeRole } from '@/frontend/admin/utils/accessControl';

interface HeaderProps {
  companyInfo: CompanyInfo;
}

const NAVBAR_SKELETON_ITEMS = [64, 82, 58, 62, 74];
const getUserRole = (user: { Role?: string; role?: string } | null) => user?.Role || user?.role;

export default React.memo(function Header({ companyInfo }: HeaderProps) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<AppTheme>('light');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsOwnerKey, setNotificationsOwnerKey] = useState('');
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentTab = searchParams ? searchParams.get('tab') : null;
  const { totalItems } = useCart();
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  const { city, loading, requestLocation, permissionDenied } = useLocation();

  const authReady = mounted && !isAuthLoading;
  const activeUser = authReady ? user : null;
  const activeRoleValue = getUserRole(activeUser);
  const activeRole = activeUser ? normalizeRole(activeRoleValue) : null;
  const canUseCustomerActions = authReady && (!activeUser || activeRole === 'CUSTOMER');
  const unreadCount = notifications.filter(n => n.Read !== true && n.Read !== 'true').length;
  const dashboardHref = isAdminRole(activeRoleValue) ? '/admin' : '/customer-portal';
  const logoHref = activeUser ? dashboardHref : '/';

  useEffect(() => {
    setMounted(true);
    setTheme(initializeTheme());

    const handleThemeChange = (event: Event) => {
      setTheme((event as CustomEvent<AppTheme>).detail);
    };
    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);

    const transitionTimeout = setTimeout(() => {
      document.documentElement.classList.add('theme-transition');
    }, 150);

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('.profile-menu-container')) {
        setProfileDropdownOpen(false);
      }
      if (!target.closest('.notification-container')) {
        setNotificationDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);

      clearTimeout(transitionTimeout);
    };
  }, []);

  useEffect(() => {
    const notificationRole = activeUser ? normalizeRole(getUserRole(activeUser)) : null;
    if (!activeUser || notificationRole !== 'CUSTOMER') {
      setNotifications([]);
      setNotificationsOwnerKey('');
      return;
    }
    const ownerKey = String(activeUser.ID || activeUser.Username || '');
    if (!notificationDropdownOpen || (notifications.length > 0 && notificationsOwnerKey === ownerKey)) return;

    const loadNotifications = () => {
      fetchNotifications(activeUser.ID, activeUser.Username).then(data => {
        const key = `nimra_read_notifs_${activeUser.ID || activeUser.Username}`;
        let readIds: string[] = [];
        try {
          readIds = JSON.parse(localStorage.getItem(key) || '[]');
        } catch {}
        
        const filteredData = data.filter(n => n.TargetAudience === 'CUSTOMER_NOTIFICATION');

        const sorted = filteredData.sort((a, b) => {
          const timeA = new Date(a.CreatedAt || a.Timestamp || 0).getTime();
          const timeB = new Date(b.CreatedAt || b.Timestamp || 0).getTime();
          return timeB - timeA;
        });

        const updated = sorted.map(n => {
          const isRead = readIds.includes(String(n.ID)) || n.Read === true || n.Read === 'true';
          return { ...n, Read: isRead };
        });
        setNotificationsOwnerKey(ownerKey);
        setNotifications(updated);
      }).catch(console.error);
    };

    loadNotifications();
  }, [activeUser, activeRoleValue, notificationDropdownOpen, notifications.length, notificationsOwnerKey]);

  const handleMarkAsRead = async (id: string | number) => {
    try {
      setNotifications(prev => prev.map(n => String(n.ID) === String(id) ? { ...n, Read: true } : n));
      
      if (activeUser) {
        const key = `nimra_read_notifs_${activeUser.ID || activeUser.Username}`;
        let readIds: string[] = [];
        try {
          readIds = JSON.parse(localStorage.getItem(key) || '[]');
        } catch {}
        if (!readIds.includes(String(id))) {
          readIds.push(String(id));
          localStorage.setItem(key, JSON.stringify(readIds));
        }
      }
      
      await saveNotification({ ID: id, Read: true, UserId: activeUser?.ID }, 'update');
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => n.Read !== true && n.Read !== 'true');
      if (!unread.length) return;
      
      setNotifications(prev => prev.map(n => ({ ...n, Read: true })));
      
      if (activeUser) {
        const key = `nimra_read_notifs_${activeUser.ID || activeUser.Username}`;
        let readIds: string[] = [];
        try {
          readIds = JSON.parse(localStorage.getItem(key) || '[]');
        } catch {}
        
        unread.forEach(n => {
          if (!readIds.includes(String(n.ID))) readIds.push(String(n.ID));
        });
        localStorage.setItem(key, JSON.stringify(readIds));
      }
      
      await Promise.all(unread.map(n => saveNotification({ ID: n.ID, Read: true, UserId: activeUser?.ID }, 'update')));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    applyTheme(newTheme, true);
  };

  const navLinks = useMemo(() => {
    if (!authReady) {
      return [];
    }
    if (!activeUser) {
      return [
        { name: 'Home', href: '/' },
        { name: 'Products', href: '/products' },
        { name: 'Track', href: '/track' },
        { name: 'About', href: '/about' },
        { name: 'Contact', href: '/contact' },
      ];
    }
    if (activeRole === 'CUSTOMER') {
      return [
        { name: 'Portal', href: '/customer-portal' },
        { name: 'Products', href: '/products' },
        { name: 'Orders', href: '/orders' },
        { name: 'Track', href: '/track' },
        { name: 'About', href: '/about' },
        { name: 'Contact', href: '/contact' },
      ];
    }
    if (isAdminRole(activeRoleValue)) {
      return [
        { name: 'Dashboard', href: '/admin' },
        { name: 'Products', href: '/products' },
        { name: 'Track', href: '/track' },
        { name: 'About', href: '/about' },
        { name: 'Contact', href: '/contact' },
      ];
    }
    return [
      { name: 'Portal', href: '/customer-portal' },
      { name: 'Products', href: '/products' },
      { name: 'Orders', href: '/orders' },
      { name: 'Track', href: '/track' },
      { name: 'About', href: '/about' },
      { name: 'Contact', href: '/contact' },
    ];
  }, [activeRole, activeRoleValue, activeUser, authReady]);
  const isNavActive = useCallback((link: { name: string; href: string }) => pathname === link.href, [pathname]);

  return (
    <>
      <header className={`header ${pathname === '/' ? 'home-overlay' : ''}`}>
        {/* Top accent bar */}
        <div className="header-accent-bar" />

        <div className="header-container">
          {/* Logo */}
          <Link href={logoHref} className="logo">
            <div className="logo-icon">
              <svg width="18" height="18" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 5C50 5 15 45 15 65C15 84.33 30.67 100 50 100C69.33 100 85 84.33 85 65C85 45 50 5 50 5Z" fill="url(#logoGrad)"/>
                <text x="50" y="76" textAnchor="middle" fontSize="42" fontWeight="400" fontFamily="inherit" fill="white" letterSpacing="-1">N</text>
                <defs>
                  <linearGradient id="logoGrad" x1="50" y1="5" x2="50" y2="100" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#3b82f6"/>
                    <stop offset="1" stopColor="#2563eb"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="logo-text-group">
              <span className="logo-text">{companyInfo.BrandName || 'NIMRA'}</span>
              <span className="logo-tagline">Pure Water</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="desktop-nav" aria-label="Main navigation" onMouseLeave={useCallback(() => setHoveredNav(null), [])}>
            {!authReady ? (
              <div className="navbar-skeleton" aria-hidden="true">
                {NAVBAR_SKELETON_ITEMS.map((width, index) => (
                  <span key={index} className="navbar-skeleton-item" style={{ width }} />
                ))}
              </div>
            ) : navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                prefetch={true}
                className={`nav-link ${isNavActive(link) ? 'active' : ''}`}
                onMouseEnter={() => setHoveredNav(link.href)}
              >
                {(hoveredNav === link.href || (hoveredNav === null && isNavActive(link))) && (
                  <motion.span
                    layoutId="homepage-nav-active"
                    className="nav-active-pill"
                    transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 430, damping: 34, mass: 0.55 }}
                  />
                )}
                <span className="nav-link-label">{link.name}</span>
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="header-actions">
            <div className="header-icon-group">
            {/* Location Indicator - Desktop only */}
            {canUseCustomerActions && (
              <button 
                onClick={() => requestLocation(true)} 
                className="location-btn" 
                title="Update Location"
              >
                <span className="loc-icon">📍</span>
                <span className="loc-text">
                  {loading ? 'Detecting...' : (city || (permissionDenied ? 'Location Denied' : 'Set Location'))}
                </span>
              </button>
            )}

            {/* Cart — only for Customers (placed next to Location) */}
            {canUseCustomerActions && (
              <Link href="/cart" prefetch={true} className={`cart-link ${pathname === '/cart' ? 'active' : ''}`} aria-label={`Cart with ${mounted ? totalItems : 0} items`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                {mounted && totalItems > 0 && <span className="cart-count">{totalItems}</span>}
              </Link>
            )}

            {/* Admin Notifications Bell */}
            {activeRole === 'CUSTOMER' && activeUser && (
              <div className="notification-container">
                <button 
                  className="icon-btn" 
                  onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)} 
                  aria-label="Notifications" 
                  title="Notifications"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  {unreadCount > 0 && (
                    <span className="badge-count" />
                  )}
                </button>

                {notificationDropdownOpen && (
                  <div className="profile-dropdown notification-dropdown-menu animate-fade-in-up" style={{ width: '360px', padding: '0', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                    <div className="dropdown-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)' }}>
                      <strong style={{ fontSize: '1rem', fontWeight: 700 }}>Notifications</strong>
                      {unreadCount > 0 && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleMarkAllAsRead(); }}
                          style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div className="notification-empty-state" style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No new notifications
                      </div>
                    ) : (
                      <>
                        <div className="notification-list" style={{ maxHeight: '320px', overflowY: 'auto' }}>
                          {notifications.slice(0, 10).map((n) => {
                            const isUnread = n.Read !== true && n.Read !== 'true';
                            
                            // Determine Priority Badges
                            const priority = String(n.Priority || 'Low').toLowerCase();
                            const priorityBadgeColor = 
                              priority === 'high' ? '#ef4444' : 
                              priority === 'medium' ? '#f59e0b' : '#3b82f6';
                            const priorityBg =
                              priority === 'high' ? 'rgba(239, 68, 68, 0.1)' : 
                              priority === 'medium' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)';

                            return (
                              <div 
                                key={n.ID} 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isUnread) handleMarkAsRead(n.ID);
                                  if (n.ActionLink) {
                                    setNotificationDropdownOpen(false);
                                    router.push(n.ActionLink);
                                  }
                                }}
                                className={`notification-dropdown-item ${isUnread ? 'notification-dropdown-item-unread' : ''}`}
                                style={{
                                  padding: '0.85rem 1.25rem',
                                  borderBottom: '1px solid var(--border-color)',
                                  background: isUnread ? 'rgba(37, 99, 235, 0.03)' : 'transparent',
                                  cursor: 'pointer',
                                  transition: 'background 0.2s ease',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '0.35rem',
                                  position: 'relative'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                      {n.Category && (
                                        <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', background: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                                          {n.Category}
                                        </span>
                                      )}
                                      <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', background: priorityBg, color: priorityBadgeColor }}>
                                        {n.Priority || 'Low'}
                                      </span>
                                    </div>
                                    <strong className={`notification-title ${isUnread ? 'notification-title-unread' : ''}`} style={{ fontSize: '0.85rem', fontWeight: isUnread ? 700 : 600, color: 'var(--text-primary)', paddingRight: isUnread ? '12px' : '0', marginTop: '0.1rem' }}>{n.Title}</strong>
                                  </div>
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                    {new Date(n.CreatedAt || n.Timestamp).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="notification-message" style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>{n.Message}</p>
                                {isUnread && (
                                  <span className="notification-unread-dot" style={{ position: 'absolute', top: '16px', right: '12px', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary-color)' }} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center', background: 'var(--bg-secondary)' }}>
                          <Link 
                            href="/customer-portal?tab=notifications" 
                            onClick={() => setNotificationDropdownOpen(false)}
                            style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-color)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            View All Notifications
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Login / Profile */}
            {!mounted || isAuthLoading ? (
              <div className="header-profile-placeholder" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
            ) : activeUser ? (
              <div className="profile-menu-container">
                <button 
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} 
                  className={`profile-btn ${profileDropdownOpen ? 'active' : ''}`}
                  aria-label="Profile Menu"
                >
                  <div className="avatar">
                    {activeUser.Name ? activeUser.Name.charAt(0).toUpperCase() : (activeUser.Username ? activeUser.Username.charAt(0).toUpperCase() : 'U')}
                  </div>
                </button>

                {profileDropdownOpen && (
                  <div className="profile-dropdown animate-fade-in-up">
                    <Link href="/customer-portal?tab=profile" className="dropdown-header-link" onClick={() => setProfileDropdownOpen(false)}>
                      <div className="dropdown-header">
                        <div className="dropdown-avatar-large">
                          {activeUser.Name ? activeUser.Name.charAt(0).toUpperCase() : (activeUser.Username ? activeUser.Username.charAt(0).toUpperCase() : 'U')}
                        </div>
                        <div className="dropdown-user-info">
                          <strong>{activeUser.Name || 'User'}</strong>
                          <span>{activeUser.Username}</span>
                        </div>
                      </div>
                    </Link>
                    <div className="dropdown-divider"></div>
                    
                    <div className="dropdown-menu-group">
                      <span className="dropdown-group-label">My Account</span>
                      <ul className="dropdown-menu-items">
                        <li>
                          <Link 
                            href="/customer-portal?tab=addresses" 
                            className={`dropdown-item ${pathname === '/customer-portal' && currentTab === 'addresses' ? 'active' : ''}`} 
                            onClick={() => setProfileDropdownOpen(false)}
                          >
                            <div className="menu-icon-container">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            </div>
                            <span className="menu-item-text">Addresses</span>
                          </Link>
                        </li>
                        <li>
                          <Link 
                            href="/customer-portal?tab=payments" 
                            className={`dropdown-item ${pathname === '/customer-portal' && currentTab === 'payments' ? 'active' : ''}`} 
                            onClick={() => setProfileDropdownOpen(false)}
                          >
                            <div className="menu-icon-container">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                            </div>
                            <span className="menu-item-text">Saved Payments</span>
                          </Link>
                        </li>
                        <li>
                          <Link 
                            href="/customer-portal?tab=notifications" 
                            className={`dropdown-item ${pathname === '/customer-portal' && currentTab === 'notifications' ? 'active' : ''}`} 
                            onClick={() => setProfileDropdownOpen(false)}
                          >
                            <div className="menu-icon-container">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                            </div>
                            <span className="menu-item-text">Notifications</span>
                          </Link>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="dropdown-divider"></div>
                    
                    <div className="dropdown-menu-group">
                      <span className="dropdown-group-label">Preferences & Support</span>
                      <ul className="dropdown-menu-items">
                        <li>
                          <Link 
                            href="/contact" 
                            className={`dropdown-item ${pathname === '/contact' ? 'active' : ''}`} 
                            onClick={() => setProfileDropdownOpen(false)}
                          >
                            <div className="menu-icon-container">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                            </div>
                            <span className="menu-item-text">Help & Support</span>
                          </Link>
                        </li>
                        <li>
                          <Link 
                            href="/about#faqs"
                            className={`dropdown-item ${pathname === '/about' ? 'active' : ''}`}
                            onClick={() => setProfileDropdownOpen(false)}
                          >
                            <div className="menu-icon-container">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                            </div>
                            <span className="menu-item-text">FAQs</span>
                          </Link>
                        </li>
                        <li>
                          <Link 
                            href="/settings" 
                            className={`dropdown-item ${pathname === '/settings' ? 'active' : ''}`} 
                            onClick={() => setProfileDropdownOpen(false)}
                          >
                            <div className="menu-icon-container">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                            </div>
                            <span className="menu-item-text">Settings</span>
                          </Link>
                        </li>
                        <li className="dropdown-item-toggle">
                          <button onClick={(e) => { e.preventDefault(); toggleTheme(); }} className="dropdown-item theme-toggle-btn">
                            <div className="theme-toggle-label-wrap">
                              <div className="menu-icon-container">
                                {theme === 'light' ? (
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                                ) : (
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
                                )}
                              </div>
                              <span className="menu-item-text">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                            </div>
                            <div className={`theme-switch ${theme === 'dark' ? 'active' : ''}`}>
                              <div className="theme-switch-handle"></div>
                            </div>
                          </button>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="dropdown-divider"></div>
                    
                    <div className="dropdown-menu-group logout-group">
                      <ul className="dropdown-menu-items">
                        <li>
                          <button 
                            onClick={() => { setProfileDropdownOpen(false); setIsLogoutModalOpen(true); }} 
                            className="dropdown-item text-danger"
                          >
                            <div className="menu-icon-container">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                            </div>
                            <span className="menu-item-text">Logout</span>
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="profile-menu-container">
                <button 
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} 
                  className={`profile-btn ${profileDropdownOpen ? 'active' : ''}`}
                  aria-label="Profile Menu"
                >
                  <div className="avatar avatar-guest">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                </button>

                {profileDropdownOpen && (
                  <div className="profile-dropdown animate-fade-in-up">
                    <Link href="/login" className="dropdown-header-link" onClick={() => setProfileDropdownOpen(false)}>
                      <div className="dropdown-header">
                        <div className="dropdown-avatar-large dropdown-avatar-guest">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        </div>
                        <div className="dropdown-user-info">
                          <strong>Guest</strong>
                          <span className="dropdown-login-link">Login or Register</span>
                        </div>
                      </div>
                    </Link>
                    <div className="dropdown-divider"></div>
                    
                    <div className="dropdown-menu-group">
                      <ul className="dropdown-menu-items">
                        <li>
                          <Link 
                            href="/login" 
                            className="dropdown-item" 
                            onClick={() => setProfileDropdownOpen(false)}
                          >
                            <div className="menu-icon-container">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                            </div>
                            <span className="menu-item-text">Login / Register</span>
                          </Link>
                        </li>
                        <li className="dropdown-item-toggle">
                          <button onClick={(e) => { e.preventDefault(); toggleTheme(); }} className="dropdown-item theme-toggle-btn">
                            <div className="theme-toggle-label-wrap">
                              <div className="menu-icon-container">
                                {theme === 'light' ? (
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                                ) : (
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
                                )}
                              </div>
                              <span className="menu-item-text">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                            </div>
                            <div className={`theme-switch ${theme === 'dark' ? 'active' : ''}`}>
                              <div className="theme-switch-handle"></div>
                            </div>
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={useCallback(() => setMobileMenuOpen(prev => !prev), [])}
              className="mobile-menu-btn"
              aria-label="Toggle Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h16M4 6h16M4 18h16"/></svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="mobile-drawer animate-fade-in">
            <nav className="mobile-nav" aria-label="Mobile navigation">
              {!authReady ? (
                <div className="mobile-navbar-skeleton" aria-hidden="true">
                  {NAVBAR_SKELETON_ITEMS.map((width, index) => (
                    <span key={index} className="mobile-navbar-skeleton-item" style={{ width }} />
                  ))}
                </div>
              ) : navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  prefetch={true}
                  className={`mobile-nav-link ${isNavActive(link) ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}

              <div className="mobile-nav-divider" />

              {canUseCustomerActions && (
                <Link
                  href="/cart"
                  prefetch={true}
                  className={`btn btn-secondary mobile-full-action ${pathname === '/cart' ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                  Cart ({mounted ? totalItems : 0})
                </Link>
              )}

              {isAuthLoading ? (
                <div className="mobile-menu-auth-placeholder">Account</div>
              ) : activeUser ? (
                <button
                  className="btn btn-outline-danger mobile-full-action"
                  onClick={() => { setMobileMenuOpen(false); setIsLogoutModalOpen(true); }}
                >
                  Logout
                </button>
              ) : (
                <Link
                  href="/login"
                  prefetch={true}
                  className="btn btn-primary mobile-full-action"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      <LogoutConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={() => {
          setIsLogoutModalOpen(false);
          logout();
        }}
      />
    </>
  );
});
