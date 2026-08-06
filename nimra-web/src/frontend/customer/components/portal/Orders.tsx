'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/frontend/customer/contexts/NotificationContext';
import { OrderRecord } from '@/types/cms';
import { formatCurrency } from '../../utils/commerce';
import { createReorderCheckoutDraft } from '../../utils/reorderDraft';

interface OrdersProps {
  orders: OrderRecord[];
  loadingOrders: boolean;
  onRefresh: () => void;
}

const formatDate = (value?: string) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export function Orders({ orders, loadingOrders, onRefresh }: OrdersProps) {
  const router = useRouter();
  const { notify } = useNotification();
  const displayedOrders = React.useMemo(() => {
    return orders
      .filter((o) => o.status?.toLowerCase() !== 'cancelled')
      .slice(0, 4);
  }, [orders]);

  const handleReorder = (order: OrderRecord) => {
    try {
      const draft = createReorderCheckoutDraft(order);
      if (!draft || !draft.items.length) {
        notify.error('Cannot Reorder', 'This order has no reorderable items.');
        return;
      }
      notify.success('Reordering Items', `Reordering ${draft.items.length} product${draft.items.length === 1 ? '' : 's'} from ${order.orderId}`);
      router.push('/checkout?reorder=1');
    } catch {
      notify.error('Reorder Failed', 'Failed to start reorder checkout.');
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
          {/* Desktop table — hidden on mobile via CSS */}
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
                        notify.success('Copied to Clipboard', 'Order ID copied to clipboard');
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
                      <Link href={`/track?orderId=${order.orderId}`} className="btn-table-track">
                        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        Track Order
                      </Link>
                      <button onClick={() => handleReorder(order)} className="btn-table-reorder">
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

          {/* Mobile cards — hidden by default, shown at ≤639px via CSS */}
          <div className="orders-mobile-cards">
            {displayedOrders.map((order) => (
              <div key={`mob-${order.orderId}`} className="order-mobile-card">
                {/* Top row: order ID + copy btn | status badge */}
                <div className="order-card-top-row">
                  <div className="order-card-id-block">
                    <span className="order-card-id-label">Order ID</span>
                    <div className="order-card-id-value-row">
                      <span className="order-card-id-value">{order.orderId}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(order.orderId);
                          notify.success('Copied to Clipboard', 'Order ID copied to clipboard');
                        }}
                        className="order-card-copy-btn"
                        title="Copy Order ID"
                        aria-label="Copy Order ID"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="order-card-top-row-right">
                    <span className={`status-badge-portal ${getStatusClass(order.status)}`}>
                      <span className="status-dot" />
                      <span>{order.status}</span>
                    </span>
                  </div>
                </div>

                {/* Middle row: date + total */}
                <div className="order-card-meta-row">
                  <span className="order-card-date">
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    {formatDate(order.createdAt)}
                  </span>
                  <span className="order-card-amount">{formatCurrency(Number(order.total || 0))}</span>
                </div>

                {/* Action buttons */}
                <div className="order-card-actions-row">
                  <button onClick={() => router.push(`/track?orderId=${order.orderId}`)} className="btn-table-track-mobile">
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    Track Order
                  </button>
                  <button onClick={() => handleReorder(order)} className="btn-table-reorder">
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="9" cy="21" r="1"></circle>
                      <circle cx="20" cy="21" r="1"></circle>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                    Reorder
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="empty-state orders-empty-state">
          <div className="orders-empty-icon" aria-hidden="true">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <h3>No orders yet</h3>
          <p>Your NIMRA order history will appear here after checkout.</p>
          <Link href="/products" className="btn btn-primary">Browse Products</Link>
        </div>
      )}

      <style jsx>{`
        /* ── Panel head ── */
        .panel-head {
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.5rem;
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
          white-space: nowrap;
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

        /* ── Table wrapper: never overflow viewport ── */
        .table-wrap {
          overflow-x: hidden;
          width: 100%;
          max-width: 100%;
        }

        /* ── Desktop table ── */
        .orders-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0 4px;
          min-width: 0;
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
          max-width: 160px;
        }
        .order-id-text {
          font-family: var(--font-heading);
          font-weight: 700;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
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
          flex-shrink: 0;
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
          white-space: nowrap;
        }

        .amount-cell {
          font-weight: 700;
          color: var(--text-primary) !important;
          white-space: nowrap;
        }

        /* ── Status badge ── */
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
          white-space: nowrap;
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
          flex-shrink: 0;
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

        /* ── Action buttons ── */
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
          white-space: nowrap;
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
          white-space: nowrap;
        }
        .btn-table-reorder:hover {
          background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
        }
        .btn-table-reorder:active {
          transform: translateY(0) scale(0.98);
        }

        /* ── Mobile cards: hidden by default ── */
        .orders-mobile-cards {
          display: none;
          flex-direction: column;
          gap: 0.6rem;
        }

        .orders-empty-icon {
          display: none;
        }

        /* ── Mobile breakpoint: hide table, show cards ── */
        @media (max-width: 639px) {
          .panel-head {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.55rem;
          }
          .panel-head > div:last-child {
            width: 100%;
            display: flex;
            gap: 0.4rem;
          }
          .panel-head > div:last-child .btn-portal-secondary {
            flex: 1;
            justify-content: center;
            font-size: 0.7rem;
            padding: 0.4rem 0.5rem;
          }
          .orders-table {
            display: none;
          }
          .orders-mobile-cards {
            display: flex;
          }
          .orders-empty-state {
            min-height: clamp(18.5rem, 82vw, 21rem) !important;
            display: flex !important;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: clamp(0.65rem, 2.8vw, 0.9rem) !important;
            padding: clamp(1.35rem, 6vw, 2rem) !important;
            text-align: center;
            overflow: visible !important;
          }
          .orders-empty-icon {
            width: 54px;
            height: 54px;
            display: flex;
            flex: 0 0 auto;
            align-items: center;
            justify-content: center;
            margin-bottom: 0.15rem;
            border-radius: 50%;
            color: var(--primary-color);
            background: rgba(37, 99, 235, 0.06);
            box-shadow: 0 4px 10px rgba(37, 99, 235, 0.05);
          }
          .orders-empty-state h3,
          .orders-empty-state p {
            width: 100%;
            max-width: 22rem;
            height: auto;
            margin: 0;
            overflow: visible;
            white-space: normal;
            overflow-wrap: anywhere;
          }
          .orders-empty-state h3 {
            font-size: 1.05rem;
          }
          .orders-empty-state p {
            font-size: 0.82rem;
            line-height: 1.45;
            color: var(--text-secondary);
          }
          .orders-empty-state .btn {
            margin-top: 0.25rem;
          }
        }

        /* ── Mobile order card styles ── */
        .order-mobile-card {
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(191, 219, 254, 0.3);
          border-radius: 14px;
          padding: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
          transition: border-color 200ms ease, background 200ms ease;
        }
        .order-mobile-card:hover {
          border-color: rgba(37, 99, 235, 0.3);
          background: rgba(37, 99, 235, 0.02);
        }
        :global([data-theme="dark"]) .order-mobile-card {
          background: rgba(15, 23, 42, 0.35);
          border-color: rgba(255, 255, 255, 0.06);
        }
        :global([data-theme="dark"]) .order-mobile-card:hover {
          border-color: rgba(59, 130, 246, 0.25);
          background: rgba(59, 130, 246, 0.05);
        }

        .order-card-top-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.6rem;
          flex-wrap: wrap; /* allow status badge to wrap if necessary */
        }
        /* ID block takes all remaining space and wraps */
        .order-card-id-block {
          display: flex;
          flex-direction: column;
          gap: 0.12rem;
          min-width: 0;
          flex: 1 1 min-content;
        }
        .order-card-id-label {
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--text-muted);
        }
        .order-card-id-value-row {
          display: block;
          line-height: 1.5;
          width: 100%;
        }
        /* Allow Order ID to wrap cleanly */
        .order-card-id-value {
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 0.82rem;
          color: var(--text-primary);
          word-break: break-word;
          overflow-wrap: break-word;
          white-space: normal;
          display: inline;
        }
        /* Status badge container */
        .order-card-top-row-right {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          flex-shrink: 0;
        }
        .order-card-copy-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.2rem;
          color: var(--text-muted);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: color 150ms ease;
          min-width: 24px;
          min-height: 24px;
          border-radius: 6px;
          vertical-align: middle;
          margin-left: 0.3rem;
          position: relative;
          top: -2px;
        }
        .order-card-copy-btn:hover {
          color: var(--primary-color);
          background: rgba(37, 99, 235, 0.06);
        }

        .order-card-meta-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          flex-wrap: wrap;
          padding: 0.45rem 0.55rem;
          background: rgba(248, 250, 252, 0.6);
          border-radius: 8px;
          border: 1px solid rgba(191, 219, 254, 0.2);
        }
        :global([data-theme="dark"]) .order-card-meta-row {
          background: rgba(15, 23, 42, 0.4);
          border-color: rgba(255, 255, 255, 0.05);
        }
        .order-card-date {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--text-secondary);
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
        }
        .order-card-amount {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .order-card-actions-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          flex-wrap: nowrap;
        }
        /* Both buttons stay compact, equal height, on opposite sides */
        .order-card-actions-row .btn-table-track-mobile,
        .order-card-actions-row .btn-table-reorder {
          flex: 0 1 auto;
          width: auto;
          justify-content: center;
          min-height: 38px;
          font-size: 0.75rem;
          padding: 0.4rem 0.85rem;
          white-space: nowrap;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          text-decoration: none;
        }
        
        /* Explicit ghost styling for Track Order on mobile */
        .order-card-actions-row .btn-table-track-mobile {
          background: #ffffff;
          border: 1px solid #2563eb;
          color: #2563eb;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.08);
          transition: all 200ms ease;
        }
        .order-card-actions-row .btn-table-track-mobile:hover {
          background: #f4f9ff;
          border-color: #1d4ed8;
          color: #1d4ed8;
        }
        .order-card-actions-row .btn-table-track-mobile:active {
          transform: scale(0.98);
        }
        :global([data-theme="dark"]) .order-card-actions-row .btn-table-track-mobile {
          background: transparent;
          border-color: rgba(96, 165, 250, 0.6);
          color: #60a5fa;
        }
        :global([data-theme="dark"]) .order-card-actions-row .btn-table-track-mobile:hover {
          background: rgba(96, 165, 250, 0.1);
        }

        @media (max-width: 380px) {
          .order-card-actions-row .btn-table-track-mobile,
          .order-card-actions-row .btn-table-reorder {
            min-height: 44px;
            padding: 0.4rem 0.5rem;
          }
        }
      `}</style>
    </div>
  );
}
