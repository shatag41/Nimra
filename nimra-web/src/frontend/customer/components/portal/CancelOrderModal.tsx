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
    <div className="modal-overlay" onClick={() => setOrderToCancel(null)}>
      <div className="modal-content card alert-modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title text-red">Cancel Order</h2>
        <p className="modal-description">
          Submit a cancellation request for Order <strong>#{orderToCancel.orderId}</strong>? Your order will remain active until an admin approves it.
        </p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={() => setOrderToCancel(null)} disabled={cancelling}>
            No, Keep Order
          </button>
          <button className="btn btn-error" onClick={handleCancelOrder} disabled={cancelling}>
            {cancelling ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );
}
