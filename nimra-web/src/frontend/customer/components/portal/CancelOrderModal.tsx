import React from 'react';
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

  return (
    <div className="cancel-modal-overlay" onClick={() => !cancelling && setOrderToCancel(null)}>
      <div className="cancel-modal-content card alert-modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Cancel Order</h2>
        <p className="modal-description">
          Submit a cancellation request for Order <strong>#{orderToCancel.orderId}</strong>? Your order will remain active until an admin approves it.
        </p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={() => setOrderToCancel(null)} disabled={cancelling}>
            No, Keep Order
          </button>
          <button className="btn btn-error" onClick={(e) => { e.stopPropagation(); handleCancelOrder(); }} disabled={cancelling}>
            {cancelling ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </div>
      <style jsx>{`
        .cancel-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 4000; /* Higher than OrderDetailsModal which is 3000 */
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background: rgba(2, 6, 23, 0.75);
          backdrop-filter: blur(8px);
        }
        .cancel-modal-content {
          width: min(420px, 100%);
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-xl);
          padding: 1.5rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .modal-title {
          color: #dc2626;
          font-size: 1.4rem;
          margin: 0;
          font-weight: 800;
        }
        .modal-description {
          color: var(--text-secondary);
          margin: 0;
          font-size: 0.95rem;
          line-height: 1.5;
        }
        .modal-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
          margin-top: 0.5rem;
        }
        .btn {
          flex: 1;
          padding: 0.65rem 1rem;
          border-radius: var(--radius-md);
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .btn-secondary {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
        }
        .btn-secondary:hover:not(:disabled) {
          background: var(--bg-tertiary);
        }
        .btn-error {
          background: #dc2626;
          border: 1px solid #dc2626;
          color: white;
        }
        .btn-error:hover:not(:disabled) {
          background: #b91c1c;
        }
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
