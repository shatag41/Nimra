'use client';

import React from 'react';
import Link from 'next/link';
import { CompanyInfo } from '@/types/cms';
import BackToTop from './BackToTop';

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

const MobileFooterSeparator = () => <div className="mobile-footer-separator" aria-hidden="true" />;

export default React.memo(function Footer({ companyInfo }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const brandName = companyInfo.BrandName || 'NIMRA';
  const [emailName, emailDomain] = (companyInfo.Email || '').split('@');

  return (
    <>
      <footer className="footer">
        <BackToTop />
        <div className="container footer-container">
          <div className="footer-grid">
            <div className="footer-col footer-brand">
              <Link href="/" className="footer-logo" aria-label={`${brandName} home`}>
                <span className="footer-logo-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 100 100" fill="none">
                    <path d="M50 5S17 43 17 64a33 33 0 0 0 66 0C83 43 50 5 50 5Z" fill="currentColor" />
                    <text x="50" y="75" textAnchor="middle" fontSize="40" fontWeight="400" fontFamily="inherit" fill="white">N</text>
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

            <MobileFooterSeparator />

            <nav className="footer-col" aria-label="Footer navigation">
              <h2 className="footer-section-title">Explore      </h2>
              <ul className="footer-links">
                <li><Link href="/products">Products</Link></li>
                <li><Link href="/about">About</Link></li>
                <li><Link href="/track">Track Order</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </nav>

            <MobileFooterSeparator />

            <div className="footer-col">
              <h2 className="footer-section-title">Contact</h2>
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
                    <div>
                      <span className="contact-label">Email</span>
                      <a href={`mailto:${companyInfo.Email}`}>
                        {emailDomain ? <>{emailName}@<wbr />{emailDomain}</> : companyInfo.Email}
                      </a>
                    </div>
                  </li>
                )}
              </ul>
            </div>

            <MobileFooterSeparator />

            <div className="footer-col">
              <h2 className="footer-section-title">Locations</h2>
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

          <MobileFooterSeparator />
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

        .mobile-footer-separator { display: none; }

        .footer-grid {
          display: grid;
          grid-template-columns: minmax(240px, 1.35fr) minmax(120px, 0.65fr) minmax(200px, 0.9fr) minmax(280px, 1.3fr);
          gap: 1.5rem;
          padding-bottom: 1.5rem;
        }

        .footer-col { min-width: 0; }
        .footer-col + .footer-col { border-left: 1px solid var(--border-color); padding-left: 1.5rem; }

        .footer-section-title {
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

        @media (max-width: 768px) {
          /* ── Mobile footer v2: flat divider layout, ~35-40% less height ── */

          /* ── Outer shell ── */
          .footer {
            position: relative;
            overflow: visible;
            background: var(--surface-2);
            border-top: 1px solid var(--border-color);
          }
          .footer-container {
            width: 100% !important;
            max-width: none !important;
            padding: 35px 16px 0 !important;
          }

          /* ── Grid: single column, sections separated by dividers ── */
          .footer-grid {
            grid-template-columns: minmax(0, 1fr);
            gap: 0;
            padding-bottom: 0;
          }

          /* ── Remove card styling from every col ── */
          .footer-col,
          .footer-col + .footer-col,
          .footer-brand,
          .footer-grid > :last-child {
            grid-column: auto;
            padding: 14px 0;
            border: none;
            border-top: 1px solid var(--border-color);
            border-radius: 0;
            background: transparent;
            box-shadow: none;
            backdrop-filter: none;
          }
          /* First col (brand) — no top border */
          .footer-brand {
            padding-top: 0;
            border-top: none;
          }

          /* ── Brand / logo ── */
          :global(.footer-logo) {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            font-size: 16px;
            font-weight: 800;
            line-height: 1;
            margin-bottom: 8px;
            text-decoration: none;
            color: var(--text-primary);
          }
          .footer-logo-icon {
            width: 26px;
            height: 26px;
            flex: 0 0 26px;
            border-radius: 6px;
          }
          .brand-pitch {
            width: 100%;
            max-width: none;
            margin: 0 0 10px;
            font-size: 13px;
            line-height: 1.45;
            color: var(--text-secondary);
          }

          /* ── Cert badges ── */
          .footer-certs { display: flex; flex-wrap: wrap; gap: 5px; }
          .footer-certs span {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 3px 7px;
            border-radius: 5px;
            font-size: 10px;
            font-weight: 700;
            line-height: 1;
            flex: 0 1 auto;
            white-space: nowrap;
          }
          .footer-certs span :global(svg) { width: 10px; height: 10px; }

          /* ── Section headings ── */
          .footer-section-title {
            margin: 0 0 10px;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            line-height: 1.2;
            color: var(--text-muted);
          }

          /* ── Explore nav links ── */
          .footer-links {
            display: flex;
            flex-wrap: wrap;
            gap: 0;
            margin: 0;
            padding: 0;
            list-style: none;
          }
          .footer-links li { width: 50%; min-width: 0; }
          :global(.footer-links a) {
            display: flex;
            align-items: center;
            min-height: 40px;
            padding: 5px 0;
            font-size: 14px;
            font-weight: 500;
            line-height: 1.3;
            color: var(--text-secondary);
            text-decoration: none;
            transition: color 150ms ease;
          }
          :global(.footer-links a:hover) { color: var(--primary-color); }

          /* ── Contact list: compact horizontal rows ── */
          .contact-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin: 0;
            padding: 0;
            list-style: none;
          }
          .contact-list li {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 7px 10px;
            border: 1px solid rgba(var(--primary-rgb), 0.1);
            border-radius: 10px;
            background: rgba(var(--primary-rgb), 0.035);
            min-width: 0;
          }
          .contact-list li > div {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 6px;
            min-width: 0;
            flex: 1;
            overflow: hidden;
          }
          .contact-label {
            flex-shrink: 0;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            color: var(--text-muted);
          }
          .contact-list a {
            font-size: 13px;
            font-weight: 500;
            line-height: 1.3;
            color: var(--text-primary);
            text-decoration: none;
            overflow-wrap: anywhere;
            min-width: 0;
          }
          .contact-list a:hover { color: var(--primary-color); }

          /* ── Location list: compact rows ── */
          .locations-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin: 0;
            font-style: normal;
          }
          .location-item {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            padding: 7px 10px;
            border: 1px solid rgba(var(--primary-rgb), 0.1);
            border-radius: 10px;
            background: rgba(var(--primary-rgb), 0.035);
            min-width: 0;
          }
          .location-item > div {
            display: grid;
            gap: 1px;
            min-width: 0;
            flex: 1;
          }
          .location-item strong {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            color: var(--text-muted);
            font-style: normal;
          }
          .location-item span:last-child {
            font-size: 13px;
            line-height: 1.4;
            color: var(--text-secondary);
            overflow-wrap: anywhere;
            word-break: normal;
          }

          /* ── Icon containers: 28-30px ── */
          .footer-icon {
            width: 28px;
            height: 28px;
            flex: 0 0 28px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 7px;
            border: 1px solid rgba(var(--primary-rgb), 0.15);
            background: rgba(37, 99, 235, 0.08);
            color: var(--primary-color);
            margin-top: 0;
          }
          .footer-icon :global(svg) { width: 13px; height: 13px; }

          /* ── Footer bottom bar ── */
          .footer-bottom {
            padding: 12px 0 calc(56px + env(safe-area-inset-bottom));
            border-top: 1px solid var(--border-color);
            text-align: center;
          }
          .footer-bottom p { margin: 0; font-size: 11px; line-height: 1.4; }

          /* ── WhatsApp FAB ── */
          .whatsapp-fab {
            right: 0.75rem;
            bottom: calc(0.75rem + env(safe-area-inset-bottom));
            width: 40px;
            height: 40px;
          }
          .whatsapp-fab :global(svg) { width: 20px; height: 20px; }

          /* ── Animated dividers: replace static border-top with animated pseudo-elements ── */

          /* Remove the static border-top from non-brand cols; add position for pseudo-elements */
          .footer-col:not(.footer-brand) {
            border-top: none;
            position: relative;
          }

          /* ::before  — line that expands left→right on load */
          .footer-col:not(.footer-brand)::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 1px;
            background: var(--border-color);
            transform-origin: left center;
            transform: scaleX(0);
            animation: mFooterExpand 0.7s cubic-bezier(0.22,1,0.36,1) forwards;
            will-change: transform;
          }

          /* ::after  — shimmer sweep that repeats every 5s */
          .footer-col:not(.footer-brand)::after {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 1px;
            background: linear-gradient(
              90deg,
              transparent 0%,
              rgba(96,165,250,0.7) 50%,
              transparent 100%
            );
            transform: translateX(-150%);
            animation: mFooterShimmer 5s linear infinite;
            will-change: transform;
          }

          /* Staggered expand delays */
          .footer-grid > :nth-child(2)::before { animation-delay: 0.05s; }
          .footer-grid > :nth-child(3)::before { animation-delay: 0.22s; }
          .footer-grid > :nth-child(4)::before { animation-delay: 0.39s; }

          /* Staggered shimmer delays (start after expand finishes) */
          .footer-grid > :nth-child(2)::after  { animation-delay: 1.8s;  }
          .footer-grid > :nth-child(3)::after  { animation-delay: 2.6s;  }
          .footer-grid > :nth-child(4)::after  { animation-delay: 3.4s;  }

          /* Footer bottom bar — same animated divider */
          .footer-bottom {
            border-top: none;
            position: relative;
          }
          .footer-bottom::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 1px;
            background: var(--border-color);
            transform-origin: left center;
            transform: scaleX(0);
            animation: mFooterExpand 0.7s cubic-bezier(0.22,1,0.36,1) forwards 0.56s;
            will-change: transform;
          }
          .footer-bottom::after {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 1px;
            background: linear-gradient(
              90deg,
              transparent 0%,
              rgba(96,165,250,0.7) 50%,
              transparent 100%
            );
            transform: translateX(-150%);
            animation: mFooterShimmer 5s linear infinite 4.2s;
            will-change: transform;
          }

          /* Keyframes: line expand (scaleX 0→1) */
          @keyframes mFooterExpand {
            to { transform: scaleX(1); }
          }

          /* Keyframes: shimmer sweep (left→right, idle 80% of cycle) */
          @keyframes mFooterShimmer {
            0%   { transform: translateX(-150%); }
            20%  { transform: translateX(150%); }
            100% { transform: translateX(150%); }
          }

          /* Premium NIMRA mobile footer skin. */
          .footer {
            --m-footer-bg: #e8f2ff;
            --m-footer-primary: #173b67;
            --m-footer-secondary: #475569;
            --m-footer-detail: #334155;
            --m-footer-accent: #2563eb;
            --m-footer-accent-soft: #315f91;
            --m-footer-divider: #a9c9ee;
            --m-footer-marquee: rgba(37, 99, 235, 0.58);
            --m-footer-highlight: rgba(37, 99, 235, 0.78);
            color: var(--m-footer-detail) !important;
            background: var(--m-footer-bg) !important;
            border-top-color: var(--m-footer-divider) !important;
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
            font-family: var(--font-body);
            text-align: center;
            margin-bottom: 0;
            padding-bottom: 0;
            position: relative;
          }

          :global([data-theme="dark"]) .footer {
            --m-footer-bg: #071a3a;
            --m-footer-primary: #ffffff;
            --m-footer-secondary: #c2d0e2;
            --m-footer-detail: #dbe7f5;
            --m-footer-accent: #93c5fd;
            --m-footer-accent-soft: #b6d8ff;
            --m-footer-divider: #285b9f;
            --m-footer-marquee: rgba(147, 197, 253, 0.56);
            --m-footer-highlight: rgba(103, 232, 249, 0.68);
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
          }

          .footer,
          .footer * {
            opacity: 1 !important;
            mix-blend-mode: normal !important;
            font-family: var(--font-body) !important;
          }

          .footer-container {
            padding: 8px 12px 0 !important;
            background: transparent !important;
          }

          .footer-col,
          .footer-col + .footer-col,
          .footer-brand,
          .footer-grid > :last-child {
            padding-block: 6px;
            background: transparent !important;
          }

          .footer-brand { padding-top: 0; }

          :global(.footer-logo) {
            justify-content: center;
            color: var(--m-footer-primary) !important;
            font-family: var(--font-body);
            gap: 5px;
            margin-bottom: 5px;
            font-size: 14px;
            font-weight: 700;
            letter-spacing: 0.02em;
          }

          .footer-logo-icon {
            width: 20px;
            height: 20px;
            flex-basis: 20px;
            color: var(--m-footer-accent) !important;
            border: 0 !important;
            background: transparent !important;
            box-shadow: none;
          }

          .brand-pitch {
            margin-inline: auto;
            margin-bottom: 5px;
            color: var(--m-footer-secondary) !important;
            font-size: 10.5px;
            font-weight: 400;
            line-height: 1.35;
          }

          .footer-section-title {
            margin-bottom: 4px;
            color: var(--m-footer-primary) !important;
            font-family: var(--font-body);
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.1em;
          }

          .footer-certs { justify-content: center; gap: 4px; }
          .footer-certs span {
            gap: 3px;
            padding: 1px 4px 1px 0;
            color: var(--m-footer-detail) !important;
            border: 0 !important;
            border-radius: 0;
            background: transparent !important;
            box-shadow: none;
            font-size: 8.5px;
            font-weight: 500;
          }

          .footer-certs span :global(svg) { width: 9px; height: 9px; }

          :global(.footer-links a) {
            justify-content: center;
            min-height: 24px;
            padding-block: 1px;
            color: var(--m-footer-primary) !important;
            font-size: 11px;
            font-weight: 400;
            line-height: 1.3;
          }

          :global(.footer-links a:hover),
          :global(.footer-links a:focus-visible) {
            color: var(--m-footer-accent) !important;
          }

          .contact-list li,
          .location-item {
            justify-content: center;
            gap: 5px;
            width: fit-content;
            max-width: 100%;
            margin-inline: auto;
            padding: 1px 3px;
            border: 0 !important;
            border-radius: 0;
            background: transparent !important;
            box-shadow: none;
            -webkit-backdrop-filter: none;
            backdrop-filter: none;
          }

          .location-item {
            gap: 4px;
            align-items: flex-start;
          }

          .location-item .footer-icon {
            margin-right: 0;
          }

          .contact-list,
          .locations-list { gap: 4px; }

          .contact-list {
            display: grid;
            grid-template-columns: minmax(125px, 0.78fr) minmax(0, 1.22fr);
            align-items: center;
            width: 100%;
            max-width: 620px;
            margin-inline: auto;
          }

          .contact-list li {
            width: 100%;
            margin: 0;
            min-width: 0;
          }

          .contact-list li > div,
          .location-item > div {
            width: fit-content;
            max-width: calc(100% - 30px);
            justify-content: center;
            justify-items: center;
            text-align: center;
          }

          .contact-list li > div {
            display: flex;
            flex: 1 1 auto;
            align-items: baseline;
            justify-content: flex-start;
            gap: 4px;
            min-width: 0;
            overflow: visible;
            text-align: left;
          }

          .location-item > div {
            flex: 0 1 auto;
          }

          .contact-label,
          .location-item strong {
            color: var(--m-footer-accent-soft) !important;
            font-size: 8px;
            font-weight: 500;
            letter-spacing: 0.07em;
          }

          .contact-list a {
            color: var(--m-footer-primary) !important;
            font-size: 11px;
            font-weight: 400;
            line-height: 1.3;
            min-width: 0;
            overflow-wrap: normal;
            word-break: normal;
          }

          .contact-list li:first-child a { white-space: nowrap; }

          .contact-list li:last-child a {
            font-size: 9.5px;
            white-space: nowrap;
          }

          .contact-list li:last-child {
            padding-left: 8px;
          }

          .contact-list a:hover { color: var(--m-footer-accent) !important; }

          .location-item span:last-child {
            color: var(--m-footer-secondary) !important;
            font-size: 10px;
            font-weight: 400;
            line-height: 1.35;
            max-width: min(300px, 100%);
            white-space: normal;
            overflow-wrap: break-word;
            word-break: normal;
            text-align: center;
          }

          .locations-list {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            align-items: stretch;
            max-width: 680px;
            margin-inline: auto;
          }

          .location-item {
            display: grid;
            grid-template-columns: 18px minmax(0, max-content);
            grid-template-rows: auto auto;
            justify-content: center;
            align-content: start;
            column-gap: 4px;
            row-gap: 2px;
            width: 100%;
            height: 100%;
            margin: 0;
            padding-inline: 5px;
          }

          .location-item > div { display: contents; }

          .location-item strong {
            grid-column: 1 / -1;
            grid-row: 1;
            text-align: center;
          }

          .location-item .footer-icon {
            grid-column: 1;
            grid-row: 2;
            align-self: start;
          }

          .location-item span:last-child {
            grid-column: 2;
            grid-row: 2;
            align-self: start;
          }

          .footer-icon {
            width: 18px;
            height: 18px;
            flex-basis: 18px;
            color: var(--m-footer-accent) !important;
            border: 0 !important;
            border-radius: 0;
            background: transparent !important;
          }

          .footer-icon :global(svg) { width: 11px; height: 11px; }

          .footer-col:not(.footer-brand)::before,
          .footer-bottom::before {
            display: none;
          }

          .footer-col:not(.footer-brand)::after,
          .footer-bottom::after { display: none; }

          .footer-bottom {
            padding: 6px 56px calc(var(--mobile-nav-height) + env(safe-area-inset-bottom) + 18px);
            color: var(--m-footer-secondary) !important;
          }

          .footer-bottom p { font-size: 9.5px; font-weight: 400; line-height: 1.3; }

          .footer-bottom strong { color: var(--m-footer-primary) !important; font-weight: 500; }

          .mobile-footer-separator {
            display: block;
            width: 100%;
            overflow: hidden;
            padding: 2px 0;
            color: var(--m-footer-marquee);
            border-block: 1px solid color-mix(in srgb, var(--m-footer-divider) 56%, transparent);
            outline: none;
            contain: inline-size;
          }

          .mobile-footer-marquee {
            display: flex;
            width: max-content;
            animation: mobileFooterMarquee 24s linear infinite;
            will-change: transform;
          }

          .mobile-footer-marquee-group {
            display: flex;
            flex: 0 0 auto;
            align-items: center;
            gap: 1.35rem;
            padding-right: 1.35rem;
          }

          .mobile-footer-marquee-group > span {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            color: currentColor;
            font-size: 8px;
            font-weight: 500;
            letter-spacing: 0.08em;
            line-height: 1.4;
            text-transform: uppercase;
            white-space: nowrap;
          }

          .mobile-footer-marquee-group :global(svg) {
            width: 8px;
            height: 8px;
            fill: currentColor;
          }

          .mobile-footer-separator:hover .mobile-footer-marquee,
          .mobile-footer-separator:focus-within .mobile-footer-marquee,
          .mobile-footer-separator:active .mobile-footer-marquee {
            animation-play-state: paused;
          }

          @keyframes mobileFooterMarquee {
            to { transform: translateX(-50%); }
          }

          .whatsapp-fab {
            right: 14px;
            bottom: calc(var(--mobile-nav-clearance) + 12px);
            width: 42px;
            height: 42px;
            border: 1px solid rgba(255, 255, 255, 0.28);
            box-shadow: 0 9px 24px rgba(2, 6, 23, 0.3), 0 0 0 3px rgba(22, 163, 74, 0.12);
          }
        }

        @media (max-width: 480px) {
          .footer-container { padding: 8px 10px 0 !important; }
          .footer-links li { width: 50%; }
        }

        /* Disable animations for users who prefer reduced motion */
        @media (max-width: 768px) and (prefers-reduced-motion: reduce) {
          .mobile-footer-marquee {
            animation: none;
            transform: none;
          }

          .mobile-footer-marquee-group:nth-child(2) {
            display: none;
          }

          .footer-col:not(.footer-brand)::before,
          .footer-col:not(.footer-brand)::after,
          .footer-bottom::before,
          .footer-bottom::after {
            animation: none;
            transform: none;
          }
          /* Restore visible static borders */
          .footer-col:not(.footer-brand)::before,
          .footer-bottom::before {
            transform: scaleX(1);
          }
        }
      `}</style>
      <style jsx global>{`
        .mobile-footer-separator {
          display: none;
        }

        @media (max-width: 768px) {
          body {
            padding-bottom: var(--mobile-nav-clearance) !important;
          }

          .footer .mobile-footer-separator {
            display: block;
            position: relative;
            width: 100%;
            max-width: 100%;
            height: 1px;
            overflow: hidden;
            margin: 0;
            padding: 0;
            border: 0;
            background: linear-gradient(90deg, transparent, var(--m-footer-divider) 12%, var(--m-footer-divider) 88%, transparent);
            contain: inline-size;
          }

          .footer .mobile-footer-separator::after {
            content: '';
            position: absolute;
            inset: 0 auto 0 0;
            width: 32%;
            background: linear-gradient(90deg, transparent, var(--m-footer-highlight), transparent);
            transform: translateX(-140%);
            animation: mobileFooterLineSweep 7s ease-in-out infinite;
            will-change: transform;
          }

          .footer .mobile-footer-separator:hover::after,
          .footer .mobile-footer-separator:active::after {
            animation-play-state: paused;
          }

          .back-to-top-btn {
            display: flex !important;
            position: fixed !important;
            top: calc(3.4375rem + 8px) !important;
            right: auto !important;
            bottom: auto !important;
            left: 50% !important;
            width: 42px !important;
            height: 42px !important;
            z-index: 9999 !important;
          }

        }

        @keyframes mobileFooterLineSweep {
          0%, 18% { transform: translateX(-140%); }
          72%, 100% { transform: translateX(420%); }
        }

        @media (max-width: 768px) and (prefers-reduced-motion: reduce) {
          .footer .mobile-footer-separator::after {
            animation: none;
            display: none;
          }
        }
      `}</style>
    </>
  );
});
