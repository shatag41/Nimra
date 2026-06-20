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

      {showFilters && (
        <div className="filter-bar animate-fade-in">
          <div className="filter-group">
            <label>Status:</label>
            <CustomSelect
              value={bannerStatusFilter}
              onChange={setBannerStatusFilter}
              clearable={true}
              onClear={() => setBannerStatusFilter('All')}
              options={[
                { value: 'All', label: 'All Statuses' },
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' },
              ]}
            />
          </div>
        </div>
      )}

      <div className="table-responsive">
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
            {filteredBanners.map((b) => (
              <tr key={b.ID}>
                <td>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.ImageUrl} alt={b.Title} className="table-thumbnail wide" loading="lazy" decoding="async" />
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
            ))}
            {filteredBanners.length === 0 && (
              <tr>
                <td colSpan={7} className="empty-td">No banners found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
