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
          <div className="support-icon" aria-hidden="true">💬</div>
          <h3>Still have questions?</h3>
          <p>Our dedicated support team is available 24/7 to assist you.</p>
          <Link href="/contact" className="support-link">Contact Support →</Link>
        </div>
      </aside>

      <style jsx>{`
        .shared-faq-section {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 240px;
          gap: 1.5rem;
          align-items: flex-start;
        }
        .faq-content {
          display: flex;
          min-width: 0;
          flex-direction: column;
        }
        h2 {
          margin: 0 0 12px;
          color: var(--text-primary, #0f172a);
          font-size: 1.05rem;
          font-weight: 700;
          letter-spacing: -0.02em;
        }
        .faq-intro {
          margin: 0 0 1rem;
          color: var(--text-secondary, #334155);
          font-size: 0.85rem;
          line-height: 1.4;
        }
        .faq-container {
          margin-top: 0;
        }
        .faq-empty {
          margin: 1rem 0;
          color: var(--text-muted, #64748b);
          text-align: center;
        }
        .faq-visual {
          width: 240px;
          display: flex;
          align-items: center;
        }
        .support-card {
          width: 100%;
          aspect-ratio: 1;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          text-align: center;
          background: linear-gradient(135deg, #e0f2fe 0%, var(--bg-primary, #fff) 100%);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 16px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.04);
        }
        .support-icon {
          margin-bottom: 0.5rem;
          font-size: 2.5rem;
        }
        .support-card h3 {
          margin: 0;
          color: #0284c7;
          font-size: 0.95rem;
          font-weight: 700;
        }
        .support-card p {
          margin: 0 0 0.5rem;
          color: var(--text-muted, #64748b);
          font-size: 0.75rem;
          line-height: 1.4;
        }
        .support-link {
          padding: 6px 16px;
          color: #0284c7;
          background: var(--bg-primary, #fff);
          border-radius: 999px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          font-size: 0.75rem;
          font-weight: 600;
          text-decoration: none;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .support-link:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
        }
        @media (max-width: 768px) {
          .shared-faq-section {
            grid-template-columns: 1fr;
          }
          .faq-visual {
            width: 100%;
            max-width: 400px;
            margin: 0 auto;
          }
        }
      `}</style>
    </div>
  );
}
