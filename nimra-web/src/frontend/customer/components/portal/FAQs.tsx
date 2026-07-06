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
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.07), rgba(37, 99, 235, 0.025)), var(--bg-primary);
          border: 1px solid rgba(96, 165, 250, 0.2);
          overflow: hidden;
          box-shadow: 0 5px 16px rgba(2, 8, 23, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.06);
          transition: transform 300ms ease, border-color 300ms ease, box-shadow 300ms ease, background 300ms ease;
        }
        .faq-item:hover {
          transform: translateY(-2px);
          border-color: rgba(59, 130, 246, 0.48);
          background: linear-gradient(145deg, rgba(59, 130, 246, 0.09), rgba(14, 165, 233, 0.025)), var(--bg-primary);
          box-shadow: 0 9px 22px rgba(2, 8, 23, 0.1), 0 0 16px rgba(37, 99, 235, 0.07);
        }
        .faq-item.active {
          border-color: rgba(59, 130, 246, 0.66);
          background: linear-gradient(145deg, rgba(37, 99, 235, 0.1), rgba(14, 165, 233, 0.035)), var(--bg-primary);
          box-shadow: 0 10px 26px rgba(2, 8, 23, 0.11), 0 0 20px rgba(37, 99, 235, 0.09);
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
        .faq-question:focus-visible {
          outline: 2px solid rgba(59, 130, 246, 0.75);
          outline-offset: -3px;
          border-radius: inherit;
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
          background: linear-gradient(145deg, rgba(37, 99, 235, 0.18), rgba(14, 165, 233, 0.08));
          border: 1px solid rgba(96, 165, 250, 0.24);
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
          border: 1px solid transparent;
          background: rgba(37, 99, 235, 0.04);
        }
        .faq-item.active .faq-icon {
          transform: rotate(180deg);
          color: var(--primary-color);
          border-color: rgba(96, 165, 250, 0.24);
          background: rgba(37, 99, 235, 0.1);
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

        .faq-accordion-box.compact { gap: 0.55rem; max-width: none; }
        .compact .faq-item { border-width: 1px; border-radius: 12px; }
        .compact .faq-question { padding: 0.72rem 0.8rem; gap: 0.6rem; }
        .compact .faq-q-inner { gap: 0.65rem; }
        .compact .faq-num { width: 25px; height: 25px; border-radius: 7px; font-size: 0.58rem; }
        .compact .faq-question h3 { font-size: 0.8rem; line-height: 1.35; letter-spacing: -0.01em; }
        .compact .faq-icon { width: 25px; height: 25px; border-radius: 7px; }
        .compact .faq-icon svg { width: 13px; height: 13px; }
        .compact .faq-item.active .faq-answer {
          grid-template-rows: 1fr;
        }
        .compact .faq-answer-inner p { 
          padding: 0 0.8rem 0.78rem calc(0.8rem + 25px + 0.65rem);
          font-size: 0.74rem;
          line-height: 1.55;
          color: var(--text-muted);
        }

        @media (max-width: 480px) {
          .faq-question { padding: 0.75rem; }
          .faq-answer-inner p { padding: 0 0.75rem 0.75rem; }
          .compact .faq-question { padding: 0.5rem; }
          .compact .faq-answer-inner p { padding: 0 0.5rem 0.5rem; }
        }

        @media (prefers-reduced-motion: reduce) {
          .faq-item,
          .faq-icon,
          .faq-answer {
            transition-duration: 0.001ms !important;
          }
        }
      `}</style>
    </div>
  );
}
export default FAQs;
