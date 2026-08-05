import React from 'react';
import { Banner } from '@/types/cms';
import CustomSelect from './CustomSelect';

interface BannersTabProps {
  filteredBanners: Banner[];
  showFilters: boolean;
  bannerStatusFilter: string;
  setBannerStatusFilter: (val: string) => void;
  setEditingBanner: (b: Partial<Banner> | null) => void;
  setBannerFormOpen: (open: boolean) => void;
  handleBannerDelete: (id: string | number) => Promise<boolean>;
}

export default function BannersTab({
  filteredBanners,
  showFilters,
  bannerStatusFilter,
  setBannerStatusFilter,
  setEditingBanner,
  setBannerFormOpen,
  handleBannerDelete,
}: BannersTabProps) {
  return (
    <div className="banners-tab card glass">
      <div className="section-head-btn">
        <h3>Homepage Slider Banners</h3>
        <button 
          className="btn btn-primary btn-add" 
          onClick={() => {
            setEditingBanner({ Title: '', Subtitle: '', ImageUrl: '', ButtonText: 'Order Now', ButtonLink: '/products', Active: true });
            setBannerFormOpen(true);
          }}
        >
          ➕ Add Banner Slide
        </button>
      </div>

      <div className={`filter-bar banners-filter-panel ${showFilters ? 'filters-open animate-fade-in' : 'filters-closed'}`} aria-hidden={!showFilters}>
          <div className="filter-group">
            <label>Status:</label>
            <CustomSelect
              value={bannerStatusFilter}
              onChange={setBannerStatusFilter}
              clearable={true}
              onClear={() => setBannerStatusFilter('All')}
              portalMenu
              options={[
                { value: 'All', label: 'All Status' },
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' },
              ]}
            />
          </div>
        </div>

      <div className="table-responsive banners-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Slide Image</th>
              <th>Title</th>
              <th>Subtitle</th>
              <th>Button Text</th>
              <th>Link</th>
              <th>Status</th>
              <th className="sticky-action-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBanners.map((b) => {
              const imageUrl = String(b.ImageUrl || '').trim();

              return (
                <tr key={b.ID}>
                  <td>
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageUrl} alt={b.Title} className="table-thumbnail wide" loading="lazy" decoding="async" />
                    ) : (
                      <span className="table-thumbnail wide thumbnail-placeholder">No image</span>
                    )}
                  </td>
                  <td><strong>{b.Title}</strong></td>
                  <td className="max-cell-width">{b.Subtitle}</td>
                  <td>{b.ButtonText}</td>
                  <td><code>{b.ButtonLink}</code></td>
                  <td>
                    <span className={`badge ${b.Active !== false ? 'badge-primary' : 'badge-cancelled'}`}>
                      {b.Active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="sticky-action-col">
                    <div className="actions-flex">
                      <button 
                        className="btn-table btn-edit" 
                        onClick={() => {
                          setEditingBanner(b);
                          setBannerFormOpen(true);
                        }}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn-table btn-delete" 
                        onClick={() => void handleBannerDelete(b.ID)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredBanners.length === 0 && (
              <tr>
                <td colSpan={7} className="empty-td">No banners found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mobile-banners-list">
        {filteredBanners.map((banner, index) => {
          const imageUrl = String(banner.ImageUrl || '').trim();

          return (
            <article className="mobile-banner-card" key={`${banner.ID}-${banner.Title}-${index}`}>
              <div className="mobile-banner-image-wrap">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt={banner.Title} className="mobile-banner-image" loading="lazy" decoding="async" />
                ) : (
                  <span className="mobile-banner-image-placeholder">No image</span>
                )}
              </div>
              <div className="mobile-banner-info">
                <h4>{banner.Title}</h4>
                <dl>
                  <div><dt>Subtitle</dt><dd>{banner.Subtitle || 'Not set'}</dd></div>
                  <div><dt>Button</dt><dd>{banner.ButtonText || 'Not set'}</dd></div>
                  <div><dt>Link</dt><dd><code>{banner.ButtonLink || 'Not set'}</code></dd></div>
                  <div><dt>Status</dt><dd><span className={`badge ${banner.Active !== false ? 'badge-primary' : 'badge-cancelled'}`}>{banner.Active !== false ? 'Active' : 'Inactive'}</span></dd></div>
                </dl>
              </div>
              <div className="mobile-banner-actions">
                <button
                  type="button"
                  className="btn-table btn-edit"
                  onClick={() => {
                    setEditingBanner(banner);
                    setBannerFormOpen(true);
                  }}
                >
                  Edit
                </button>
                <button type="button" className="btn-table btn-delete" onClick={() => void handleBannerDelete(banner.ID)}>Delete</button>
              </div>
            </article>
          );
        })}
        {filteredBanners.length === 0 && <div className="mobile-banners-empty">No banners found.</div>}
      </div>
    </div>
  );
}
