'use client';

import React from 'react';
import { Product } from '@/types/cms';

interface ProductsSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  products: Product[];
}

export default React.memo(function ProductsSearchBar({ value, onChange, products }: ProductsSearchBarProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const normalizedQuery = value.trim().toLowerCase();
  const suggestions = React.useMemo(() => {
    if (!normalizedQuery) return [];
    return products.filter((product) => (
      product.Name.toLowerCase().includes(normalizedQuery) ||
      product.Category.toLowerCase().includes(normalizedQuery) ||
      product.Volume.toLowerCase().includes(normalizedQuery)
    )).slice(0, 6);
  }, [normalizedQuery, products]);
  const showSuggestions = isOpen && suggestions.length > 0;

  const selectSuggestion = (product: Product) => {
    onChange(product.Name);
    setIsOpen(false);
    setActiveIndex(-1);
  };

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
        onChange={(event) => {
          onChange(event.target.value);
          setIsOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onKeyDown={(event) => {
          if (!showSuggestions && event.key !== 'Escape') return;
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1));
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
          } else if (event.key === 'Enter' && activeIndex >= 0) {
            event.preventDefault();
            selectSuggestion(suggestions[activeIndex]);
          } else if (event.key === 'Escape') {
            setIsOpen(false);
            setActiveIndex(-1);
          }
        }}
        className="search-input"
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showSuggestions}
        aria-controls="product-search-suggestions"
        aria-activedescendant={activeIndex >= 0 ? `product-search-option-${activeIndex}` : undefined}
      />
      {value && (
        <button type="button" className="search-clear-btn" onClick={() => onChange('')} aria-label="Clear product search">
          &times;
        </button>
      )}
      {showSuggestions && (
        <ul id="product-search-suggestions" className="search-suggestions" role="listbox">
          {suggestions.map((product, index) => (
            <li
              id={`product-search-option-${index}`}
              key={String(product.ID)}
              role="option"
              aria-selected={index === activeIndex}
            >
              <button
                type="button"
                className={index === activeIndex ? 'active' : ''}
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectSuggestion(product);
                }}
              >
                <span>{product.Name}</span>
                <small>{product.Category} · {product.Volume}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
      <style jsx>{`
        .search-bar-wrapper {
          overflow: visible;
          z-index: 80;
        }

        .search-suggestions {
          position: absolute;
          top: calc(100% + 0.35rem);
          right: 0;
          left: 0;
          z-index: 120;
          max-height: min(19rem, 55vh);
          margin: 0;
          padding: 0.3rem;
          overflow-y: auto;
          list-style: none;
          border: 1px solid var(--border-color);
          border-radius: 0.75rem;
          background: var(--bg-primary);
          box-shadow: 0 12px 28px rgba(30, 64, 175, 0.16);
        }

        .search-suggestions li { margin: 0; }
        .search-suggestions li + li {
          border-top: 1px solid color-mix(in srgb, var(--border-color) 72%, transparent);
        }

        .search-suggestions button {
          width: 100%;
          min-height: 2.75rem;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          flex-direction: column;
          gap: 0.12rem;
          padding: 0.45rem 0.65rem;
          border: 0;
          border-radius: 0.55rem;
          background: transparent;
          color: var(--text-primary);
          font: inherit;
          text-align: left;
          cursor: pointer;
          transition: background-color 180ms ease, color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
        }

        .search-suggestions button:focus-visible,
        .search-suggestions button:active,
        .search-suggestions button.active {
          background: rgba(var(--primary-rgb), 0.12);
          box-shadow: inset 3px 0 0 var(--primary-color), 0 3px 10px rgba(var(--primary-rgb), 0.08);
          transform: translateX(2px);
          outline: none;
        }

        .search-suggestions button:focus-visible span,
        .search-suggestions button:active span,
        .search-suggestions button.active span {
          color: var(--primary-color);
        }

        @media (hover: hover) and (pointer: fine) {
          .search-suggestions button:hover {
            background: rgba(var(--primary-rgb), 0.12);
            box-shadow: inset 3px 0 0 var(--primary-color), 0 3px 10px rgba(var(--primary-rgb), 0.08);
            transform: translateX(2px);
          }

          .search-suggestions button:hover span {
            color: var(--primary-color);
          }
        }

        .search-suggestions span {
          font-size: 0.78rem;
          font-weight: 500;
          line-height: 1.25;
        }

        .search-suggestions small {
          color: var(--text-muted);
          font-size: 0.66rem;
          font-weight: 400;
          line-height: 1.25;
        }
      `}</style>
    </div>
  );
});
