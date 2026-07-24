import React from 'react';
import { Banner } from '@/types/cms';
import CustomSelect from './CustomSelect';
import ImageUploadField from './ImageUploadField';
import LoadingButton from '@/frontend/shared/LoadingButton';

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
        
        <form onSubmit={onSubmit} className="modal-body">
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

          <div className="form-row">
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
          </div>

          <div className="form-row form-row-relative">
            <div className="form-group">
              <ImageUploadField
                label="Slide Image"
                required
                scope="banners"
                aspect="wide"
                value={editingBanner.ImageUrl || ''}
                onChange={(url) => setEditingBanner(prev => prev ? ({ ...prev, ImageUrl: url }) : null)}
                disabled={saveLoading}
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

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <LoadingButton type="submit" className="btn btn-primary" isLoading={saveLoading} loadingText="Saving...">Save Banner</LoadingButton>
          </div>
        </form>
      </div>
    </div>
  );
}
