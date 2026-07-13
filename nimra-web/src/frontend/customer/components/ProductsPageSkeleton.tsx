'use client';

import React from 'react';
import CustomerPageHeader from './CustomerPageHeader';

const filterGroups = [5, 3, 3];

interface ProductsPageSkeletonProps {
  cardCount?: number;
}

export default function ProductsPageSkeleton({ cardCount = 5 }: ProductsPageSkeletonProps) {
  const skeletonCards = Array.from({ length: Math.max(1, cardCount) }, (_, index) => index);
  return (
    <div className="products-page products-page-skeleton container" aria-busy="true" aria-label="Loading products">
      <CustomerPageHeader
        className="products-page-header"
        badge="PRODUCTS"
        title="Explore Our Products"
        subtitle="Premium packaged drinking water for every need."
      />

      <div className="products-layout-grid">
        <aside className="products-sidebar card" aria-hidden="true">
          {filterGroups.map((count, groupIndex) => (
            <div className="sidebar-section" key={groupIndex}>
              <div className="products-skeleton-line products-skeleton-heading" />
              <div className="filter-options">
                {Array.from({ length: count }, (_, index) => (
                  <div className="products-skeleton-filter" key={index}>
                    <span className="products-skeleton-radio" />
                    <span className="products-skeleton-line" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </aside>

        <main className="products-main-content">
          <div className="search-bar-wrapper card products-skeleton-search" aria-hidden="true">
            <span className="products-skeleton-search-icon" />
            <span className="products-skeleton-line" />
          </div>

          <div className="catalog-grid products-catalog-grid" aria-hidden="true">
            {skeletonCards.map((index) => (
              <article className="catalog-card glass products-skeleton-card" key={index}>
                <div className="product-img-wrap products-skeleton-image" />
                <div className="cat-info-box">
                  <div className="cat-meta"><span className="products-skeleton-pill" /></div>
                  <div className="products-skeleton-line products-skeleton-title" />
                  <div className="products-skeleton-description">
                    <span className="products-skeleton-line" />
                    <span className="products-skeleton-line" />
                  </div>
                  <div className="cat-price-row">
                    <div className="products-skeleton-price">
                      <span className="products-skeleton-line" />
                      <span className="products-skeleton-line" />
                    </div>
                    <span className="products-skeleton-button" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
