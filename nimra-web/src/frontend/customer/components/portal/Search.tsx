'use client';

import React from 'react';

interface SearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function Search({ value, onChange, placeholder = 'Search products...' }: SearchProps) {
  return (
    <div className="search-wrapper">
      <span className="search-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
      </span>
      <input
        type="text"
        className="search-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search"
      />
      {value && (
        <button className="clear-btn" onClick={() => onChange('')} aria-label="Clear search">
          ✕
        </button>
      )}
      <style jsx>{`
        .search-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
          max-width: 480px;
          margin: 0 auto 2rem;
        }
        .search-icon {
          position: absolute;
          left: 1rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          pointer-events: none;
        }
        .search-input {
          width: 100%;
          padding: 0.85rem 1rem 0.85rem 2.75rem;
          border: 1.5px solid var(--border-color);
          border-radius: var(--radius-xl);
          background: var(--bg-primary);
          color: var(--text-primary);
          font: inherit;
          font-size: 0.95rem;
          transition: all var(--transition-normal);
        }
        .search-input:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.08);
          transform: translateY(-1px);
        }
        .clear-btn {
          position: absolute;
          right: 1rem;
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 0.9rem;
          transition: color var(--transition-fast);
        }
        .clear-btn:hover {
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
}
