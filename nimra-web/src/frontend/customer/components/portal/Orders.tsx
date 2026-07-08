'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { OrderRecord } from '@/types/cms';
import { formatCurrency } from '../../utils/commerce';
import { createReorderCheckoutDraft } from '../../utils/reorderDraft';

interface OrdersProps {
  orders: OrderRecord[];
  loadingOrders: boolean;
  onRefresh: () => void;
}

const statusClass = (status: string) => status.toLowerCase().replace(/[^a-z0-9]+/g, '-');

const formatDate = (value?: string) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export function Orders({ orders, loadingOrders, onRefresh }: OrdersProps) {
  const router = useRouter();
  const displayedOrders = React.useMemo(() => {
    return orders
      .filter((o) => o.status?.toLowerCase() !== 'cancelled')
      .slice(0, 4);
  }, [orders]);

  const handleReorder = (order: OrderRecord) => {
    try {
      const draft = createReorderCheckoutDraft(order);
      if (!draft || !draft.items.length) {
        toast.error('This order has no reorderable items.');
        return;
      }
      toast.success(`Reordering ${draft.items.length} product${draft.items.length === 1 ? '' : 's'} from ${order.orderId}`);
      router.push('/checkout?reorder=1');
    } catch {
      toast.error('Failed to start reorder checkout.');
    }
  };

  const getStatusClass = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('pending')) return 'pending';
    if (s.includes('processing') || s.includes('confirm') || s.includes('dispatch')) return 'processing';
    if (s.includes('delivered')) return 'delivered';
    return 'cancelled';
  };

  return (
    <div className="panel orders-panel">
      <div className="panel-head">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          <span className="eyebrow-badge">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ opacity: 0.9 }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            <span>Orders</span>
          </span>
          <h2>Recent Activity</h2>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button 
            type="button" 
            onClick={() => router.push('/orders')}
            className="btn-portal-secondary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            View All Orders
          </button>
          <button 
            className={`btn-portal-secondary ${loadingOrders ? 'loading' : ''}`} 
            type="button" 
            onClick={onRefresh} 
            disabled={loadingOrders}
          >
            <svg className={loadingOrders ? 'spin' : ''} xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
            </svg>
            <span>{loadingOrders ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {loadingOrders ? (
        <div className="empty-state">Loading your orders...</div>
      ) : displayedOrders.length > 0 ? (
        <div className="table-wrap">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Status</th>
                <th>Total</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedOrders.map((order) => (
                <tr key={order.orderId}>
                  <td className="order-id-cell">
                    <span className="order-id-text">{order.orderId}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(order.orderId);
                        toast.success('Order ID copied to clipboard');
                      }}
                      className="copy-btn"
                      title="Copy Order ID"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    </button>
                  </td>
                  <td className="date-cell">{formatDate(order.createdAt)}</td>
                  <td>
                    <span className={`status-badge-portal ${getStatusClass(order.status)}`}>
                      <span className="status-dot" />
                      <span>{order.status}</span>
                    </span>
                  </td>
                  <td className="amount-cell">{formatCurrency(Number(order.total || 0))}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <Link 
                        href={`/track?orderId=${order.orderId}`} 
                        className="btn-table-track"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        Track Order
                      </Link>
                      <button 
                        onClick={() => handleReorder(order)} 
                        className="btn-table-reorder"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="9" cy="21" r="1"></circle>
                          <circle cx="20" cy="21" r="1"></circle>
                          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                        Reorder
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <h3>No orders yet</h3>
          <p>Your NIMRA order history will appear here after checkout.</p>
          <Link href="/products" className="btn btn-primary">Browse Products</Link>
        </div>
      )}

      <style jsx>{`
        .panel-head {
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .panel-head h2 {
          margin: 0 !important;
          font-size: 1.25rem !important;
          font-weight: 700 !important;
          color: var(--text-primary);
        }
        .eyebrow-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          color: #2563eb;
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(37, 99, 235, 0.02) 100%);
          border: 1px solid rgba(37, 99, 235, 0.15);
          border-radius: 999px;
          padding: 0.2rem 0.65rem;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          width: fit-content;
        }
        .btn-portal-secondary {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.35rem 0.8rem;
          font-size: 0.75rem;
          font-weight: 600;
          border: 1px solid rgba(191, 219, 254, 0.5);
          border-radius: 999px;
          background: var(--bg-secondary);
          color: var(--text-primary);
          cursor: pointer;
          transition: all 200ms ease;
        }
        .btn-portal-secondary:hover:not(:disabled) {
          border-color: var(--primary-color);
          color: var(--primary-color);
          background: linear-gradient(135deg, #ffffff 0%, #f4f9ff 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(37, 99, 235, 0.08);
        }
        .btn-portal-secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn-portal-secondary svg.spin {
          animation: spin-anim 1s linear infinite;
        }
        @keyframes spin-anim {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .table-wrap {
          overflow-x: auto;
          width: 100%;
        }
        .orders-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0 4px;
          min-width: 680px;
        }
        .orders-table th {
          position: sticky;
          top: 0;
          z-index: 10;
          background: var(--bg-secondary);
          color: var(--text-secondary);
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 0.65rem 0.85rem;
          text-align: left;
          border-bottom: 1px solid rgba(191, 219, 254, 0.3);
        }
        :global([data-theme="dark"]) .orders-table th {
          background: rgba(15, 23, 42, 0.95);
        }
        .orders-table td {
          padding: 0.55rem 0.85rem;
          background: rgba(255, 255, 255, 0.55);
          border-top: 1px solid rgba(191, 219, 254, 0.25);
          border-bottom: 1px solid rgba(191, 219, 254, 0.25);
          font-size: 0.82rem;
          color: var(--text-secondary);
          transition: background 200ms ease;
        }
        :global([data-theme="dark"]) .orders-table td {
          background: rgba(15, 23, 42, 0.3);
          border-top: 1px solid rgba(255, 255, 255, 0.04);
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }
        .orders-table td:first-child {
          border-left: 1px solid rgba(191, 219, 254, 0.25);
          border-top-left-radius: 12px;
          border-bottom-left-radius: 12px;
        }
        :global([data-theme="dark"]) .orders-table td:first-child {
          border-left: 1px solid rgba(255, 255, 255, 0.04);
        }
        .orders-table td:last-child {
          border-right: 1px solid rgba(191, 219, 254, 0.25);
          border-top-right-radius: 12px;
          border-bottom-right-radius: 12px;
        }
        :global([data-theme="dark"]) .orders-table td:last-child {
          border-right: 1px solid rgba(255, 255, 255, 0.04);
        }
        .orders-table tbody tr:hover td {
          background: rgba(37, 99, 235, 0.045);
          border-color: rgba(37, 99, 235, 0.2);
        }
        :global([data-theme="dark"]) .orders-table tbody tr:hover td {
          background: rgba(59, 130, 246, 0.08);
          border-color: rgba(59, 130, 246, 0.2);
        }
        
        .order-id-cell {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-weight: 700;
          color: var(--text-primary) !important;
          border-right: 0 !important;
        }
        .order-id-text {
          font-family: var(--font-heading);
          font-weight: 700;
        }
        .copy-btn {
          opacity: 0;
          background: none;
          border: none;
          cursor: pointer;
          padding: 2px;
          color: var(--text-muted);
          display: inline-flex;
          align-items: center;
          transition: all 150ms ease;
        }
        .orders-table tr:hover .copy-btn {
          opacity: 1;
        }
        .copy-btn:hover {
          color: var(--primary-color);
          transform: scale(1.1);
        }
        
        .date-cell {
          font-weight: 500;
        }
        
        .amount-cell {
          font-weight: 700;
          color: var(--text-primary) !important;
        }
        
        .status-badge-portal {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.25rem 0.7rem;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 700;
          line-height: 1;
          border: 1px solid transparent;
        }
        .status-badge-portal.pending {
          background: rgba(249, 115, 22, 0.08);
          border-color: rgba(249, 115, 22, 0.2);
          color: #ea580c;
          box-shadow: 0 2px 8px rgba(249, 115, 22, 0.08);
        }
        .status-badge-portal.processing {
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(37, 99, 235, 0.03) 100%);
          border-color: rgba(37, 99, 235, 0.25);
          color: #2563eb;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.1);
        }
        .status-badge-portal.delivered {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(34, 197, 94, 0.03) 100%);
          border-color: rgba(34, 197, 94, 0.25);
          color: #16a34a;
          box-shadow: 0 2px 8px rgba(34, 197, 94, 0.1);
        }
        .status-badge-portal.cancelled {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(239, 68, 68, 0.03) 100%);
          border-color: rgba(239, 68, 68, 0.25);
          color: #dc2626;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.1);
        }
        
        :global([data-theme="dark"]) .status-badge-portal.pending {
          background: rgba(251, 146, 60, 0.12);
          color: #fb923c;
          border-color: rgba(251, 146, 60, 0.2);
        }
        :global([data-theme="dark"]) .status-badge-portal.processing {
          background: linear-gradient(135deg, rgba(96, 165, 250, 0.15) 0%, rgba(96, 165, 250, 0.05) 100%);
          color: #60a5fa;
          border-color: rgba(96, 165, 250, 0.25);
        }
        :global([data-theme="dark"]) .status-badge-portal.delivered {
          background: linear-gradient(135deg, rgba(74, 222, 128, 0.15) 0%, rgba(74, 222, 128, 0.05) 100%);
          color: #4ade80;
          border-color: rgba(74, 222, 128, 0.25);
        }
        :global([data-theme="dark"]) .status-badge-portal.cancelled {
          background: linear-gradient(135deg, rgba(248, 113, 113, 0.15) 0%, rgba(248, 113, 113, 0.05) 100%);
          color: #f87171;
          border-color: rgba(248, 113, 113, 0.25);
        }
        
        .status-badge-portal .status-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background-color: currentColor;
          display: inline-block;
        }
        .status-badge-portal.pending .status-dot,
        .status-badge-portal.processing .status-dot {
          animation: status-pulse 2s infinite ease-in-out;
        }
        @keyframes status-pulse {
          0% { transform: scale(0.85); opacity: 0.6; }
          50% { transform: scale(1.25); opacity: 1; }
          100% { transform: scale(0.85); opacity: 0.6; }
        }
        
        .btn-table-track {
          font-size: 0.72rem;
          font-weight: 700;
          color: #2563eb;
          text-decoration: none;
          border: 1px solid rgba(37, 99, 235, 0.25);
          border-radius: 999px;
          padding: 0.25rem 0.7rem;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(224, 242, 254, 0.85) 100%);
          box-shadow: 0 2px 6px rgba(37, 99, 235, 0.08);
          transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        :global([data-theme="dark"]) .btn-table-track {
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.75) 0%, rgba(15, 23, 42, 0.55) 100%);
          border-color: rgba(59, 130, 246, 0.3);
          color: #60a5fa;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }
        .btn-table-track:hover {
          border-color: rgba(37, 99, 235, 0.55);
          color: #1d4ed8;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.18), 0 0 0 2.5px rgba(37, 99, 235, 0.08);
        }
        :global([data-theme="dark"]) .btn-table-track:hover {
          border-color: rgba(59, 130, 246, 0.65);
          color: #60a5fa;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3), 0 0 0 2.5px rgba(59, 130, 246, 0.15);
        }
        .btn-table-track:active {
          transform: translateY(0) scale(0.96);
        }
        
        .btn-table-reorder {
          background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
          border: none;
          border-radius: 999px;
          padding: 0.25rem 0.65rem;
          color: #ffffff;
          cursor: pointer;
          font: inherit;
          font-size: 0.72rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.15);
          transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-table-reorder:hover {
          background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
        }
        .btn-table-reorder:active {
          transform: translateY(0) scale(0.98);
        }
      `}</style>
    </div>
  );
}
