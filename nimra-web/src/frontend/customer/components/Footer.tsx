'use client';

import React from 'react';
import Link from 'next/link';
import { CompanyInfo } from '@/types/cms';

interface FooterProps {
  companyInfo: CompanyInfo;
}

export default React.memo(function Footer({ companyInfo }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <>
      <footer className="footer">
        {/* Decorative top wave */}
        <div className="footer-wave">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0 30C240 60 480 0 720 30C960 60 1200 0 1440 30V60H0V30Z" fill="currentColor"/>
          </svg>
        </div>

        <div className="footer-inner">
          <div className="container">
            <div className="footer-grid">
              {/* Brand Column */}
              <div className="footer-col brand-col">
                <Link href="/" className="footer-logo">
                  <div className="footer-logo-icon">
                    <svg width="20" height="20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M50 5C50 5 15 45 15 65C15 84.33 30.67 100 50 100C69.33 100 85 84.33 85 65C85 45 50 5 50 5Z" fill="white"/>
                      <text x="50" y="76" textAnchor="middle" fontSize="42" fontWeight="900" fontFamily="inherit" fill="#2563eb" letterSpacing="-1">N</text>
                    </svg>
                  </div>
                  <span className="footer-logo-text">{companyInfo.BrandName}</span>
                </Link>

                <p className="brand-pitch">
                  Committed to delivering pristine hydration through advanced 10-step purification. Trusted by families and offices across Pune.
                </p>

                {/* Certifications */}
                <div className="footer-certs">
                  <span className="cert-badge">✓ BIS Certified</span>
                  <span className="cert-badge">✓ FSSAI Licensed</span>
                  <span className="cert-badge">✓ ISO Quality</span>
                </div>
              </div>

              {/* Quick Links */}
              <div className="footer-col">
                <h3>Quick Links</h3>
                <ul className="footer-links">
                  <li><Link href="/">Home</Link></li>
                  <li><Link href="/products">Product Range</Link></li>
                  <li><Link href="/about">About Us</Link></li>
                  <li><Link href="/about#infrastructure">Our Plant</Link></li>
                  <li><Link href="/about#quality">Purification</Link></li>
                  <li><Link href="/contact">Contact Us</Link></li>
                </ul>
              </div>

              {/* Contact */}
              <div className="footer-col">
                <h3>Get in Touch</h3>
                <ul className="contact-details">
                  <li>
                    <span className="contact-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    </span>
                    <a href={`tel:${companyInfo.Phone}`}>{companyInfo.Phone}</a>
                  </li>
                  <li>
                    <span className="contact-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    </span>
                    <a href={`mailto:${companyInfo.Email}`}>{companyInfo.Email}</a>
                  </li>
                  <li>
                    <span className="contact-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    </span>
                    <span>{companyInfo.OfficeAddress}</span>
                  </li>
                </ul>
              </div>

              {/* Locations */}
              <div className="footer-col">
                <h3>Our Locations</h3>
                <div className="address-block">
                  <div className="address-label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--accent-color)" stroke="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/></svg>
                    Corporate Office
                  </div>
                  <p>{companyInfo.OfficeAddress}</p>
                </div>
                <div className="address-block" style={{ marginTop: '1.1rem' }}>
                  <div className="address-label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--accent-color)" stroke="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/></svg>
                    Manufacturing Site
                  </div>
                  <p>{companyInfo.PlantAddress}</p>
                </div>
              </div>
            </div>

            {/* Footer Bottom */}
            <div className="footer-bottom">
              <p className="footer-copy">
                &copy; {currentYear} <strong>{companyInfo.BrandName}</strong> Beverage Company (T.S. Enterprises). All rights reserved.
              </p>
              <div className="footer-bottom-links">
                <Link href="/about">About</Link>
                <span>·</span>
                <Link href="/contact">Contact</Link>
                <span>·</span>
                <Link href="/products">Products</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* WhatsApp FAB */}
      <a
        href={`https://wa.me/${companyInfo.WhatsAppNumber}?text=Hi%20NIMRA,%20I'd%20like%20to%20inquire%20about%20your%20packaged%20drinking%20water.`}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-fab"
        aria-label="Chat with NIMRA on WhatsApp"
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
        </svg>
      </a>

      <style jsx>{`
        .footer {
          position: relative;
          color: #94a3b8;
          font-size: 0.9rem;
          margin-top: 0;
        }

        .footer-wave {
          color: #172554;
          line-height: 0;
          margin-bottom: -1px;
          height: 35px;
        }

        .footer-inner {
          background: #172554;
          padding: 1.5rem 0 1rem;
        }

        .footer-inner .container {
          max-width: 1400px;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 1.4fr 0.8fr 1fr 1.1fr;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .footer-col h3 {
          color: #94a3b8;
          font-family: var(--font-heading);
          font-size: 0.75rem;
          font-weight: 700;
          margin-bottom: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          position: relative;
        }

        :global(.footer-logo) {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          text-decoration: none;
          transition: opacity 200ms ease;
        }
        :global(.footer-logo:hover) { opacity: 0.9; }

        .footer-logo-icon {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(37, 99, 235, 0.05));
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }

        .footer-logo-text {
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 1.15rem;
          color: #ffffff;
          letter-spacing: -0.01em;
        }

        .brand-pitch {
          line-height: 1.6;
          color: #cbd5e1;
          font-size: 0.85rem;
          margin-bottom: 1rem;
        }

        .footer-certs {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .cert-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.65rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 600;
          color: #94a3b8;
          letter-spacing: 0.05em;
          transition: all 200ms ease;
        }
        .cert-badge:hover {
          background: #ffffff;
          color: #0f172a;
          border-color: #ffffff;
        }

        .footer-links {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        :global(.footer-links a) {
          color: #cbd5e1;
          font-size: 0.85rem;
          display: inline-flex;
          align-items: center;
          transition: all 200ms ease;
          padding: 0.1rem 0;
          position: relative;
        }
        :global(.footer-links a:hover) {
          color: #ffffff;
        }

        .contact-details {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .contact-details li {
          display: flex;
          align-items: flex-start;
          gap: 0.6rem;
          color: #cbd5e1;
          font-size: 0.85rem;
          line-height: 1.5;
          transition: color 200ms ease;
        }
        .contact-details li:hover {
          color: #ffffff;
        }
        .contact-icon {
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #64748b;
          margin-top: 2px;
          transition: color 200ms ease;
        }
        .contact-details li:hover .contact-icon {
          color: #3b82f6;
        }
        .contact-details a {
          color: inherit;
          text-decoration: none;
        }

        .address-block {
          padding-left: 0.5rem;
          border-left: 1px solid rgba(255,255,255,0.08);
          transition: border-color 200ms ease;
        }
        .address-block:hover {
          border-color: rgba(59, 130, 246, 0.4);
        }
        .address-label {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.7rem;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.35rem;
        }
        .address-label svg {
          opacity: 0.7;
        }
        .address-block p {
          color: #cbd5e1;
          font-size: 0.85rem;
          line-height: 1.5;
        }

        .footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
          padding-top: 1.25rem;
          border-top: 1px solid rgba(255,255,255,0.06);
        }

        .footer-copy {
          color: #64748b;
          font-size: 0.8rem;
          letter-spacing: 0.02em;
        }
        .footer-copy strong { color: #94a3b8; font-weight: 600; }

        .footer-bottom-links {
          display: flex;
          align-items: center;
          gap: 1rem;
          color: #64748b;
          font-size: 0.8rem;
        }
        .footer-bottom-links a {
          color: #64748b;
          transition: color 200ms ease;
        }
        .footer-bottom-links a:hover { color: #cbd5e1; }

        .whatsapp-fab {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          background: linear-gradient(135deg, #25D366, #128C7E);
          color: white;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 28px rgba(37,211,102,0.4);
          z-index: 1000;
          transition: all 300ms cubic-bezier(0.4,0,0.2,1);
          animation: float 4s ease-in-out infinite;
        }
        .whatsapp-fab:hover {
          transform: scale(1.12) rotate(8deg);
          box-shadow: 0 16px 40px rgba(37,211,102,0.5);
        }

        @media (max-width: 1024px) {
          .footer-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 640px) {
          .footer-grid { grid-template-columns: 1fr; gap: 1.5rem; }
          .footer-inner { padding: 2rem 0 1.5rem; }
          .footer-bottom { flex-direction: column; text-align: center; }
          .whatsapp-fab { width: 54px; height: 54px; bottom: 1.5rem; right: 1.5rem; }
        }
      `}</style>
    </>
  );
});
