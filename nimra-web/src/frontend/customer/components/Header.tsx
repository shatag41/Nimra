'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CompanyInfo } from '@/types/cms';
import { useCart } from '../contexts/CartProvider';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';
import LogoutConfirmationModal from './LogoutConfirmationModal';

interface HeaderProps {
  companyInfo: CompanyInfo;
}

export default React.memo(function Header({ companyInfo }: HeaderProps) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const pathname = usePathname();
  const { totalItems } = useCart();
  const { user, logout } = useAuth();
  const { city, loading, requestLocation, permissionDenied } = useLocation();

  const activeUser = mounted ? user : null;
  const dashboardHref = activeUser?.Role === 'Admin' ? '/admin' : '/customer-portal';
  const logoHref = activeUser ? dashboardHref : '/';

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const activeTheme = savedTheme || systemTheme;
    setTheme(activeTheme);
    document.documentElement.setAttribute('data-theme', activeTheme);

    const transitionTimeout = setTimeout(() => {
      document.documentElement.classList.add('theme-transition');
    }, 150);

    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(transitionTimeout);
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
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
            {/* Theme Toggle */}
            <button onClick={toggleTheme} className="icon-btn" aria-label="Toggle Theme" title="Toggle theme">
              {theme === 'light' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
              )}
            </button>

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

            {/* Cart — only for Customers */}
            {(!activeUser || activeUser.Role === 'Customer') && (
              <Link href="/cart" prefetch={true} className={`cart-link ${pathname === '/cart' ? 'active' : ''}`} aria-label={`Cart with ${mounted ? totalItems : 0} items`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                {mounted && totalItems > 0 && <span className="cart-count">{totalItems}</span>}
              </Link>
            )}

            {/* Login / Logout */}
            {activeUser ? (
              <button onClick={() => setIsLogoutModalOpen(true)} className="btn btn-outline-danger">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Logout
              </button>
            ) : (
              <Link href="/login" prefetch={true} className="btn btn-primary btn-sm">
                Login/Register
              </Link>
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

              {activeUser ? (
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
          background: rgba(255, 255, 255, 0.97);
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
