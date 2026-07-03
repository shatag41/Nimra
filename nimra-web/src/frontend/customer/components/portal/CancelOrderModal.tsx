'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { OrderRecord } from '@/types/cms';

interface CancelOrderModalProps {
  orderToCancel: OrderRecord;
  setOrderToCancel: (order: OrderRecord | null) => void;
  cancelling: boolean;
  handleCancelOrder: () => void;
}

export default function CancelOrderModal({
  orderToCancel,
  setOrderToCancel,
  cancelling,
  handleCancelOrder,
}: CancelOrderModalProps) {
  if (!orderToCancel) return null;

  const modal = (
    <div className="cancel-modal-overlay" onClick={() => !cancelling && setOrderToCancel(null)}>
      <div className="cancel-modal-panel" role="dialog" aria-modal="true" aria-labelledby="cancel-order-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="cancel-order-title" className="cancel-modal-title">Cancel Order</h2>
        <p className="cancel-modal-description">
          Submit a cancellation request for Order <strong>#{orderToCancel.orderId}</strong>? Your order will remain active until an admin approves it.
        </p>
        <div className="cancel-modal-actions">
          <button className="cancel-modal-button cancel-modal-button-secondary" onClick={() => setOrderToCancel(null)} disabled={cancelling}>
            No, Keep Order
          </button>
          <button className="cancel-modal-button cancel-modal-button-danger" onClick={(e) => { e.stopPropagation(); handleCancelOrder(); }} disabled={cancelling}>
            {cancelling ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </div>
      <style jsx>{`
        .cancel-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 100000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background: rgba(2, 6, 23, 0.75);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .cancel-modal-panel {
          position: relative;
          z-index: 1;
          width: min(420px, 100%);
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl);
          box-shadow: 0 24px 80px rgba(2, 6, 23, 0.35);
          padding: 1.5rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          animation: cancelModalScaleIn 160ms ease-out;
        }
        .cancel-modal-title {
          color: #dc2626;
          font-size: 1.4rem;
          margin: 0;
          font-weight: 800;
        }
        .cancel-modal-description {
          color: var(--text-secondary);
          margin: 0;
          font-size: 0.95rem;
          line-height: 1.5;
        }
        .cancel-modal-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
          margin-top: 0.5rem;
        }
        .cancel-modal-button {
          flex: 1;
          padding: 0.65rem 1rem;
          border-radius: var(--radius-md);
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .cancel-modal-button-secondary {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
        }
        .cancel-modal-button-secondary:hover:not(:disabled) {
          background: var(--bg-tertiary);
        }
        .cancel-modal-button-danger {
          background: #dc2626;
          border: 1px solid #dc2626;
          color: white;
        }
        .cancel-modal-button-danger:hover:not(:disabled) {
          background: #b91c1c;
        }
        .cancel-modal-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        @keyframes cancelModalScaleIn {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @media (max-width: 480px) {
          .cancel-modal-actions {
            flex-direction: column-reverse;
          }
        }
      `}</style>
    </div>
  );

  if (typeof document === 'undefined') return modal;
  return createPortal(modal, document.body);
}
