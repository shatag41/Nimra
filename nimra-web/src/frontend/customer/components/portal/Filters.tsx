'use client';

import React from 'react';

interface FiltersProps {
  volumes: string[];
  selectedVolume: string;
  onSelectVolume: (vol: string) => void;
  selectedCategory: string;
  categories: Array<{ id: string; name: string }>;
  onSelectCategory: (catId: string) => void;
  onReset: () => void;
}

export function Filters({
  volumes,
  selectedVolume,
  onSelectVolume,
  selectedCategory,
  categories,
  onSelectCategory,
  onReset,
}: FiltersProps) {
  return (
    <div className="filters-card glass">
      <div className="filter-group">
        <h4>Category</h4>
        <div className="filter-options">
          {categories.map((c) => (
            <button
              key={c.id}
              className={`filter-btn ${selectedCategory === c.id ? 'active' : ''}`}
              onClick={() => onSelectCategory(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <h4>Volume / Size</h4>
        <div className="filter-options">
          <button
            className={`filter-btn ${selectedVolume === 'All' ? 'active' : ''}`}
            onClick={() => onSelectVolume('All')}
          >
            All Sizes
          </button>
          {volumes.map((vol) => (
            <button
              key={vol}
              className={`filter-btn ${selectedVolume === vol ? 'active' : ''}`}
              onClick={() => onSelectVolume(vol)}
            >
              {vol}
            </button>
          ))}
        </div>
      </div>

      <button className="reset-btn" onClick={onReset}>
        Reset Filters
      </button>

      <style jsx>{`
        .filters-card {
          padding: 1.5rem;
          border-radius: var(--radius-xl);
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .filter-group h4 {
          font-size: 0.9rem;
          margin-bottom: 0.75rem;
          color: var(--text-primary);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .filter-options {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .filter-btn {
          padding: 0.45rem 0.9rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          background: var(--bg-primary);
          color: var(--text-secondary);
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .filter-btn:hover {
          border-color: var(--primary-color);
          color: var(--primary-color);
        }
        .filter-btn.active {
          background: var(--primary-color);
          border-color: var(--primary-color);
          color: white;
        }
        .reset-btn {
          margin-top: 0.5rem;
          padding: 0.6rem;
          border: 1.5px dashed var(--border-color);
          border-radius: var(--radius-md);
          background: transparent;
          color: var(--text-muted);
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .reset-btn:hover {
          border-color: #dc2626;
          color: #dc2626;
          background: rgba(220, 38, 38, 0.02);
        }
      `}</style>
    </div>
  );
}
