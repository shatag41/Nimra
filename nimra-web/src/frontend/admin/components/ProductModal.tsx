import React from 'react';
import { Product } from '@/types/cms';
import CustomSelect from './CustomSelect';
import ImageUploadField from './ImageUploadField';

interface ProductModalProps {
  editingProduct: Partial<Product>;
  setEditingProduct: React.Dispatch<React.SetStateAction<Partial<Product> | null>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  saveLoading: boolean;
}

export default function ProductModal({
  editingProduct,
  setEditingProduct,
  onClose,
  onSubmit,
  saveLoading,
}: ProductModalProps) {
  return (
    <div className="modal-backdrop glass">
      <div className="modal-card animate-fade-in">
        <div className="modal-header">
          <h2>{editingProduct.ID ? 'Edit Product ID #' + editingProduct.ID : 'Add New Product'}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <form onSubmit={onSubmit} className="modal-body">
          <div className="form-group">
            <label>Product Catalog Name</label>
            <input
              required
              type="text"
              value={editingProduct.Name || ''}
              onChange={(e) => setEditingProduct(prev => prev ? ({ ...prev, Name: e.target.value }) : null)}
              placeholder="e.g. NIMRA 1 Litre Bottle"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Volume Format</label>
              <input
                required
                type="text"
                value={editingProduct.Volume || ''}
                onChange={(e) => setEditingProduct(prev => prev ? ({ ...prev, Volume: e.target.value }) : null)}
                placeholder="e.g. 1L, 20L Jar, 500ml"
              />
            </div>
            <div className="form-group">
              <label>Unit Price (Rs)</label>
              <input
                required
                type="number"
                step="0.01"
                value={editingProduct.Price || ''}
                onChange={(e) => setEditingProduct(prev => prev ? ({ ...prev, Price: e.target.value }) : null)}
                placeholder="e.g. 20.00"
              />
            </div>
          </div>

          <div className="form-row form-row-relative">
            <div className="form-group">
              <label>Product Category</label>
              <CustomSelect
                value={editingProduct.Category || 'Packaged Water'}
                onChange={(val) => setEditingProduct(prev => prev ? ({ ...prev, Category: val }) : null)}
                options={[
                  { value: 'Packaged Water', label: 'Packaged Water' },
                  { value: 'Mineral Water', label: 'Mineral Water' },
                  { value: 'Bulk Water', label: 'Bulk Water' },
                  { value: 'Upcoming RUSH Soda', label: 'Upcoming RUSH Soda' },
                ]}
              />
            </div>
            <div className="form-group">
              <label>Catalog Status</label>
              <CustomSelect
                value={editingProduct.Active !== false ? 'true' : 'false'}
                onChange={(val) => setEditingProduct(prev => prev ? ({ ...prev, Active: val === 'true' }) : null)}
                options={[
                  { value: 'true', label: 'Active & Visible' },
                  { value: 'false', label: 'Hidden / Inactive' },
                ]}
              />
            </div>
          </div>

          <div className="form-group">
            <ImageUploadField
              label="Product Image"
              required
              scope="products"
              aspect="product"
              value={editingProduct.ImageUrl || ''}
              onChange={(url) => setEditingProduct(prev => prev ? ({ ...prev, ImageUrl: url }) : null)}
              disabled={saveLoading}
            />
          </div>

          <div className="form-group">
            <label>Specification Details</label>
            <input
              type="text"
              value={editingProduct.Specifications || ''}
              onChange={(e) => setEditingProduct(prev => prev ? ({ ...prev, Specifications: e.target.value }) : null)}
              placeholder="e.g. Balanced minerals, UV ozone treated"
            />
          </div>

          <div className="form-group">
            <label>Product Summary Description</label>
            <textarea
              required
              rows={3}
              value={editingProduct.Description || ''}
              onChange={(e) => setEditingProduct(prev => prev ? ({ ...prev, Description: e.target.value }) : null)}
              placeholder="Describe the product for customers..."
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saveLoading}>
              {saveLoading ? 'Writing catalog...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
