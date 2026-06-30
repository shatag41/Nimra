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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </span>
          </button>
          <div id={`faq-answer-${faq.ID}`} className="faq-answer">
            <div className="faq-answer-inner">
              <p>{faq.Answer}</p>
            </div>
          </div>
        </div>
      ))}
      <style jsx>{`
        .faq-accordion-box {
          max-width: 820px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .faq-item {
          border-radius: var(--radius-lg);
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          overflow: hidden;
          transition: all 0.25s ease;
        }
        .faq-item:hover {
          border-color: rgba(0, 150, 58, 0.4);
          background: rgba(0, 150, 58, 0.01);
        }
        .faq-item.active {
          border-color: var(--primary-color);
          background: rgba(0, 150, 58, 0.02);
        }

        .faq-question {
          width: 100%;
          padding: 0.85rem 1rem;
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
          gap: 0.75rem;
        }

        .faq-num {
          font-size: 0.65rem;
          font-weight: 700;
          color: var(--primary-color);
          background: rgba(0, 150, 58, 0.1);
          width: 26px;
          height: 26px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .faq-question h3 {
          font-size: 0.9rem;
          font-weight: 600;
          line-height: 1.4;
          margin: 0;
          text-align: left;
          transition: color 0.25s ease, font-weight 0.25s ease;
        }
        .faq-item.active .faq-question h3 {
          color: var(--primary-color);
          font-weight: 700;
        }

        .faq-icon {
          width: 26px;
          height: 26px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), color 0.3s;
          color: var(--text-muted);
        }
        .faq-item.active .faq-icon {
          transform: rotate(180deg);
          color: var(--primary-color);
        }

        .faq-answer {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .faq-item.active .faq-answer {
          grid-template-rows: 1fr;
        }
        .faq-answer-inner {
          overflow: hidden;
        }
        .faq-answer-inner p { 
          font-size: 0.85rem; 
          line-height: 1.5; 
          color: var(--text-secondary); 
          margin: 0; 
          padding: 0 1rem 0.85rem calc(1rem + 26px + 0.75rem);
        }

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
          grid-template-rows: 1fr;
        }
        .compact .faq-answer-inner p { 
          padding: 0 0.55rem 0.55rem calc(0.55rem + 21px + 0.5rem);
          font-size: 0.7rem; 
          line-height: 1.45; 
        }

        @media (max-width: 480px) {
          .faq-question { padding: 0.75rem; }
          .faq-answer-inner p { padding: 0 0.75rem 0.75rem; }
          .compact .faq-question { padding: 0.5rem; }
          .compact .faq-answer-inner p { padding: 0 0.5rem 0.5rem; }
        }
      `}</style>
    </div>
  );
}
export default FAQs;
