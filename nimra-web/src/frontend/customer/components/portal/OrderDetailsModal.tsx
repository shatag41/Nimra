'use client';

import React from 'react';
import { OrderRecord } from '@/types/cms';
import { formatCurrency } from '../../utils/commerce';

interface TimelineStep {
  key: string;
  label: string;
  desc: string;
  completed: boolean;
  active: boolean;
  isError?: boolean;
}

interface OrderDetailsModalProps {
  selectedOrder: OrderRecord;
  setSelectedOrder: (order: OrderRecord | null) => void;
  handleReorder: (order: OrderRecord) => void;
  setOrderToCancel: (order: OrderRecord) => void;
  getTimelineSteps: (status: string) => TimelineStep[];
  formatDate: (date?: string) => string;
}

export default function OrderDetailsModal({
  selectedOrder,
  setSelectedOrder,
  handleReorder,
  setOrderToCancel,
  getTimelineSteps,
  formatDate,
}: OrderDetailsModalProps) {
  if (!selectedOrder) return null;

  const customer = selectedOrder.customer || {};
  const items = Array.isArray(selectedOrder.items) ? selectedOrder.items : [];
  const status = String(selectedOrder.status || 'Pending');
  const addressParts = [
    customer.flatNo,
    customer.buildingName,
    customer.locality,
    customer.city,
    customer.state,
  ].filter(Boolean);

  return (
    <div className="order-details-overlay" onClick={() => setSelectedOrder(null)}>
      <div className="order-details-modal card animate-scale-in" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>Order Details</h2>
          <button type="button" className="close-modal-btn" onClick={() => setSelectedOrder(null)} aria-label="Close order details">
            x
          </button>
        </div>

        <div className="modal-scroll-area">
          <div className="details-meta-grid">
            <div>
              <span className="meta-label">Order ID</span>
              <span className="meta-value">#{selectedOrder.orderId || 'N/A'}</span>
            </div>
            <div>
              <span className="meta-label">Order Date</span>
              <span className="meta-value">{formatDate(selectedOrder.createdAt)}</span>
            </div>
            <div>
              <span className="meta-label">Payment Method</span>
              <span className="meta-value">{selectedOrder.paymentMethod || 'Cash on Delivery'}</span>
            </div>
            <div>
              <span className="meta-label">Total Amount</span>
              <span className="meta-value-price">{formatCurrency(Number(selectedOrder.total || 0))}</span>
            </div>
          </div>

          <div className="items-section">
            <h3>Ordered Items</h3>
            <div className="details-items-list">
              {items.length ? (
                items.map((item, index) => (
                  <div key={`${item.productId || item.name || 'item'}-${index}`} className="details-item-row">
                    <div className="item-row-left">
                      {item.imageUrl ? (
                        <div className="item-row-img-wrapper">
                          <img src={item.imageUrl} alt={item.name || 'Order item'} className="item-row-img" />
                        </div>
                      ) : null}
                      <div>
                        <span className="item-row-name">{item.name || 'Order item'}</span>
                        <span className="item-row-category">{[item.category, item.volume].filter(Boolean).join(' | ') || 'Item details unavailable'}</span>
                      </div>
                    </div>
                    <div className="item-row-right">
                      <span className="item-row-math">
                        {Number(item.quantity || 1)} x {formatCurrency(Number(item.price || 0))}
                      </span>
                      <strong className="item-row-total">{formatCurrency(Number(item.quantity || 1) * Number(item.price || 0))}</strong>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-details-row">No item details are available for this order.</div>
              )}
            </div>
          </div>

          <div className="delivery-section">
            <h3>Delivery Address</h3>
            <div className="delivery-address-box">
              <div className="delivery-address-head">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <strong>{customer.name || 'Customer'}</strong>
              </div>
              <p>
                {addressParts.length ? addressParts.join(', ') : 'Address not available'}
                {customer.pincode ? ` - ${customer.pincode}` : ''}
              </p>
              <p className="delivery-phone">Phone: {customer.mobile || 'Not available'}</p>
            </div>
          </div>
        </div>

        <div className="modal-footer-actions">
          <button type="button" onClick={() => handleReorder(selectedOrder)} className="btn btn-primary flex-1">
            Reorder
          </button>
          {selectedOrder.cancellationStatus === 'Pending' ? (
            <span className="status-desc-text">Cancellation pending admin approval</span>
          ) : ['pending', 'confirmed'].includes(status.toLowerCase()) ? (
            <button type="button" onClick={() => setOrderToCancel(selectedOrder)} className="btn btn-danger">
              Cancel Order
            </button>
          ) : null}
          <button type="button" onClick={() => setSelectedOrder(null)} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>

      <style jsx>{`
        .order-details-overlay {
          position: fixed;
          inset: 0;
          z-index: 3000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background: rgba(2, 6, 23, 0.62);
          backdrop-filter: blur(6px);
        }

        .order-details-modal {
          width: min(640px, 100%);
          max-height: min(86vh, 760px);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-xl);
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border-color);
          background: var(--bg-secondary);
        }

        .modal-header h2 {
          margin: 0;
          font-size: 1.1rem;
        }

        .close-modal-btn {
          width: 32px;
          height: 32px;
          border-radius: 999px;
          border: 1px solid var(--border-color);
          background: var(--bg-tertiary);
          color: var(--text-primary);
          cursor: pointer;
        }

        .modal-scroll-area {
          overflow-y: auto;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .details-meta-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1rem;
          padding: 1rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
        }

        .meta-label {
          display: block;
          margin-bottom: 0.2rem;
          font-size: 0.68rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .meta-value,
        .meta-value-price {
          color: var(--text-primary);
          font-weight: 700;
          overflow-wrap: anywhere;
        }

        .items-section h3,
        .delivery-section h3 {
          margin: 0 0 0.75rem;
          font-size: 0.95rem;
        }

        .details-items-list,
        .delivery-address-box {
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          overflow: hidden;
          background: var(--bg-secondary);
        }

        .details-item-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.85rem 1rem;
          border-bottom: 1px solid var(--border-light);
        }

        .details-item-row:last-child {
          border-bottom: 0;
        }

        .item-row-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          min-width: 0;
        }

        .item-row-img-wrapper {
          width: 44px;
          height: 44px;
          flex: 0 0 44px;
          display: grid;
          place-items: center;
          overflow: hidden;
          border-radius: var(--radius-sm);
          background: var(--bg-tertiary);
        }

        .item-row-img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .item-row-name,
        .item-row-category {
          display: block;
        }

        .item-row-name {
          font-weight: 700;
          color: var(--text-primary);
        }

        .item-row-category,
        .item-row-math {
          color: var(--text-muted);
          font-size: 0.78rem;
        }

        .item-row-right {
          text-align: right;
          white-space: nowrap;
        }

        .delivery-address-box {
          padding: 1rem;
          line-height: 1.5;
        }

        .delivery-address-head {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .delivery-address-box p {
          margin: 0;
          color: var(--text-secondary);
        }

        .delivery-phone {
          margin-top: 0.5rem !important;
          color: var(--text-primary) !important;
          font-weight: 700;
        }

        .modal-footer-actions {
          display: flex;
          gap: 0.5rem;
          padding: 1rem;
          border-top: 1px solid var(--border-color);
          background: var(--bg-secondary);
        }

        .empty-details-row {
          padding: 1rem;
          color: var(--text-muted);
        }

        @media (max-width: 560px) {
          .details-meta-grid {
            grid-template-columns: 1fr;
          }

          .details-item-row,
          .modal-footer-actions {
            align-items: stretch;
            flex-direction: column;
          }

          .item-row-right {
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
}
