'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CompanyInfo } from '../types/cms';
import { useCart } from './CartProvider';
import { useAuth } from '../context/AuthContext';
import LogoutConfirmationModal from './LogoutConfirmationModal';

interface HeaderProps {
  companyInfo: CompanyInfo;
}

export default React.memo(function Header({ companyInfo }: HeaderProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const pathname = usePathname();
  const { totalItems } = useCart();
  const { user, logout } = useAuth();
  const dashboardHref = user?.Role === 'Admin' ? '/admin' : '/customer-portal';
  const logoHref = user ? dashboardHref : '/';

  // Load theme from localStorage and handle scroll effects
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const activeTheme = savedTheme || systemTheme;
    setTheme(activeTheme);
    document.documentElement.setAttribute('data-theme', activeTheme);

    // Enable CSS transitions after the initial load to prevent visual flashing on page load/refresh
    const transitionTimeout = setTimeout(() => {
      document.documentElement.classList.add('theme-transition');
    }, 150);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

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
    if (user?.Role === 'Admin') {
      return [
        { name: 'Dashboard', href: '/admin' },
        { name: 'Products Mgmt', href: '/admin/products' },
        { name: 'Orders Mgmt', href: '/admin/orders' },
      ];
    } else if (user?.Role === 'Customer') {
      return [
        { name: 'Portal', href: '/customer-portal' },
        { name: 'Products', href: '/products' },
        { name: 'Track Order', href: '/track' },
        { name: 'About Us', href: '/about' },
        { name: 'Contact Us', href: '/contact' },
      ];
    } else {
      return [
        { name: 'Home', href: '/' },
        { name: 'Products', href: '/products' },
        { name: 'Track Order', href: '/track' },
        { name: 'About Us', href: '/about' },
        { name: 'Contact Us', href: '/contact' },
      ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <>
      <header className={`header ${isScrolled ? 'scrolled glass' : ''}`}>
        <div className="header-container">
          <Link href={logoHref} className="logo">
            <svg width="34" height="34" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 5C50 5 15 45 15 65C15 84.33 30.67 100 50 100C69.33 100 85 84.33 85 65C85 45 50 5 50 5Z" fill="url(#waterGrad)"/>
              <text
                x="50"
                y="76"
                textAnchor="middle"
                fontSize="42"
                fontWeight="900"
                fontFamily="inherit"
                fill="white"
                letterSpacing="-1"
              >N</text>
              <defs>
                <linearGradient id="waterGrad" x1="50" y1="5" x2="50" y2="100" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00E5FF"/>
                  <stop offset="1" stopColor="#00a299"/>
                </linearGradient>
              </defs>
            </svg>
            <span className="logo-text">{companyInfo.BrandName || 'NIMRA'}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="desktop-nav">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                prefetch={true}
                className={`nav-link ${pathname === link.href ? 'active' : ''}`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="header-actions">
            {/* Theme Toggle Button */}
            <button onClick={toggleTheme} className="icon-btn" aria-label="Toggle Theme">
              {theme === 'light' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.93 4.93l1.41 1.41"/><path d="M17.66 17.66l1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M6.34 17.66l-1.41 1.41"/><path d="M19.07 4.93l-1.41 1.41"/></svg>
              )}
            </button>

            {/* Cart Icon (only for Customers) */}
            {(!user || user.Role === 'Customer') && (
              <Link href="/cart" prefetch={true} className="cart-link" aria-label={`Cart with ${totalItems} items`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                <span>{totalItems}</span>
              </Link>
            )}

            {user ? (
              <button onClick={() => setIsLogoutModalOpen(true)} className="btn btn-danger">
                Logout
              </button>
            ) : (
              <Link href="/login" prefetch={true} className="btn btn-primary">
                Login
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="mobile-menu-btn" aria-label="Toggle Menu">
              {mobileMenuOpen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h16M4 6h16M4 18h16"/></svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="mobile-drawer animate-fade-in glass">
            <nav className="mobile-nav">
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
              {(!user || user.Role === 'Customer') && (
                <Link
                  href="/cart"
                  prefetch={true}
                  className="btn btn-primary"
                  style={{ marginTop: '1.5rem', width: '100%' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  View Cart ({totalItems})
                </Link>
              )}
              {user ? (
                <button
                  className="btn btn-error"
                  style={{ marginTop: '0.5rem', width: '100%' }}
                  onClick={() => { setMobileMenuOpen(false); setIsLogoutModalOpen(true); }}
                >
                  Logout
                </button>
              ) : (
                <Link
                  href="/login"
                  prefetch={true}
                  className="btn btn-primary"
                  style={{ marginTop: '0.5rem', width: '100%' }}
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
          height: 80px;
          z-index: 1000;
          display: flex;
          align-items: center;
          transition: all var(--transition-normal);
          background: var(--nav-bg);
          border-bottom: 1px solid var(--border-color);
        }
        .header.scrolled {
          height: 70px;
          background: var(--nav-bg);
          box-shadow: var(--shadow-md);
          border-bottom: 1px solid var(--border-color);
        }
        .header-container {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        :global(.logo) {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 1.5rem;
          letter-spacing: -0.02em;
          color: var(--text-primary);
          transition: transform var(--transition-fast), opacity var(--transition-fast);
        }
        :global(.logo:hover) {
          transform: translateY(-1px) scale(1.02);
          opacity: 0.9;
        }
        .logo-text {
          background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .desktop-nav {
          display: flex;
          gap: 2.5rem;
        }
        :global(.nav-link) {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-secondary);
          position: relative;
          padding: 0.45rem 0.85rem;
          border-radius: 999px;
          transition: all var(--transition-fast) ease-in-out;
          cursor: pointer;
        }
        :global(.nav-link:hover) {
          color: var(--primary-color);
          background: rgba(var(--primary-rgb), 0.08);
          transform: translateY(-1px);
        }
        :global(.nav-link.active) {
          color: var(--primary-color);
          background: rgba(var(--primary-rgb), 0.12);
        }
        :global(.nav-link::after) {
          content: '';
          position: absolute;
          bottom: 2px;
          left: 0.85rem;
          right: 0.85rem;
          height: 2px;
          background: var(--primary-color);
          border-radius: 2px;
          transform: scaleX(0);
          transition: transform var(--transition-fast);
          transform-origin: center;
        }
        :global(.nav-link:hover::after), :global(.nav-link.active::after) {
          transform: scaleX(1);
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        :global(.cart-link) {
          position: relative;
          width: 44px;
          height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1.5px solid var(--border-color);
          border-radius: var(--radius-xl);
          color: var(--text-primary);
          background: var(--bg-secondary);
          transition: all var(--transition-fast) ease-in-out;
        }
        :global(.cart-link:hover) {
          border-color: var(--primary-color);
          color: var(--primary-color);
          background: rgba(var(--primary-rgb), 0.08);
          transform: translateY(-1px);
        }
        .cart-link span {
          position: absolute;
          top: -6px;
          right: -6px;
          min-width: 22px;
          height: 22px;
          padding: 0 6px;
          border-radius: 999px;
          background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
          color: white;
          font-size: 0.7rem;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-sm);
        }
        .icon-btn {
          background: var(--bg-secondary);
          border: 1.5px solid var(--border-color);
          color: var(--text-primary);
          cursor: pointer;
          width: 44px;
          height: 44px;
          border-radius: var(--radius-xl);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast) ease-in-out;
        }
        .icon-btn:hover {
          background: rgba(var(--primary-rgb), 0.08);
          color: var(--primary-color);
          border-color: var(--primary-color);
          transform: translateY(-1px);
        }
        .mobile-menu-btn {
          display: none;
          background: var(--bg-secondary);
          border: 1.5px solid var(--border-color);
          color: var(--text-primary);
          cursor: pointer;
          width: 44px;
          height: 44px;
          border-radius: var(--radius-xl);
          display: none;
          align-items: center;
          justify-content: center;
        }
        .mobile-menu-btn:hover {
          border-color: var(--primary-color);
          color: var(--primary-color);
        }
        .mobile-drawer {
          position: absolute;
          top: 80px;
          left: 0;
          right: 0;
          padding: 2rem 1.5rem;
          border-bottom: 1px solid var(--border-color);
          box-shadow: var(--shadow-xl);
        }
        .mobile-nav {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        :global(.mobile-nav-link) {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-secondary);
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--border-light);
          transition: color var(--transition-fast) ease-in-out;
          display: block;
        }
        :global(.mobile-nav-link.active), :global(.mobile-nav-link:hover) {
          color: var(--primary-color);
        }
        
        @media (max-width: 768px) {
          .desktop-nav, .header-actions .btn {
            display: none;
          }
          .mobile-menu-btn {
            display: flex;
          }
          .header-container {
            padding: 0 1.25rem;
          }
        }
      `}</style>
    </>
  );
});
