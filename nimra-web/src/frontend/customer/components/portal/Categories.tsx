'use client';

import React from 'react';

export interface CategoryItem {
  id: string;
  name: string;
}

interface CategoriesProps {
  categories: CategoryItem[];
  activeTab: string;
  onSelectTab: (id: string) => void;
}

export function Categories({ categories, activeTab, onSelectTab }: CategoriesProps) {
  return (
    <div className="catalog-tabs">
      {categories.map((category) => (
        <button
          key={category.id}
          className={`tab-btn ${activeTab === category.id ? 'active' : ''}`}
          onClick={() => onSelectTab(category.id)}
        >
          {category.name}
        </button>
      ))}
      <style jsx>{`
        .catalog-tabs {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 3rem;
          flex-wrap: wrap;
        }
        .tab-btn {
          padding: 0.75rem 1.4rem;
          border-radius: 999px;
          border: 1px solid var(--border-color);
          background: var(--bg-primary);
          color: var(--text-secondary);
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .tab-btn:hover, .tab-btn.active {
          background: var(--primary-color);
          border-color: var(--primary-color);
          color: white;
          box-shadow: var(--shadow-md);
        }
      `}</style>
    </div>
  );
}
