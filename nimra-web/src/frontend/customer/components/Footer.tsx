'use client';

import React from 'react';
import Link from 'next/link';
import { CompanyInfo } from '@/types/cms';

interface FooterProps {
  companyInfo: CompanyInfo;
}

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12 2.2 2.2 4.8-5" />
  </svg>
);

const LocationIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

export default React.memo(function Footer({ companyInfo }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const brandName = companyInfo.BrandName || 'NIMRA';

  return (
    <>
      <footer className="footer">
        <div className="container footer-container">
          <div className="footer-grid">
            <div className="footer-col footer-brand">
              <Link href="/" className="footer-logo" aria-label={`${brandName} home`}>
                <span className="footer-logo-icon" aria-hidden="true">
                  <svg width="19" height="19" viewBox="0 0 100 100" fill="none">
                    <path d="M50 5S17 43 17 64a33 33 0 0 0 66 0C83 43 50 5 50 5Z" fill="currentColor" />
                    <text x="50" y="75" textAnchor="middle" fontSize="40" fontWeight="900" fontFamily="inherit" fill="white">N</text>
                  </svg>
                </span>
                <span>{brandName}</span>
              </Link>
              <p className="brand-pitch">
                Reliable packaged drinking water, purified for homes, offices, and events across Pune.
              </p>
              <div className="footer-certs" aria-label="Certifications">
                <span><CheckIcon /> BIS Certified</span>
                <span><CheckIcon /> FSSAI Licensed</span>
                <span><CheckIcon /> ISO Quality</span>
              </div>
            </div>

            <nav className="footer-col" aria-label="Footer navigation">
              <h2>Explore</h2>
              <ul className="footer-links">
                <li><Link href="/products">Products</Link></li>
                <li><Link href="/about">About</Link></li>
                <li><Link href="/track">Track Order</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </nav>

            <div className="footer-col">
              <h2>Contact</h2>
              <ul className="contact-list">
                {companyInfo.Phone && (
                  <li>
                    <span className="footer-icon" aria-hidden="true">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.94.36 1.87.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.94.34 1.87.58 2.81.7A2 2 0 0 1 22 16.92Z" />
                      </svg>
                    </span>
                    <div><span className="contact-label">Phone</span><a href={`tel:${companyInfo.Phone}`}>{companyInfo.Phone}</a></div>
                  </li>
                )}
                {companyInfo.Email && (
                  <li>
                    <span className="footer-icon" aria-hidden="true">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    </span>
                    <div><span className="contact-label">Email</span><a href={`mailto:${companyInfo.Email}`}>{companyInfo.Email}</a></div>
                  </li>
                )}
              </ul>
            </div>

            <div className="footer-col">
              <h2>Locations</h2>
              <address className="locations-list">
                {companyInfo.OfficeAddress && (
                  <div className="location-item">
                    <span className="footer-icon" aria-hidden="true"><LocationIcon /></span>
                    <div><strong>Office</strong><span>{companyInfo.OfficeAddress}</span></div>
                  </div>
                )}
                {companyInfo.PlantAddress && (
                  <div className="location-item">
                    <span className="footer-icon" aria-hidden="true"><LocationIcon /></span>
                    <div><strong>Plant</strong><span>{companyInfo.PlantAddress}</span></div>
                  </div>
                )}
              </address>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; {currentYear} <strong>{brandName}</strong> Beverage Company, T.S. Enterprises. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <a
        href={`https://wa.me/${companyInfo.WhatsAppNumber}?text=Hi%20NIMRA,%20I'd%20like%20to%20inquire%20about%20your%20packaged%20drinking%20water.`}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-fab"
        aria-label="Chat with NIMRA on WhatsApp"
      >
        <svg width="25" height="25" viewBox="0 0 24 24" fill="white" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
        </svg>
      </a>

      <style jsx>{`
        .footer {
          margin-top: 0;
          background: var(--surface-2);
          border-top: 1px solid var(--border-color);
          color: var(--text-secondary);
          font-family: var(--font-body);
        }

        .footer-container { max-width: 1400px; padding-top: 1.75rem; }

        .footer-grid {
          display: grid;
          grid-template-columns: minmax(240px, 1.35fr) minmax(120px, 0.65fr) minmax(200px, 0.9fr) minmax(280px, 1.3fr);
          gap: 1.5rem;
          padding-bottom: 1.5rem;
        }

        .footer-col { min-width: 0; }
        .footer-col + .footer-col { border-left: 1px solid var(--border-color); padding-left: 1.5rem; }

        .footer-col h2 {
          margin: 0 0 0.75rem;
          color: var(--text-primary);
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          line-height: 1.2;
          text-transform: uppercase;
        }

        :global(.footer-logo) {
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          color: var(--text-primary);
          font-family: var(--font-heading);
          font-size: 1.08rem;
          font-weight: 800;
          line-height: 1;
          text-decoration: none;
        }

        .footer-logo-icon {
          width: 30px;
          height: 30px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 30px;
          color: var(--primary-color);
          border: 1px solid rgba(var(--primary-rgb), 0.2);
          border-radius: 6px;
          background: rgba(var(--primary-rgb), 0.08);
        }

        .brand-pitch {
          max-width: 360px;
          margin: 0.7rem 0 0.85rem;
          color: var(--text-secondary);
          font-size: 0.79rem;
          line-height: 1.5;
        }

        .footer-certs { display: flex; flex-wrap: wrap; gap: 0.4rem; }
        .footer-certs span {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.25rem 0.45rem;
          color: var(--primary-color);
          border: 1px solid rgba(var(--primary-rgb), 0.2);
          border-radius: 4px;
          background: rgba(37,99,235,0.08);
          font-size: 0.65rem;
          font-weight: 700;
          line-height: 1;
        }

        .footer-links, .contact-list { margin: 0; padding: 0; list-style: none; }
        .footer-links { display: grid; gap: 0.42rem; }
        :global(.footer-links a) {
          color: var(--text-secondary);
          font-size: 0.8rem;
          line-height: 1.35;
          text-decoration: none;
          transition: color 150ms ease;
        }
        :global(.footer-links a:hover) { color: var(--primary-color); }

        .contact-list { display: grid; gap: 0.7rem; }
        .contact-list li, .location-item { display: flex; align-items: flex-start; gap: 0.55rem; min-width: 0; }
        .contact-list li > div, .location-item > div { display: grid; min-width: 0; gap: 0.12rem; }
        .contact-label, .location-item strong {
          color: var(--text-muted);
          font-size: 0.62rem;
          font-style: normal;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .contact-list a {
          color: var(--text-primary);
          font-size: 0.78rem;
          line-height: 1.35;
          overflow-wrap: anywhere;
          text-decoration: none;
        }
        .contact-list a:hover { color: var(--primary-color); }

        .footer-icon {
          width: 28px;
          height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 28px;
          color: var(--primary-color);
          border: 1px solid rgba(var(--primary-rgb), 0.16);
          border-radius: 6px;
          background: rgba(37,99,235,0.08);
        }

        .locations-list { display: grid; gap: 0.7rem; margin: 0; font-style: normal; }
        .location-item span:last-child {
          color: var(--text-secondary);
          font-size: 0.75rem;
          line-height: 1.4;
        }

        .footer-bottom {
          padding: 0.8rem 0 0.9rem;
          border-top: 1px solid var(--border-color);
          color: var(--text-muted);
          font-size: 0.7rem;
          line-height: 1.4;
          text-align: center;
        }
        .footer-bottom strong { color: var(--text-secondary); font-weight: 700; }

        .whatsapp-fab {
          position: fixed;
          right: 1.5rem;
          bottom: 1.5rem;
          z-index: 1000;
          width: 52px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          border-radius: 50%;
          background: #16a34a;
          box-shadow: 0 8px 22px rgba(22,163,74,0.28);
          transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease;
        }
        .whatsapp-fab:hover { transform: translateY(-2px); background: #15803d; box-shadow: 0 10px 26px rgba(22,163,74,0.36); }
        .whatsapp-fab:focus-visible { outline: 2px solid white; outline-offset: 3px; }

        @media (max-width: 1024px) {
          .footer-grid { grid-template-columns: 1.25fr 0.75fr 1fr; }
          .footer-grid > :last-child { grid-column: 1 / -1; border-left: 0; border-top: 1px solid var(--border-color); padding: 1rem 0 0; }
          .locations-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        @media (max-width: 700px) {
          .footer-container { padding-top: 1.35rem; }
          .footer-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.2rem; padding-bottom: 1.15rem; }
          .footer-col + .footer-col { border-left: 0; padding-left: 0; }
          .footer-brand { grid-column: 1 / -1; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color); }
          .footer-grid > :last-child { padding-top: 1rem; }
        }

        @media (max-width: 480px) {
          .footer-grid { grid-template-columns: 1fr; gap: 1rem; }
          .footer-brand, .footer-grid > :last-child { grid-column: auto; }
          .footer-col:not(:first-child) { padding-top: 0.9rem; border-top: 1px solid var(--border-color); }
          .locations-list { grid-template-columns: 1fr; }
          .whatsapp-fab { right: 1rem; bottom: 1rem; width: 48px; height: 48px; }
        }
      `}</style>
    </>
  );
});
