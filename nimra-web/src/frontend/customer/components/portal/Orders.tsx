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

  return (
    <div className="panel orders-panel">
      <div className="panel-head">
        <div>
          <span className="eyebrow" style={{ color: 'var(--primary-color)', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '999px', padding: '0.2rem 0.75rem', fontSize: '0.7rem' }}>Orders</span>
          <h2 style={{ marginTop: '0.15rem' }}>Recent Activity</h2>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button 
            type="button" 
            onClick={() => router.push('/orders')}
            style={{ 
              padding: '0.25rem 0.75rem', 
              fontSize: '0.75rem', 
              border: '1px solid var(--border-color)', 
              borderRadius: '5px', 
              background: 'var(--bg-secondary)', 
              color: 'var(--text-primary)', 
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.15s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(37,99,235,0.05)';
              e.currentTarget.style.borderColor = 'var(--primary-color)';
              e.currentTarget.style.color = 'var(--primary-color)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'var(--bg-secondary)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
          >
            📋 View All Orders
          </button>
          <button className="refresh-btn" type="button" onClick={onRefresh} disabled={loadingOrders}>
            {loadingOrders ? 'Refreshing...' : '↻ Refresh'}
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
                <th></th>
              </tr>
            </thead>
            <tbody>
              {displayedOrders.map((order) => (
                <tr key={order.orderId}>
                  <td className="order-id">{order.orderId}</td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td><span className={`status-badge ${statusClass(order.status)}`}>{order.status}</span></td>
                  <td>{formatCurrency(Number(order.total || 0))}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <Link 
                        href={`/track?orderId=${order.orderId}`} 
                        style={{ 
                          fontSize: '0.75rem', 
                          color: 'var(--text-secondary)', 
                          textDecoration: 'none',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          padding: '0.2rem 0.5rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          background: 'var(--bg-secondary)',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.borderColor = 'var(--primary-color)';
                          e.currentTarget.style.color = 'var(--primary-color)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-color)';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                        }}
                      >
                        📍 Track
                      </Link>
                      <button 
                        onClick={() => handleReorder(order)} 
                        style={{
                          background: 'var(--primary-color)',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '0.2rem 0.5rem',
                          color: '#ffffff',
                          cursor: 'pointer',
                          font: 'inherit',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          transition: 'all 0.15s ease',
                          boxShadow: '0 1px 2px rgba(37, 99, 235, 0.2)'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = '#1d4ed8';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(37, 99, 235, 0.3)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = 'var(--primary-color)';
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = '0 1px 2px rgba(37, 99, 235, 0.2)';
                        }}
                      >
                        🔄 Reorder
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
        :global(.orders-panel) {
          padding: 0.65rem 0.85rem !important;
        }
        .panel-head {
          margin-bottom: 0.3rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .panel-head h2 {
          margin: 0 !important;
          font-size: 1.15rem !important;
        }
        .refresh-btn {
          padding: 0.25rem 0.55rem !important;
          font-size: 0.75rem !important;
          border-width: 1px !important;
          border-radius: 5px !important;
        }
        :global(.orders-panel .table-wrap) {
          overflow-x: auto !important;
        }
        :global(.orders-table th),
        :global(.orders-table td) {
          padding: 0.45rem 0.75rem !important;
          font-size: 0.82rem;
        }
        :global(.orders-table th) {
          padding-top: 0.5rem !important;
          padding-bottom: 0.5rem !important;
        }
      `}</style>
    </div>
  );
}
