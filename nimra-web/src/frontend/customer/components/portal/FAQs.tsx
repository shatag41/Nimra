'use client';

import React, { useState } from 'react';
import { FAQ } from '@/types/cms';

interface FAQsProps {
  faqs: FAQ[];
  variant?: 'default' | 'compact';
  limit?: number;
}

export function FAQs({ faqs, variant = 'default', limit }: FAQsProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const visibleFaqs = typeof limit === 'number' ? faqs.slice(0, limit) : faqs;

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className={`faq-accordion-box ${variant === 'compact' ? 'compact' : ''}`}>
      {visibleFaqs.map((faq, idx) => (
        <div
          key={faq.ID}
          className={`faq-item ${idx === activeFaq ? 'active' : ''}`}
        >
          <button
            type="button"
            className="faq-question"
            aria-expanded={idx === activeFaq}
            aria-controls={`faq-answer-${faq.ID}`}
            onClick={() => toggleFaq(idx)}
          >
            <div className="faq-q-inner">
              <span className="faq-num">{String(idx + 1).padStart(2, '0')}</span>
              <h3>{faq.Question}</h3>
            </div>
            <span className="faq-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6"/></svg>
            </span>
          </button>
          <div id={`faq-answer-${faq.ID}`} className="faq-answer">
            <p>{faq.Answer}</p>
          </div>
        </div>
      ))}
      <style jsx>{`
        .faq-accordion-box {
          max-width: 820px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .faq-item {
          border-radius: var(--radius-lg);
          background: var(--bg-primary);
          border: 1.5px solid var(--border-color);
          overflow: hidden;
          transition: border-color var(--transition-normal), box-shadow var(--transition-normal);
        }
        .faq-item:hover { border-color: var(--primary-color); box-shadow: var(--shadow-md); }
        .faq-item.active {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(0,150,58,0.1);
        }

        .faq-question {
          width: 100%;
          padding: 1rem 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          user-select: none;
          border: 0;
          background: transparent;
          color: var(--text-primary);
          font: inherit;
          cursor: pointer;
        }

        .faq-q-inner {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .faq-num {
          font-size: 0.72rem;
          font-weight: 800;
          color: var(--primary-color);
          background: rgba(0,150,58,0.1);
          border: 1px solid rgba(0,150,58,0.2);
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          letter-spacing: 0;
        }

        .faq-question h3 {
          font-size: 1rem;
          font-weight: 600;
          line-height: 1.4;
          margin: 0;
        }

        .faq-icon {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform var(--transition-normal), background var(--transition-fast), border-color var(--transition-fast);
          color: var(--text-secondary);
        }
        .faq-item.active .faq-icon {
          transform: rotate(180deg);
          background: var(--primary-color);
          border-color: var(--primary-color);
          color: white;
        }

        .faq-answer {
          max-height: 0;
          overflow: hidden;
          transition: max-height var(--transition-normal) ease-out, padding var(--transition-normal);
        }
        .faq-item.active .faq-answer {
          max-height: 240px;
          border-top: 1px solid var(--border-color);
          padding: 1rem 1.25rem 1rem calc(1.25rem + 32px + 1rem);
        }
        .faq-answer p { font-size: 0.95rem; line-height: 1.65; color: var(--text-secondary); margin: 0; }

        .faq-accordion-box.compact { gap: 0.35rem; max-width: none; }
        .compact .faq-item { border-width: 1px; border-radius: var(--radius-md); box-shadow: none; }
        .compact .faq-item:hover { box-shadow: none; }
        .compact .faq-item.active { box-shadow: 0 0 0 2px rgba(0,150,58,0.08); }
        .compact .faq-question { padding: 0.5rem 0.55rem; gap: 0.45rem; }
        .compact .faq-q-inner { gap: 0.5rem; }
        .compact .faq-num { width: 21px; height: 21px; border-radius: 5px; font-size: 0.56rem; }
        .compact .faq-question h3 { font-size: 0.72rem; line-height: 1.3; }
        .compact .faq-icon { width: 22px; height: 22px; border-radius: 5px; }
        .compact .faq-icon svg { width: 12px; height: 12px; }
        .compact .faq-item.active .faq-answer {
          max-height: 200px;
          padding: 0.5rem 0.55rem 0.55rem calc(0.55rem + 21px + 0.5rem);
        }
        .compact .faq-answer p { font-size: 0.7rem; line-height: 1.45; }

        @media (max-width: 480px) {
          .faq-question { padding: 0.9rem; }
          .faq-item.active .faq-answer { padding: 0.9rem; }
          .compact .faq-question { padding: 0.5rem; }
          .compact .faq-item.active .faq-answer { padding: 0.5rem; }
        }
      `}</style>
    </div>
  );
}
export default FAQs;
