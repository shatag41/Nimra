import React from 'react';
import { Product } from '@/types/cms';
import { formatCurrency } from '@/frontend/customer/utils/commerce';
import CustomSelect from './CustomSelect';
import Image from 'next/image';
import { getUploadImageUrl } from '@/utils/uploadImage';

interface ProductsTabProps {
  products: Product[];
  filteredProducts: Product[];
  showFilters: boolean;
  productCategoryFilter: string;
  setProductCategoryFilter: (val: string) => void;
  productStatusFilter: string;
  setProductStatusFilter: (val: string) => void;
  setEditingProduct: (p: Partial<Product> | null) => void;
  setProductFormOpen: (open: boolean) => void;
  handleProductDelete: (id: string | number) => Promise<boolean>;
}

export default React.memo(function ProductsTab({
  products,
  filteredProducts,
  showFilters,
  productCategoryFilter,
  setProductCategoryFilter,
  productStatusFilter,
  setProductStatusFilter,
  setEditingProduct,
  setProductFormOpen,
  handleProductDelete,
}: ProductsTabProps) {
  return (
    <div className="products-tab card glass">
      <div className="section-head-btn">
        <h3>Products Catalog ({products.length})</h3>
        <button 
          className="btn btn-primary btn-add" 
          onClick={() => {
            setEditingProduct({ Name: '', Category: 'Packaged Water', Volume: '1L', Price: '', Description: '', ImageUrl: '', Active: true });
            setProductFormOpen(true);
          }}
        >
          ➕ Add Product
        </button>
      </div>

        <div className={`filter-bar products-filter-panel ${showFilters ? 'filters-open animate-fade-in' : 'filters-closed'}`} aria-hidden={!showFilters}>
          <div className="filter-group">
            <label>Category:</label>
            <CustomSelect
              value={productCategoryFilter}
              onChange={setProductCategoryFilter}
              clearable={true}
              onClear={() => setProductCategoryFilter('All')}
              options={[
                { value: 'All', label: 'All Categories' },
                { value: 'Packaged Water', label: 'Packaged Water' },
                { value: 'Mineral Water', label: 'Mineral Water' },
                { value: 'Bulk Water', label: 'Bulk Water' },
                { value: 'Upcoming RUSH Soda', label: 'Upcoming RUSH Soda' },
              ]}
            />
          </div>
          <div className="filter-group">
            <label>Status:</label>
            <CustomSelect
              value={productStatusFilter}
              onChange={setProductStatusFilter}
              clearable={true}
              onClear={() => setProductStatusFilter('All')}
              options={[
                { value: 'All', label: 'All Status' },
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' },
              ]}
            />
          </div>
        </div>

      <div className="table-responsive products-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Volume</th>
              <th>Price</th>
              <th>Status</th>
              <th className="sticky-action-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p, idx) => (
              <tr key={`${p.ID}-${p.Name}-${idx}`}>
                <td>
                  {p.ImageUrl ? (
                    <Image src={getUploadImageUrl(p.ImageUrl) || p.ImageUrl} alt={p.Name} className="table-thumbnail" width={56} height={84} />
                  ) : (
                    <span className="table-thumbnail thumbnail-placeholder">No image</span>
                  )}
                </td>
                <td><strong>{p.Name}</strong></td>
                <td>{p.Category}</td>
                <td>{p.Volume}</td>
                <td><strong>{formatCurrency(Number(p.Price))}</strong></td>
                <td>
                  <span className={`badge ${p.Active !== false ? 'badge-primary' : 'badge-cancelled'}`}>
                    {p.Active !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="sticky-action-col">
                  <div className="actions-flex">
                    <button 
                      className="btn-table btn-edit" 
                      onClick={() => {
                        setEditingProduct(p);
                        setProductFormOpen(true);
                      }}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn-table btn-delete" 
                      onClick={() => void handleProductDelete(p.ID)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={7} className="empty-td">No products found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mobile-products-list">
        {filteredProducts.map((product, index) => (
          <article className="mobile-product-card" key={`${product.ID}-${product.Name}-${index}`}>
            <div className="mobile-product-image-wrap">
              {product.ImageUrl ? (
                <Image src={getUploadImageUrl(product.ImageUrl) || product.ImageUrl} alt={product.Name} className="mobile-product-image" width={112} height={168} />
              ) : (
                <span className="mobile-product-image-placeholder">No image</span>
              )}
            </div>
            <div className="mobile-product-info">
              <h4>{product.Name}</h4>
              <dl>
                <div><dt>Category</dt><dd>{product.Category}</dd></div>
                <div><dt>Size</dt><dd>{product.Volume}</dd></div>
                <div><dt>Price</dt><dd>{formatCurrency(Number(product.Price))}</dd></div>
                <div><dt>Status</dt><dd><span className={`badge ${product.Active !== false ? 'badge-primary' : 'badge-cancelled'}`}>{product.Active !== false ? 'Active' : 'Inactive'}</span></dd></div>
              </dl>
            </div>
            <div className="mobile-product-actions">
              <button
                type="button"
                className="btn-table btn-edit"
                onClick={() => {
                  setEditingProduct(product);
                  setProductFormOpen(true);
                }}
              >
                Edit
              </button>
              <button type="button" className="btn-table btn-delete" onClick={() => void handleProductDelete(product.ID)}>Delete</button>
            </div>
          </article>
        ))}
        {filteredProducts.length === 0 && <div className="mobile-products-empty">No products found.</div>}
      </div>

      <style jsx>{`
        .admin-table th,
        .admin-table td {
          vertical-align: middle;
          white-space: nowrap;
        }
        .admin-table th:nth-child(2),
        .admin-table td:nth-child(2) {
          min-width: 180px;
          white-space: normal;
        }
        .admin-table th:nth-child(4),
        .admin-table td:nth-child(4),
        .admin-table th:nth-child(5),
        .admin-table td:nth-child(5),
        .admin-table th:nth-child(6),
        .admin-table td:nth-child(6) {
          width: 120px;
        }
        .badge {
          display: inline-block;
          white-space: nowrap;
        }
        .actions-flex {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: nowrap;
        }
      `}</style>
    </div>
  );
});
