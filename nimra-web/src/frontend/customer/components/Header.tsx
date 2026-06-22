'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { CompanyInfo, Notification } from '@/types/cms';
import { useCart } from '../contexts/CartProvider';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';
import { fetchNotifications, saveNotification } from '@/utils/api';
import LogoutConfirmationModal from './LogoutConfirmationModal';
import { AppTheme, applyTheme, initializeTheme, THEME_CHANGE_EVENT } from '../utils/theme';

interface HeaderProps {
  companyInfo: CompanyInfo;
}

export default React.memo(function Header({ companyInfo }: HeaderProps) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<AppTheme>('light');
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams ? searchParams.get('tab') : null;
  const { totalItems } = useCart();
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  const { city, loading, requestLocation, permissionDenied } = useLocation();

  const activeUser = mounted ? user : null;
  const unreadCount = notifications.filter(n => n.Read !== true && n.Read !== 'true').length;
  const dashboardHref = activeUser?.Role === 'Admin' ? '/admin' : '/customer-portal';
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

    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('.profile-menu-container')) {
        setProfileDropdownOpen(false);
      }
      if (!target.closest('.notification-container')) {
        setNotificationDropdownOpen(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    document.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleClickOutside);
      window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
      clearTimeout(transitionTimeout);
    };
  }, []);

  useEffect(() => {
    if (activeUser) {
      fetchNotifications().then(data => {
        const key = `nimra_read_notifs_${activeUser.ID || activeUser.Username}`;
        let readIds: string[] = [];
        try {
          readIds = JSON.parse(localStorage.getItem(key) || '[]');
        } catch {}
        const updated = data.map(n => {
          const isRead = readIds.includes(String(n.ID)) || n.Read === true || n.Read === 'true';
          return { ...n, Read: isRead };
        });
        setNotifications(updated);
      }).catch(console.error);
    } else {
      setNotifications([]);
    }
  }, [activeUser]);

  const handleMarkAsRead = async (id: string | number, index: number) => {
    try {
      setNotifications(prev => prev.map((n, i) => i === index ? { ...n, Read: true } : n));
      
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
      
      await saveNotification({ ID: id, Read: true }, 'update');
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    applyTheme(newTheme, true);
  };

  const getNavLinks = () => {
    if (activeUser?.Role === 'Admin') {
      return [
        { name: 'Dashboard', href: '/admin' },
        { name: 'Products', href: '/products' },
        { name: 'Track', href: '/track' },
        { name: 'About', href: '/about' },
        { name: 'Contact', href: '/contact' },
      ];
    } else if (activeUser?.Role === 'Customer') {
      return [
        { name: 'Portal', href: '/customer-portal' },
        { name: 'Products', href: '/products' },
        { name: 'Orders', href: '/orders' },
        { name: 'Track', href: '/track' },
        { name: 'About', href: '/about' },
        { name: 'Contact', href: '/contact' },
      ];
    } else {
      return [
        { name: 'Home', href: '/' },
        { name: 'Products', href: '/products' },
        { name: 'Track', href: '/track' },
        { name: 'About', href: '/about' },
        { name: 'Contact', href: '/contact' },
      ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <>
      <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
        {/* Top accent bar */}
        <div className="header-accent-bar" />

        <div className="header-container">
          {/* Logo */}
          <Link href={logoHref} className="logo">
            <div className="logo-icon">
              <svg width="22" height="22" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 5C50 5 15 45 15 65C15 84.33 30.67 100 50 100C69.33 100 85 84.33 85 65C85 45 50 5 50 5Z" fill="url(#logoGrad)"/>
                <text x="50" y="76" textAnchor="middle" fontSize="42" fontWeight="900" fontFamily="inherit" fill="white" letterSpacing="-1">N</text>
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
          <nav className="desktop-nav" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                prefetch={true}
                className={`nav-link ${pathname === link.href ? 'active' : ''}`}
              >
                {link.name}
                {pathname === link.href && <span className="nav-indicator" />}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="header-actions">
            {/* Location Indicator - Desktop only */}
            {mounted && (!activeUser || activeUser.Role === 'Customer') && (
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

            {/* Admin Notifications Bell */}
            {activeUser && (
              <div className="notification-container" style={{ position: 'relative' }}>
                <button 
                  className="icon-btn" 
                  onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)} 
                  aria-label="Notifications" 
                  title="Notifications"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  {unreadCount > 0 && (
                    <span className="badge-count" style={{ position: 'absolute', top: '2px', right: '2px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', border: '1.5px solid var(--bg-primary)' }} />
                  )}
                </button>

                {notificationDropdownOpen && (
                  <div className="profile-dropdown animate-fade-in-up" style={{ width: '320px', right: '-80px', maxHeight: '400px', overflowY: 'auto' }}>
                    <div className="dropdown-header">
                      <strong>Notifications</strong>
                    </div>
                    <div className="dropdown-divider"></div>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        No new notifications
                      </div>
                    ) : (
                      <div className="notification-list" style={{ display: 'flex', flexDirection: 'column' }}>
                        {/* RECENT (UNREAD) SECTION */}
                        {(() => {
                          const unreadNotifs = notifications.filter(n => n.Read !== true && n.Read !== 'true');
                          return unreadNotifs.length > 0 && (
                            <>
                              <div style={{ padding: '0.4rem 1.25rem', background: 'rgba(37, 99, 235, 0.05)', fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary-color)', letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: '1px solid var(--border-color)' }}>
                                Recent
                              </div>
                              {unreadNotifs.map((n) => {
                                const originalIdx = notifications.findIndex(item => item.ID === n.ID && item.Timestamp === n.Timestamp);
                                return (
                                  <div 
                                    key={`unread-${n.ID}-${originalIdx}`} 
                                    onClick={() => handleMarkAsRead(n.ID, originalIdx)}
                                    style={{ 
                                      padding: '0.75rem 1.25rem', 
                                      borderBottom: '1px solid var(--border-color)', 
                                      fontSize: '0.85rem',
                                      cursor: 'pointer',
                                      background: 'rgba(37, 99, 235, 0.06)',
                                      transition: 'background 0.2s ease',
                                      position: 'relative'
                                    }}
                                  >
                                    <strong style={{ display: 'block', color: 'var(--text-primary)', marginBottom: '0.2rem', paddingRight: '12px' }}>{n.Title}</strong>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{n.Message}</p>
                                    <small style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.4rem', display: 'block' }}>
                                      {new Date(n.CreatedAt || n.Timestamp).toLocaleDateString()}
                                    </small>
                                    <span style={{
                                      position: 'absolute',
                                      top: '12px',
                                      right: '12px',
                                      width: '6px',
                                      height: '6px',
                                      borderRadius: '50%',
                                      background: 'var(--primary-color)'
                                    }} />
                                  </div>
                                );
                              })}
                            </>
                          );
                        })()}

                        {/* EARLIEST (READ) SECTION */}
                        {(() => {
                          const readNotifs = notifications.filter(n => n.Read === true || n.Read === 'true');
                          return readNotifs.length > 0 && (
                            <>
                              <div style={{ padding: '0.4rem 1.25rem', background: 'var(--bg-secondary)', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: '1px solid var(--border-color)' }}>
                                Earliest
                              </div>
                              {readNotifs.map((n) => {
                                const originalIdx = notifications.findIndex(item => item.ID === n.ID && item.Timestamp === n.Timestamp);
                                return (
                                  <div 
                                    key={`read-${n.ID}-${originalIdx}`} 
                                    onClick={() => handleMarkAsRead(n.ID, originalIdx)}
                                    style={{ 
                                      padding: '0.75rem 1.25rem', 
                                      borderBottom: '1px solid var(--border-color)', 
                                      fontSize: '0.85rem',
                                      cursor: 'pointer',
                                      background: 'transparent',
                                      transition: 'background 0.2s ease',
                                      position: 'relative'
                                    }}
                                  >
                                    <strong style={{ display: 'block', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{n.Title}</strong>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{n.Message}</p>
                                    <small style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.4rem', display: 'block' }}>
                                      {new Date(n.CreatedAt || n.Timestamp).toLocaleDateString()}
                                    </small>
                                  </div>
                                );
                              })}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Cart — only for Customers */}
            {(!activeUser || activeUser.Role === 'Customer') && (
              <Link href="/cart" prefetch={true} className={`cart-link ${pathname === '/cart' ? 'active' : ''}`} aria-label={`Cart with ${mounted ? totalItems : 0} items`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                {mounted && totalItems > 0 && <span className="cart-count">{totalItems}</span>}
              </Link>
            )}

            {/* Login / Profile */}
            {!mounted || isAuthLoading ? (
              <div className="skeleton-btn" style={{ width: '110px', height: '36px', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', border: '1.5px solid var(--border-color)', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
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
                            href="/faqs" 
                            className={`dropdown-item ${pathname === '/faqs' ? 'active' : ''}`} 
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
                            <div className="theme-toggle-label-wrap" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
                  <div className="avatar" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                </button>

                {profileDropdownOpen && (
                  <div className="profile-dropdown animate-fade-in-up">
                    <Link href="/login" className="dropdown-header-link" onClick={() => setProfileDropdownOpen(false)}>
                      <div className="dropdown-header">
                        <div className="dropdown-avatar-large" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        </div>
                        <div className="dropdown-user-info">
                          <strong>Guest</strong>
                          <span style={{ color: 'var(--primary-color)' }}>Login or Register</span>
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
                            <div className="theme-toggle-label-wrap" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
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
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  prefetch={true}
                  className={`mobile-nav-link ${pathname === link.href ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}

              <div className="mobile-nav-divider" />

              {(!activeUser || activeUser.Role === 'Customer') && (
                <Link
                  href="/cart"
                  prefetch={true}
                  className={`btn btn-secondary ${pathname === '/cart' ? 'active' : ''}`}
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                  Cart ({mounted ? totalItems : 0})
                </Link>
              )}

              {isAuthLoading ? (
                <div style={{ width: '100%', height: '44px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
              ) : activeUser ? (
                <button
                  className="btn btn-outline-danger"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => { setMobileMenuOpen(false); setIsLogoutModalOpen(true); }}
                >
                  Logout
                </button>
              ) : (
                <Link
                  href="/login"
                  prefetch={true}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
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

      <style jsx>{`
        .header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background: var(--nav-bg);
          border-bottom: 1px solid var(--border-color);
          transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(16px) saturate(180%);
          -webkit-backdrop-filter: blur(16px) saturate(180%);
        }

        .header-accent-bar {
          height: 3px;
          background: linear-gradient(90deg, #2563eb 0%, #3b82f6 50%, #2563eb 100%);
          background-size: 200% 100%;
          animation: shimmerBar 3s ease-in-out infinite;
        }

        @keyframes shimmerBar {
          0%   { background-position: 0% center; }
          50%  { background-position: 100% center; }
          100% { background-position: 0% center; }
        }

        .header.scrolled {
          background: var(--nav-bg);
          box-shadow: 0 2px 20px rgba(0, 100, 40, 0.1);
        }

        [data-theme="dark"] .header { background: rgba(15, 23, 42, 0.95); }
        [data-theme="dark"] .header.scrolled { background: rgba(15, 23, 42, 0.98); box-shadow: 0 2px 20px rgba(0,0,0,0.3); }

        .header-container {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 1.5rem;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
        }

        :global(.logo) {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          text-decoration: none;
          flex-shrink: 0;
          transition: opacity 150ms ease;
        }
        :global(.logo:hover) { opacity: 0.85; }

        .logo-icon {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: linear-gradient(135deg, #eff6ff, #bfdbfe);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(0,150,58,0.18);
        }

        [data-theme="dark"] .logo-icon {
          background: linear-gradient(135deg, #1e293b, #334155);
        }

        .logo-text-group {
          display: flex;
          flex-direction: column;
          line-height: 1;
        }

        .logo-text {
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 1.1rem;
          letter-spacing: -0.02em;
          color: var(--text-primary);
          line-height: 1.1;
        }

        .logo-tagline {
          font-size: 0.62rem;
          font-weight: 600;
          color: var(--primary-color);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          line-height: 1.2;
        }

        /* Desktop Nav */
        .desktop-nav {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          flex: 1;
          justify-content: center;
        }

        :global(.nav-link) {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          flex-direction: column;
          padding: 0.4rem 0.75rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
          border-radius: var(--radius-lg);
          transition: all 150ms ease;
          text-decoration: none;
          letter-spacing: 0.01em;
        }

        :global(.nav-link:hover) {
          color: var(--primary-color);
          background: rgba(37, 99, 235, 0.07);
        }

        :global(.nav-link.active) {
          color: var(--primary-color);
          background: rgba(37, 99, 235, 0.1);
          font-weight: 700;
        }

        .nav-indicator {
          position: absolute;
          bottom: 6px;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--primary-color);
        }

        /* Header Actions */
        .header-actions {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          flex-shrink: 0;
        }

        .icon-btn {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          background: var(--bg-primary);
          border: 1.5px solid var(--border-color);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 150ms ease;
          flex-shrink: 0;
        }
        .icon-btn:hover {
          background: rgba(37, 99, 235, 0.08);
          border-color: var(--primary-color);
          color: var(--primary-color);
          transform: translateY(-1px);
        }

        .location-btn {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0 0.75rem;
          height: 32px;
          border-radius: var(--radius-md);
          background: var(--bg-primary);
          border: 1.5px solid var(--border-color);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 150ms ease;
          font-family: var(--font-body);
        }
        .location-btn:hover {
          background: rgba(37, 99, 235, 0.08);
          border-color: var(--primary-color);
          color: var(--primary-color);
          transform: translateY(-1px);
        }
        .loc-icon {
          font-size: 0.9rem;
        }
        .loc-text {
          font-size: 0.8rem;
          font-weight: 600;
          white-space: nowrap;
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        :global(.cart-link) {
          position: relative;
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          background: var(--bg-primary);
          border: 1.5px solid var(--border-color);
          color: var(--text-secondary);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 150ms ease;
        }
        :global(.cart-link:hover),
        :global(.cart-link.active) {
          background: rgba(37, 99, 235, 0.08);
          border-color: var(--primary-color);
          color: var(--primary-color);
          transform: translateY(-1px);
        }

        .cart-count {
          position: absolute;
          top: -7px;
          right: -7px;
          min-width: 20px;
          height: 20px;
          padding: 0 5px;
          border-radius: 999px;
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          color: white;
          font-size: 0.68rem;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0,150,58,0.35);
          border: 2px solid white;
        }
        [data-theme="dark"] .cart-count { border-color: #0f172a; }

        .btn-outline-danger {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.4rem 0.85rem;
          font-size: 0.8rem;
          font-weight: 600;
          font-family: var(--font-heading);
          border-radius: var(--radius-md);
          border: 1.5px solid rgba(239,68,68,0.35);
          background: transparent;
          color: #ef4444;
          cursor: pointer;
          transition: all 150ms ease;
          position: relative;
          z-index: 10;
        }
        .btn-outline-danger:hover {
          background: rgba(239,68,68,0.08);
          border-color: #ef4444;
          transform: translateY(-1px);
        }

        /* Profile Dropdown */
        .profile-menu-container {
          position: relative;
        }

        .profile-btn {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary-color), #60a5fa);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1rem;
          font-family: var(--font-heading);
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
          border: 2px solid transparent;
          transition: all 0.2s ease;
        }

        .profile-btn:hover .avatar, .profile-btn.active .avatar {
          border-color: var(--primary-color);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
          transform: translateY(-1px);
        }
        
        .profile-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 250px;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.02);
          overflow: hidden;
          z-index: 1000;
          padding: 0.25rem 0;
          display: flex;
          flex-direction: column;
          font-family: var(--font-body);
        }

        [data-theme="dark"] .profile-dropdown {
          background: var(--bg-primary);
          border-color: var(--border-color);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.15s ease-out;
          transform-origin: top right;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(4px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .dropdown-header-link {
          display: block;
          text-decoration: none;
          color: inherit;
          transition: background 0.15s ease;
          margin: 0.15rem 0.35rem 0;
          border-radius: var(--radius-md);
        }

        .dropdown-header-link:hover {
          background: rgba(0, 0, 0, 0.03);
        }

        [data-theme="dark"] .dropdown-header-link:hover {
          background: rgba(255, 255, 255, 0.04);
        }

        .dropdown-header {
          padding: 0.5rem 0.6rem;
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .dropdown-avatar-large {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(37, 99, 235, 0.08);
          color: var(--primary-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.95rem;
          flex-shrink: 0;
          border: 1px solid rgba(37, 99, 235, 0.12);
        }

        [data-theme="dark"] .dropdown-avatar-large {
          background: rgba(96, 165, 250, 0.15);
          color: #60a5fa;
          border-color: rgba(96, 165, 250, 0.2);
        }

        .dropdown-user-info {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-width: 0;
        }

        .dropdown-user-info strong {
          color: var(--text-primary);
          font-size: 0.85rem;
          font-weight: 600;
          letter-spacing: -0.01em;
          line-height: 1.2;
        }

        .dropdown-user-info span {
          color: var(--text-muted);
          font-size: 0.7rem;
          margin-top: 1px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .dropdown-divider {
          height: 1px;
          background: var(--border-color);
          margin: 0.35rem 0;
          opacity: 0.5;
        }

        .dropdown-group-label {
          display: block;
          padding: 0.25rem 0.75rem 0.15rem;
          font-size: 0.6rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          opacity: 0.7;
        }

        .dropdown-menu-items {
          display: flex;
          flex-direction: column;
          padding: 0 0.35rem;
          list-style: none;
          margin: 0;
          gap: 0.05rem;
        }

        .profile-dropdown :global(.dropdown-item) {
          display: flex;
          align-items: center;
          padding: 0.35rem 0.5rem;
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 0.8rem;
          font-weight: 500;
          border-radius: var(--radius-md);
          transition: all 0.15s ease;
          background: transparent;
          border: none;
          cursor: pointer;
          width: 100%;
          text-align: left;
        }

        .profile-dropdown :global(.menu-item-text) {
          flex: 1;
          margin-left: 0.6rem;
          font-size: 0.8rem;
        }

        .profile-dropdown :global(.menu-icon-container) {
          width: 24px;
          height: 24px;
          border-radius: 4px;
          background: rgba(0, 0, 0, 0.03);
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }

        [data-theme="dark"] .profile-dropdown :global(.menu-icon-container) {
          background: rgba(255, 255, 255, 0.04);
        }

        .profile-dropdown :global(.dropdown-item:hover) {
          background: rgba(0, 0, 0, 0.03);
          color: var(--text-primary);
        }

        [data-theme="dark"] .profile-dropdown :global(.dropdown-item:hover) {
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-primary);
        }

        .profile-dropdown :global(.dropdown-item:hover) :global(.menu-icon-container) {
          background: rgba(37, 99, 235, 0.08);
          color: var(--primary-color);
        }

        [data-theme="dark"] .profile-dropdown :global(.dropdown-item:hover) :global(.menu-icon-container) {
          background: rgba(96, 165, 250, 0.15);
          color: #60a5fa;
        }

        .profile-dropdown :global(.dropdown-item.active) {
          background: rgba(37, 99, 235, 0.04);
          color: var(--primary-color);
          font-weight: 600;
        }

        [data-theme="dark"] .profile-dropdown :global(.dropdown-item.active) {
          background: rgba(96, 165, 250, 0.08);
          color: #60a5fa;
        }

        .profile-dropdown :global(.dropdown-item.active) :global(.menu-icon-container) {
          background: var(--primary-color);
          color: white;
        }

        [data-theme="dark"] .profile-dropdown :global(.dropdown-item.active) :global(.menu-icon-container) {
          background: #60a5fa;
          color: #0f172a;
        }

        .theme-toggle-btn {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .theme-switch {
          width: 30px;
          height: 16px;
          background: var(--border-color);
          border-radius: 999px;
          position: relative;
          transition: all 0.2s ease;
        }
        
        .theme-switch.active {
          background: var(--primary-color);
          border-color: var(--primary-color);
        }

        .theme-switch-handle {
          width: 10px;
          height: 10px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 3px;
          left: 3px;
          transition: transform 0.2s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.15);
        }

        [data-theme="dark"] .theme-switch-handle {
          background: #e2e8f0;
        }

        .theme-switch.active .theme-switch-handle {
          transform: translateX(14px);
          background: white;
        }

        .logout-group {
          margin-top: 0.1rem;
        }

        .profile-dropdown :global(.dropdown-item.text-danger) {
          color: #dc2626;
        }

        [data-theme="dark"] .profile-dropdown :global(.dropdown-item.text-danger) {
          color: #ef4444;
        }

        .profile-dropdown :global(.dropdown-item.text-danger) :global(.menu-icon-container) {
          color: currentColor;
        }

        .profile-dropdown :global(.dropdown-item.text-danger:hover) {
          background: #fef2f2;
          color: #b91c1c;
        }

        [data-theme="dark"] .profile-dropdown :global(.dropdown-item.text-danger:hover) {
          background: rgba(239, 68, 68, 0.08);
          color: #fca5a5;
        }

        .profile-dropdown :global(.dropdown-item.text-danger:hover) :global(.menu-icon-container) {
          background: rgba(239, 68, 68, 0.08);
          color: #b91c1c;
        }

        [data-theme="dark"] .profile-dropdown :global(.dropdown-item.text-danger:hover) :global(.menu-icon-container) {
          background: rgba(239, 68, 68, 0.15);
          color: #fca5a5;
        }

        /* Mobile Menu Button */
        .mobile-menu-btn {
          display: none;
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          background: var(--bg-primary);
          border: 1.5px solid var(--border-color);
          color: var(--text-primary);
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 150ms ease;
          flex-shrink: 0;
        }
        .mobile-menu-btn:hover {
          background: rgba(37, 99, 235, 0.08);
          border-color: var(--primary-color);
          color: var(--primary-color);
        }

        /* Mobile Drawer */
        .mobile-drawer {
          position: absolute;
          top: calc(100% + 0px);
          left: 0;
          right: 0;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border-color);
          box-shadow: 0 12px 40px rgba(0, 100, 40, 0.12);
          padding: 1.5rem;
          z-index: 999;
        }

        .mobile-nav {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        :global(.mobile-nav-link) {
          display: block;
          padding: 0.875rem 1rem;
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-secondary);
          border-radius: var(--radius-md);
          transition: all 150ms ease;
        }
        :global(.mobile-nav-link:hover),
        :global(.mobile-nav-link.active) {
          color: var(--primary-color);
          background: rgba(37, 99, 235, 0.08);
        }

        .mobile-nav-divider {
          height: 1px;
          background: var(--border-color);
          margin: 0.75rem 0;
        }

        @media (max-width: 900px) {
          .desktop-nav { display: none; }
          .mobile-menu-btn { display: flex; }
          .header-actions .btn-outline-danger span { display: none; }
          .location-btn .loc-text { display: none; }
        }

        @media (max-width: 640px) {
          .header-container { padding: 0 1rem; }
          .logo-tagline { display: none; }
          .header-actions .btn-outline-danger { display: none; }
        }
      `}</style>
    </>
  );
});
