'use client';

import React from 'react';
import Link from 'next/link';
import { OrderRecord } from '@/types/cms';
import { formatCurrency } from '../../utils/commerce';

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
  const displayedOrders = orders.slice(0, 4);

  return (
    <div className="panel orders-panel">
      <div className="panel-head">
        <div>
          <span className="eyebrow" style={{ color: 'var(--primary-color)', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '999px', padding: '0.2rem 0.75rem', fontSize: '0.7rem' }}>Orders</span>
          <h2 style={{ marginTop: '0.15rem' }}>Recent Activity</h2>
        </div>
        <button className="refresh-btn" type="button" onClick={onRefresh} disabled={loadingOrders}>
          {loadingOrders ? 'Refreshing...' : '↻ Refresh'}
        </button>
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
                  <td><Link href={`/track?orderId=${order.orderId}`} className="table-link">Track →</Link></td>
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
