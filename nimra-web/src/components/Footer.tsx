'use client';

import React from 'react';
import Link from 'next/link';
import { CompanyInfo } from '../types/cms';

interface FooterProps {
  companyInfo: CompanyInfo;
}

export default function Footer({ companyInfo }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <>
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            {/* Column 1: Brand details */}
            <div className="footer-col brand-col">
              <Link href="/" className="footer-logo">
                <svg width="30" height="30" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M50 5C50 5 15 45 15 65C15 84.33 30.67 100 50 100C69.33 100 85 84.33 85 65C85 45 50 5 50 5Z" fill="url(#footerWaterGrad)"/>
                  <defs>
                    <linearGradient id="footerWaterGrad" x1="50" y1="5" x2="50" y2="100" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#00E5FF"/>
                      <stop offset="1" stopColor="#00a299"/>
                    </linearGradient>
                  </defs>
                </svg>
                <span>{companyInfo.BrandName}</span>
              </Link>
              <p className="brand-pitch">
                Committed to delivering pristine hydration of unmatched purity and safety, inspired by standard mineral enrichment technologies.
              </p>
            </div>

            {/* Column 2: Quick Links */}
            <div className="footer-col">
              <h3>Quick Links</h3>
              <ul className="footer-links">
                <li><Link href="/">Home</Link></li>
                <li><Link href="/products">Product Range</Link></li>
                <li><Link href="/about">About Us</Link></li>
                <li><Link href="/about#infrastructure">Our Plant</Link></li>
                <li><Link href="/about#quality">Purification Steps</Link></li>
                <li><Link href="/contact">Inquire Now</Link></li>
              </ul>
            </div>

            {/* Column 3: Contact details */}
            <div className="footer-col contact-col">
              <h3>Contact Info</h3>
              <ul className="contact-details">
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  <a href={`tel:${companyInfo.Phone}`}>{companyInfo.Phone}</a>
                </li>
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  <a href={`mailto:${companyInfo.Email}`}>{companyInfo.Email}</a>
                </li>
              </ul>
            </div>

            {/* Column 4: Offices */}
            <div className="footer-col address-col">
              <h3>Our Locations</h3>
              <div className="address-item">
                <strong>Corporate Office:</strong>
                <p>{companyInfo.OfficeAddress}</p>
              </div>
              <div className="address-item" style={{ marginTop: '1rem' }}>
                <strong>Manufacturing Site:</strong>
                <p>{companyInfo.PlantAddress}</p>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; {currentYear} {companyInfo.BrandName} Beverage Company (T.S. Enterprises). All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a 
        href={`https://wa.me/${companyInfo.WhatsAppNumber}?text=Hi%20NIMRA,%20I'd%20like%20to%20inquire%20about%20your%20packaged%20drinking%20water%20products.`}
        target="_blank" 
        rel="noopener noreferrer" 
        className="whatsapp-fab"
        aria-label="Chat with NIMRA on WhatsApp"
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>
      </a>

      <style jsx>{`
        .footer {
          background: var(--bg-secondary);
          color: var(--text-secondary);
          padding: 4rem 0 2rem;
          border-top: 1px solid var(--border-color);
          font-size: 0.9rem;
        }
        .footer-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr 1fr 1.2fr;
          gap: 3rem;
          margin-bottom: 3rem;
        }
        .footer-col h3 {
          color: var(--text-primary);
          font-family: var(--font-heading);
          font-size: 1.1rem;
          font-weight: 700;
          margin-bottom: 1.25rem;
          position: relative;
          padding-bottom: 0.75rem;
        }
        .footer-col h3::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 40px;
          height: 3px;
          background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
          border-radius: var(--radius-sm);
        }
        .footer-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 1.6rem;
          color: var(--text-primary);
          margin-bottom: 1rem;
          transition: transform var(--transition-fast);
        }
        .footer-logo:hover {
          transform: translateX(4px);
        }
        .brand-pitch {
          line-height: 1.7;
          color: var(--text-muted);
        }
        .footer-links {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .footer-links a {
          transition: all var(--transition-fast);
          display: inline-block;
          padding: 0.2rem 0;
        }
        .footer-links a:hover {
          color: var(--primary-color);
          transform: translateX(6px);
        }
        .contact-details {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .contact-details li {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }
        .contact-details li svg {
          margin-top: 2px;
          flex-shrink: 0;
          color: var(--primary-color);
        }
        .contact-details a:hover {
          color: var(--primary-color);
        }
        .address-item strong {
          display: block;
          color: var(--text-primary);
          font-size: 0.85rem;
          margin-bottom: 0.5rem;
          font-weight: 700;
        }
        .address-item p {
          line-height: 1.6;
          color: var(--text-muted);
        }
        .footer-bottom {
          padding-top: 2rem;
          border-top: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .whatsapp-fab {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #25D366, #128C7E);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-lg);
          z-index: 1000;
          transition: all var(--transition-normal);
          animation: float 3s ease-in-out infinite;
        }
        .whatsapp-fab:hover {
          transform: scale(1.1) rotate(10deg);
          box-shadow: 0 8px 30px rgba(37, 211, 102, 0.4);
        }

        @media (max-width: 1024px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 640px) {
          .footer-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
          .footer {
            padding: 3rem 0 1.5rem;
          }
          .footer-bottom {
            flex-direction: column;
            text-align: center;
          }
          .whatsapp-fab {
            width: 56px;
            height: 56px;
            bottom: 1.5rem;
            right: 1.5rem;
          }
        }
      `}</style>
    </>
  );
}
