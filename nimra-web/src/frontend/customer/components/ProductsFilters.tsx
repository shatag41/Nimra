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
}

export default React.memo(function ProductsFilters({ category, status, size, onCategoryChange, onStatusChange, onSizeChange }: ProductsFiltersProps) {
  return (
    <aside className="products-sidebar card">
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
  );
});
