'use client';

import React from 'react';

interface ProductsSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default React.memo(function ProductsSearchBar({ value, onChange }: ProductsSearchBarProps) {
  return (
    <div className="search-bar-wrapper card">
      <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="search"
        placeholder="Search products by name, category or size..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="search-input"
        autoComplete="off"
      />
      {value && (
        <button type="button" className="search-clear-btn" onClick={() => onChange('')} aria-label="Clear product search">
          &times;
        </button>
      )}
    </div>
  );
});
