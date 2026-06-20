import React from 'react';
import { Banner } from '@/types/cms';
import CustomSelect from './CustomSelect';
import ImageUploadField from './ImageUploadField';

interface BannerModalProps {
  editingBanner: Partial<Banner>;
  setEditingBanner: React.Dispatch<React.SetStateAction<Partial<Banner> | null>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  saveLoading: boolean;
}

export default function BannerModal({
  editingBanner,
  setEditingBanner,
  onClose,
  onSubmit,
  saveLoading,
}: BannerModalProps) {
  return (
    <div className="modal-backdrop glass">
      <div className="modal-card animate-fade-in">
        <div className="modal-header">
          <h2>{editingBanner.ID ? 'Edit Slide ID #' + editingBanner.ID : 'Add Homepage Slide'}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <form onSubmit={onSubmit} className="modal-body enterprise-modal-body">
          <section className="modal-section">
            <div className="modal-section-head">
              <span>Slide Content</span>
            </div>
            <div className="form-group">
              <label>Banner Slide Title</label>
              <input
                required
                type="text"
                value={editingBanner.Title || ''}
                onChange={(e) => setEditingBanner(prev => prev ? ({ ...prev, Title: e.target.value }) : null)}
                placeholder="Pure Hydration. Healthy Living."
              />
            </div>

            <div className="form-group">
              <label>Slide Subtitle Text</label>
              <input
                required
                type="text"
                value={editingBanner.Subtitle || ''}
                onChange={(e) => setEditingBanner(prev => prev ? ({ ...prev, Subtitle: e.target.value }) : null)}
                placeholder="Enter details text describing hydration..."
              />
            </div>
          </section>

          <section className="modal-section modal-section-media">
            <div className="modal-section-head">
              <span>Hero Image</span>
            </div>
            <ImageUploadField
              label="Slide Image"
              required
              scope="banners"
              aspect="wide"
              value={editingBanner.ImageUrl || ''}
              onChange={(url) => setEditingBanner(prev => prev ? ({ ...prev, ImageUrl: url }) : null)}
              disabled={saveLoading}
            />
          </section>

          <section className="modal-section">
            <div className="modal-section-head">
              <span>Action & Publishing</span>
            </div>
            <div className="form-row modal-grid-3 modal-select-row">
              <div className="form-group">
                <label>CTA Button Label</label>
                <input
                  required
                  type="text"
                  value={editingBanner.ButtonText || ''}
                  onChange={(e) => setEditingBanner(prev => prev ? ({ ...prev, ButtonText: e.target.value }) : null)}
                />
              </div>
              <div className="form-group">
                <label>Button Action Route/ID</label>
                <input
                  required
                  type="text"
                  value={editingBanner.ButtonLink || ''}
                  onChange={(e) => setEditingBanner(prev => prev ? ({ ...prev, ButtonLink: e.target.value }) : null)}
                  placeholder="e.g. /products, #products"
                />
              </div>
              <div className="form-group">
                <label>Banner Status</label>
                <CustomSelect
                  value={editingBanner.Active !== false ? 'true' : 'false'}
                  onChange={(val) => setEditingBanner(prev => prev ? ({ ...prev, Active: val === 'true' }) : null)}
                  options={[
                    { value: 'true', label: 'Active (Visible)' },
                    { value: 'false', label: 'Inactive (Hidden)' },
                  ]}
                />
              </div>
            </div>
          </section>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saveLoading}>
              Save Banner
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
