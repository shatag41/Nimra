'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { fetchCustomerOrders } from '../../utils/api';
import { OrderRecord } from '../../types/cms';

export default function CustomerPortal() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadOrders();
    }
  }, [isAuthenticated, user]);

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const data = await fetchCustomerOrders(user?.ID || '', user?.Username || '');
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  if (isLoading || !isAuthenticated) {
    return <div className="loading-state">Loading...</div>;
  }

  return (
    <div className="portal-container">
      <div className="portal-header glass">
        <h1 className="portal-title">Hello, <span className="highlight-text">{user?.Name}</span>!</h1>
        <div className="profile-info">
          <p><strong>Email:</strong> {user?.Username}</p>
          <p><strong>Mobile:</strong> {user?.Mobile || 'Not provided'}</p>
        </div>
      </div>

      <div className="quick-actions">
        <Link href="/products" className="action-card glass">
          <span className="action-icon">💧</span>
          <h3>Browse Products</h3>
          <p>Explore our pure hydration range</p>
        </Link>
        <Link href="/track" className="action-card glass">
          <span className="action-icon">📦</span>
          <h3>Track Orders</h3>
          <p>Check your order status</p>
        </Link>
        <Link href="/contact" className="action-card glass">
          <span className="action-icon">✉️</span>
          <h3>Support & Inquiry</h3>
          <p>Get in touch with us</p>
        </Link>
        <Link href="/about" className="action-card glass">
          <span className="action-icon">ℹ️</span>
          <h3>About NIMRA</h3>
          <p>Learn about our purity process</p>
        </Link>
      </div>

      <div className="orders-section glass">
        <div className="section-header">
          <h2>Your Recent Orders</h2>
        </div>
        
        {loadingOrders ? (
          <div className="orders-loading">Loading your orders...</div>
        ) : orders.length > 0 ? (
          <div className="table-responsive">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, i) => (
                  <tr key={i}>
                    <td>{order.orderId}</td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge ${order.status.toLowerCase().replace(' ', '-')}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>₹{order.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-orders">
            <p>You haven't placed any orders yet.</p>
            <Link href="/products" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Shop Now
            </Link>
          </div>
        )}
      </div>

      <style jsx>{`
        .portal-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1.5rem;
        }

        .portal-header {
          padding: 2.5rem;
          border-radius: var(--radius-2xl);
          margin-bottom: 2rem;
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(10, 10, 10, 0.2) 100%);
          border: 1px solid var(--border-color);
        }

        .portal-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 1rem;
        }

        .highlight-text {
          background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .profile-info {
          display: flex;
          gap: 2rem;
          color: var(--text-secondary);
          flex-wrap: wrap;
        }

        .quick-actions {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .action-card {
          padding: 2rem;
          border-radius: var(--radius-xl);
          border: 1px solid var(--border-color);
          text-align: center;
          transition: all var(--transition-normal);
          background: var(--bg-secondary);
          color: inherit;
          text-decoration: none;
        }

        .action-card:hover {
          transform: translateY(-5px);
          border-color: var(--primary-color);
          box-shadow: var(--shadow-lg);
          background: rgba(6, 182, 212, 0.05);
        }

        .action-icon {
          font-size: 3rem;
          display: block;
          margin-bottom: 1rem;
        }

        .action-card h3 {
          font-size: 1.25rem;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .action-card p {
          color: var(--text-secondary);
          font-size: 0.95rem;
        }

        .orders-section {
          padding: 2rem;
          border-radius: var(--radius-xl);
          border: 1px solid var(--border-color);
          background: var(--bg-secondary);
        }

        .section-header h2 {
          font-size: 1.5rem;
          color: var(--text-primary);
          margin-bottom: 1.5rem;
        }

        .orders-loading, .empty-orders {
          text-align: center;
          padding: 3rem;
          color: var(--text-secondary);
        }

        .table-responsive {
          overflow-x: auto;
        }

        .orders-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .orders-table th, .orders-table td {
          padding: 1rem;
          border-bottom: 1px solid var(--border-light);
        }

        .orders-table th {
          color: var(--text-secondary);
          font-weight: 600;
          background: rgba(0, 0, 0, 0.2);
        }

        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .status-badge.pending { background: rgba(234, 179, 8, 0.15); color: #facc15; }
        .status-badge.processing { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
        .status-badge.shipped { background: rgba(168, 85, 247, 0.15); color: #c084fc; }
        .status-badge.delivered { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
        .status-badge.cancelled { background: rgba(239, 68, 68, 0.15); color: #f87171; }

        .loading-state {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
