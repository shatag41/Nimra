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
        
        const filteredData = data.filter(n => {
           const type = String(n.Type || '').toLowerCase();
           if (type === 'admin' || type === 'inquiry') {
             return String(n.Message) === "Your inquiry has been reviewed";
           }
           return true;
        });

        const updated = filteredData.map(n => {
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
      
      await Promise.all(unread.map(n => saveNotification({ ID: n.ID, Read: true }, 'update')));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
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
            <div className="header-icon-group">
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

            {/* Cart — only for Customers (placed next to Location) */}
            {(!activeUser || activeUser.Role === 'Customer') && (
              <Link href="/cart" prefetch={true} className={`cart-link ${pathname === '/cart' ? 'active' : ''}`} aria-label={`Cart with ${mounted ? totalItems : 0} items`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                {mounted && totalItems > 0 && <span className="cart-count">{totalItems}</span>}
              </Link>
            )}

            {/* Admin Notifications Bell */}
            {activeUser && (
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
                  <div className="profile-dropdown notification-dropdown-menu animate-fade-in-up">
                    <div className="dropdown-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>Notifications</strong>
                      {unreadCount > 0 && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleMarkAllAsRead(); }}
                          style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="dropdown-divider"></div>
                    {notifications.length === 0 ? (
                      <div className="notification-empty-state">
                      </div>
                    ) : (
                      <div className="notification-list">
                        {/* RECENT (UNREAD) SECTION */}
                        {(() => {
                          const unreadNotifs = notifications.filter(n => n.Read !== true && n.Read !== 'true');
                          return unreadNotifs.length > 0 && (
                            <>
                              <div className="notification-section-label notification-section-label-unread">
                                Recent
                              </div>
                              {unreadNotifs.map((n) => {
                                const originalIdx = notifications.findIndex(item => item.ID === n.ID && item.Timestamp === n.Timestamp);
                                return (
                                  <div 
                                    key={`unread-${n.ID}-${originalIdx}`} 
                                    onClick={() => handleMarkAsRead(n.ID, originalIdx)}
                                    className="notification-dropdown-item notification-dropdown-item-unread"
                                  >
                                    <strong className="notification-title notification-title-unread">{n.Title}</strong>
                                    <p className="notification-message">{n.Message}</p>
                                    <small className="notification-date">
                                      {new Date(n.CreatedAt || n.Timestamp).toLocaleDateString()}
                                    </small>
                                    <span className="notification-unread-dot" />
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
                              <div className="notification-section-label notification-section-label-read">
                                Earliest
                              </div>
                              {readNotifs.map((n) => {
                                const originalIdx = notifications.findIndex(item => item.ID === n.ID && item.Timestamp === n.Timestamp);
                                return (
                                  <div 
                                    key={`read-${n.ID}-${originalIdx}`} 
                                    onClick={() => handleMarkAsRead(n.ID, originalIdx)}
                                    className="notification-dropdown-item"
                                  >
                                    <strong className="notification-title">{n.Title}</strong>
                                    <p className="notification-message">{n.Message}</p>
                                    <small className="notification-date">
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
