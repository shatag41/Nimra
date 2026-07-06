'use client';

import Link from 'next/link';
import { FAQ } from '@/types/cms';
import { FAQs } from './portal/FAQs';

interface FAQSectionProps {
  faqs: FAQ[];
}

export default function FAQSection({ faqs }: FAQSectionProps) {
  const activeFaqs = (faqs || []).filter(
    (faq) => faq.Active !== false && String(faq.Active).toLowerCase() !== 'false'
  );

  return (
    <div className="shared-faq-section">
      <div className="faq-content">
        <span className="faq-eyebrow">Help Center</span>
        <h2>Common Questions</h2>
        <p className="faq-intro">
          Everything you need to know about our premium water, quality standards, and delivery services.
        </p>
        <div className="faq-container">
          {activeFaqs.length > 0 ? (
            <FAQs faqs={activeFaqs} variant="compact" />
          ) : (
            <p className="faq-empty">No FAQs are available right now.</p>
          )}
        </div>
      </div>

      <aside className="faq-visual">
        <div className="support-card">
          <div className="support-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
              <path d="M8 9h8M8 13h5" />
            </svg>
          </div>
          <h3>Still have questions?</h3>
          <p>Our dedicated support team is available 24/7 to assist you.</p>
          <Link href="/contact" className="support-link">
            Contact Support
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </aside>

      <style jsx>{`
        .shared-faq-section {
          position: relative;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 260px;
          gap: clamp(1.5rem, 3vw, 2.75rem);
          align-items: flex-start;
        }
        .faq-content {
          display: flex;
          min-width: 0;
          flex-direction: column;
        }
        .faq-eyebrow {
          width: fit-content;
          margin-bottom: 0.45rem;
          padding: 0.28rem 0.72rem;
          color: var(--primary-color, #2563eb);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 999px;
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(14, 165, 233, 0.05));
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 0 14px rgba(37, 99, 235, 0.08);
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          line-height: 1;
          text-transform: uppercase;
          backdrop-filter: blur(10px);
        }
        h2 {
          margin: 0 0 0.45rem;
          color: var(--text-primary, #0f172a);
          font-size: clamp(1.35rem, 1.1rem + 0.8vw, 1.8rem);
          font-weight: 850;
          letter-spacing: -0.035em;
          line-height: 1.08;
        }
        .faq-intro {
          max-width: 42rem;
          margin: 0 0 1.15rem;
          color: var(--text-muted, #64748b);
          font-size: 0.85rem;
          line-height: 1.5;
        }
        .faq-container { margin-top: 0; }
        .faq-empty {
          margin: 1rem 0;
          color: var(--text-muted, #64748b);
          text-align: center;
        }
        .faq-visual {
          width: 260px;
          display: flex;
          align-items: center;
          padding-top: 1.8rem;
        }
        .support-card {
          position: relative;
          overflow: hidden;
          width: 100%;
          aspect-ratio: 1;
          padding: 1.65rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.55rem;
          text-align: center;
          background:
            radial-gradient(circle at 50% 18%, rgba(96, 165, 250, 0.18), transparent 34%),
            linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(37, 99, 235, 0.055)),
            var(--bg-primary, #fff);
          border: 1px solid rgba(96, 165, 250, 0.28);
          border-radius: 18px;
          box-shadow: 0 16px 38px rgba(2, 8, 23, 0.13), inset 0 1px 0 rgba(255, 255, 255, 0.13);
          backdrop-filter: blur(14px);
          transition: transform 300ms ease, border-color 300ms ease, box-shadow 300ms ease;
        }
        .support-card:hover {
          transform: translateY(-5px);
          border-color: rgba(59, 130, 246, 0.58);
          box-shadow: 0 20px 42px rgba(2, 8, 23, 0.18), 0 0 24px rgba(37, 99, 235, 0.11), inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }
        .support-icon {
          width: 52px;
          height: 52px;
          margin-bottom: 0.4rem;
          display: grid;
          place-items: center;
          color: #60a5fa;
          border: 1px solid rgba(96, 165, 250, 0.32);
          border-radius: 16px;
          background: linear-gradient(145deg, rgba(37, 99, 235, 0.2), rgba(14, 165, 233, 0.08));
          box-shadow: 0 8px 20px rgba(37, 99, 235, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.13);
        }
        .support-card h3 {
          margin: 0;
          color: var(--text-primary, #0f172a);
          font-size: 1rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .support-card p {
          margin: 0 0 0.45rem;
          color: var(--text-muted, #64748b);
          font-size: 0.75rem;
          line-height: 1.45;
        }
        .support-link {
          padding: 0.48rem 0.85rem;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          color: #60a5fa;
          background: rgba(37, 99, 235, 0.08);
          border: 1px solid rgba(96, 165, 250, 0.28);
          border-radius: 999px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
          font-size: 0.75rem;
          font-weight: 700;
          text-decoration: none;
          transition: transform 300ms ease, box-shadow 300ms ease, background 300ms ease;
        }
        .support-link svg { transition: transform 300ms ease; }
        .support-link:hover {
          transform: translateY(-2px);
          background: rgba(37, 99, 235, 0.14);
          box-shadow: 0 8px 22px rgba(37, 99, 235, 0.15);
        }
        .support-link:hover svg { transform: translateX(3px); }
        @media (max-width: 768px) {
          .shared-faq-section { grid-template-columns: 1fr; }
          .faq-visual {
            width: 100%;
            max-width: 400px;
            margin: 0 auto;
            padding-top: 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .support-card, .support-link, .support-link svg { transition-duration: 0.001ms; }
        }
      `}</style>
    </div>
  );
}
