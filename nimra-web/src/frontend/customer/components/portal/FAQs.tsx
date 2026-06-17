'use client';

import React, { useState } from 'react';
import { FAQ } from '@/types/cms';

interface FAQsProps {
  faqs: FAQ[];
}

export function FAQs({ faqs }: FAQsProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="faq-accordion-box">
      {faqs.map((faq, idx) => (
        <div
          key={faq.ID}
          className={`faq-item ${idx === activeFaq ? 'active' : ''}`}
          onClick={() => toggleFaq(idx)}
        >
          <div className="faq-question">
            <div className="faq-q-inner">
              <span className="faq-num">{String(idx + 1).padStart(2, '0')}</span>
              <h3>{faq.Question}</h3>
            </div>
            <span className="faq-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6"/></svg>
            </span>
          </div>
          <div className="faq-answer">
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
          gap: 0.875rem;
        }

        .faq-item {
          border-radius: var(--radius-lg);
          background: var(--bg-primary);
          border: 1.5px solid var(--border-color);
          overflow: hidden;
          cursor: pointer;
          transition: border-color var(--transition-normal), box-shadow var(--transition-normal);
        }
        .faq-item:hover { border-color: var(--primary-color); box-shadow: var(--shadow-md); }
        .faq-item.active {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(0,150,58,0.1);
        }

        .faq-question {
          padding: 1.25rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          user-select: none;
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
          padding: 1.25rem 1.5rem 1.25rem calc(1.5rem + 32px + 1rem);
        }
        .faq-answer p { font-size: 0.95rem; line-height: 1.65; color: var(--text-secondary); margin: 0; }
      `}</style>
    </div>
  );
}
export default FAQs;
