'use client';

import React from 'react';

export type ProductStatusFilter = 'all' | 'available' | 'upcoming';
export type ProductSizeFilter = 'all' | 'jar' | 'bottle';

const categories = [
  { id: 'All', name: 'All Products' },
  { id: 'Packaged Drinking Water', name: 'Packaged Drinking Water' },
  { id: 'Mineral Water', name: 'Mineral Water' },
  { id: 'Bulk Water', name: 'Bulk Water' },
  { id: 'Upcoming RUSH Soda', name: 'RUSH Soda' },
];

interface ProductsFiltersProps {
  category: string;
  status: ProductStatusFilter;
  size: ProductSizeFilter;
  onCategoryChange: (value: string) => void;
  onStatusChange: (value: ProductStatusFilter) => void;
  onSizeChange: (value: ProductSizeFilter) => void;
  isMobileOpen: boolean;
  onMobileToggle: () => void;
  onClearAll: () => void;
}

export default React.memo(function ProductsFilters({ category, status, size, onCategoryChange, onStatusChange, onSizeChange, isMobileOpen, onMobileToggle, onClearAll }: ProductsFiltersProps) {
  const activeFilterCount = Number(category !== 'All') + Number(status !== 'all') + Number(size !== 'all');
  const selectedLabels = [
    category !== 'All' ? categories.find((option) => option.id === category)?.name : null,
    status !== 'all' ? (status === 'available' ? 'Available Now' : 'Upcoming') : null,
    size !== 'all' ? (size === 'jar' ? 'Bulk Jars (20L)' : 'Bottles (250ml - 2L)') : null,
  ].filter(Boolean) as string[];

  return (
    <div className="products-filter-area">
      <div className="mobile-filter-bar">
        <button
          type="button"
          className="mobile-filter-toggle"
          aria-expanded={isMobileOpen}
          aria-controls="products-filter-panel"
          onClick={onMobileToggle}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
          <span className="mobile-filter-label">Filters</span>
          {activeFilterCount > 0 && <span className="mobile-filter-count">{activeFilterCount}</span>}
          <svg className="mobile-filter-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
        </button>
        {activeFilterCount > 0 && <button type="button" className="mobile-clear-filters" onClick={onClearAll}>Clear All</button>}
      </div>
      {selectedLabels.length > 0 && (
        <div className="mobile-selected-filters" aria-label="Selected filters">
          {selectedLabels.map((label) => <span key={label}>{label}</span>)}
        </div>
      )}
      <aside id="products-filter-panel" className={`products-sidebar card ${isMobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-section">
        <h3>Categories</h3>
        <div className="filter-options">
          {categories.map((option) => (
            <label key={option.id} className="filter-label">
              <input type="radio" name="category-filter" checked={category === option.id} onChange={() => onCategoryChange(option.id)} className="filter-radio" />
              <span className="filter-radio-control" aria-hidden="true" />
              <span>{option.name}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="sidebar-section">
        <h3>Availability</h3>
        <div className="filter-options">
          {([{ id: 'all', label: 'All Products' }, { id: 'available', label: 'Available Now' }, { id: 'upcoming', label: 'Upcoming' }] as const).map((option) => (
            <label key={option.id} className="filter-label">
              <input type="radio" name="status-filter" checked={status === option.id} onChange={() => onStatusChange(option.id)} className="filter-radio" />
              <span className="filter-radio-control" aria-hidden="true" />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="sidebar-section">
        <h3>Size / Capacity</h3>
        <div className="filter-options">
          {([{ id: 'all', label: 'All Sizes' }, { id: 'jar', label: 'Bulk Jars (20L)' }, { id: 'bottle', label: 'Bottles (250ml - 2L)' }] as const).map((option) => (
            <label key={option.id} className="filter-label">
              <input type="radio" name="size-filter" checked={size === option.id} onChange={() => onSizeChange(option.id)} className="filter-radio" />
              <span className="filter-radio-control" aria-hidden="true" />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>
      </aside>
    </div>
  );
});
