'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CompanyInfo } from '../types/cms';

interface HeaderProps {
  companyInfo: CompanyInfo;
}

export default function Header({ companyInfo }: HeaderProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Load theme from localStorage and handle scroll effects
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const activeTheme = savedTheme || systemTheme;
    setTheme(activeTheme);
    document.documentElement.setAttribute('data-theme', activeTheme);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Products', href: '/products' },
    { name: 'About Us', href: '/about' },
    { name: 'Contact Us', href: '/contact' },
  ];

  return (
    <>
      <header className={`header ${isScrolled ? 'scrolled glass' : ''}`}>
        <div className="header-container">
          <Link href="/" className="logo">
            <svg width="34" height="34" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 5C50 5 15 45 15 65C15 84.33 30.67 100 50 100C69.33 100 85 84.33 85 65C85 45 50 5 50 5Z" fill="url(#waterGrad)"/>
              <path d="M43 75C37 75 32 70 32 64C32 63.45 32.45 63 33 63C33.55 63 34 63.45 34 64C34 68.97 38.03 73 43 73C43.55 73 44 73.45 44 74C44 74.55 43.55 75 43 75Z" fill="white" fillOpacity="0.6"/>
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

            {/* Inquiry Trigger CTA */}
            <Link href="/contact" className="btn-cta">
              Get in Touch
            </Link>

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
                  className={`mobile-nav-link ${pathname === link.href ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <Link
                href="/contact"
                className="btn btn-primary"
                style={{ marginTop: '1.5rem', width: '100%' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Inquire Now
              </Link>
            </nav>
          </div>
        )}
      </header>

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
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.03);
          border-bottom: 1px solid var(--border-color);
        }
        .header-container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 1.5rem;
          letter-spacing: -0.02em;
          color: var(--text-primary);
        }
        .logo-text {
          background: linear-gradient(135deg, var(--text-primary) 30%, var(--primary-color) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .desktop-nav {
          display: flex;
          gap: 2.5rem;
        }
        .nav-link {
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--text-secondary);
          position: relative;
          padding: 0.5rem 0;
        }
        .nav-link:hover, .nav-link.active {
          color: var(--primary-color);
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: var(--primary-color);
          transition: width var(--transition-fast);
        }
        .nav-link:hover::after, .nav-link.active::after {
          width: 100%;
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }
        .icon-btn {
          background: transparent;
          border: none;
          color: var(--text-primary);
          cursor: pointer;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color var(--transition-fast);
        }
        .icon-btn:hover {
          background: rgba(0, 162, 153, 0.08);
          color: var(--primary-color);
        }
        .btn-cta {
          display: inline-flex;
          align-items: center;
          padding: 0.65rem 1.35rem;
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: 0.85rem;
          border-radius: 50px;
          background: var(--primary-color);
          color: white;
          box-shadow: 0 4px 10px rgba(0, 162, 153, 0.2);
          transition: all var(--transition-normal);
        }
        .btn-cta:hover {
          background: #008080;
          transform: translateY(-1px);
          box-shadow: 0 6px 15px rgba(0, 162, 153, 0.3);
        }
        .mobile-menu-btn {
          display: none;
          background: transparent;
          border: none;
          color: var(--text-primary);
          cursor: pointer;
        }
        .mobile-drawer {
          position: absolute;
          top: 80px;
          left: 0;
          right: 0;
          padding: 2rem 1.5rem;
          border-bottom: 1px solid var(--border-color);
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        }
        .mobile-nav {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .mobile-nav-link {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-secondary);
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--border-color);
        }
        .mobile-nav-link.active, .mobile-nav-link:hover {
          color: var(--primary-color);
          border-bottom-color: var(--primary-color);
        }
        
        @media (max-width: 768px) {
          .desktop-nav, .btn-cta {
            display: none;
          }
          .mobile-menu-btn {
            display: block;
          }
        }
      `}</style>
    </>
  );
}
