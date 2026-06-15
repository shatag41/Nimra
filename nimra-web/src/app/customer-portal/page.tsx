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
      <div className="portal-header">
        <h1 className="portal-title">Hello, <span className="highlight-text">{user?.Name}</span>!</h1>
        <div className="profile-info">
          <p><strong>Email:</strong> {user?.Username}</p>
          <p><strong>Mobile:</strong> {user?.Mobile || 'Not provided'}</p>
        </div>
      </div>

      <div className="quick-actions">
        <Link href="/products" className="action-card">
          <span className="action-icon">💧</span>
          <h3>Browse Products</h3>
          <p>Explore our pure hydration range</p>
        </Link>
        <Link href="/track" className="action-card">
          <span className="action-icon">📦</span>
          <h3>Track Orders</h3>
          <p>Check your order status</p>
        </Link>
        <Link href="/contact" className="action-card">
          <span className="action-icon">✉️</span>
          <h3>Support & Inquiry</h3>
          <p>Get in touch with us</p>
        </Link>
        <Link href="/about" className="action-card">
          <span className="action-icon">ℹ️</span>
          <h3>About NIMRA</h3>
          <p>Learn about our purity process</p>
        </Link>
      </div>

      <div className="orders-section">
        <div className="orders-content">
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
      </div>

      <style jsx>{`
        .portal-container {
          width: 100%;
          margin: 0;
          padding: 0;
          background: var(--bg-primary);
          min-height: 100vh;
        }

        .portal-header {
          padding: 3rem 4rem;
          background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
          position: relative;
          overflow: hidden;
          color: white;
        }
        
        .portal-header::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -20%;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
          border-radius: 50%;
        }
        
        .portal-header::after {
          content: '';
          position: absolute;
          bottom: -30%;
          left: -10%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          border-radius: 50%;
        }

        .portal-title {
          font-size: 2.75rem;
          font-weight: 800;
          color: white;
          margin-bottom: 0.75rem;
          letter-spacing: -0.03em;
          position: relative;
          z-index: 1;
        }

        .highlight-text {
          color: white;
          font-weight: 900;
        }

        .profile-info {
          display: flex;
          gap: 2.5rem;
          color: rgba(255,255,255,0.9);
          flex-wrap: wrap;
          position: relative;
          z-index: 1;
        }
        
        .profile-info p {
          font-size: 1rem;
          font-weight: 600;
        }
        
        .profile-info strong {
          color: white;
          font-weight: 700;
        }

        .quick-actions {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
          padding: 3rem 4rem;
          max-width: 1600px;
          margin: 0 auto;
        }

        .action-card {
          padding: 2.5rem 2rem;
          border-radius: 1.5rem;
          border: 1px solid var(--border-color);
          text-align: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: var(--bg-secondary);
          color: var(--text-primary);
          text-decoration: none;
          box-shadow: var(--shadow-sm);
          position: relative;
          overflow: hidden;
        }
        
        .action-card::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
          transform: scaleX(0);
          transform-origin: center;
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .action-card:hover {
          transform: translateY(-8px);
          box-shadow: var(--shadow-xl);
          border-color: var(--primary-color);
        }
        
        .action-card:hover::before {
          transform: scaleX(1);
        }

        .action-icon {
          font-size: 3.5rem;
          display: block;
          margin-bottom: 1.25rem;
          filter: drop-shadow(0 4px 8px rgba(14, 165, 233, 0.2));
        }

        .action-card h3 {
          font-size: 1.35rem;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
          font-weight: 800;
          letter-spacing: -0.01em;
        }

        .action-card p {
          color: var(--text-secondary);
          font-size: 0.95rem;
          line-height: 1.6;
        }

        .orders-section {
          padding: 3rem 4rem;
          background: var(--bg-secondary);
          box-shadow: 0 -1px 0 var(--border-color);
        }
        
        .orders-content {
          max-width: 1600px;
          margin: 0 auto;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        
        .section-header h2 {
          font-size: 1.75rem;
          color: var(--text-primary);
          margin: 0;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .orders-loading, .empty-orders {
          text-align: center;
          padding: 4rem 2rem;
          color: var(--text-secondary);
        }
        
        .empty-orders p {
          font-size: 1.1rem;
          margin-bottom: 1.5rem;
        }

        .table-responsive {
          overflow-x: auto;
          border-radius: 1rem;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
        }

        .orders-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          border-radius: 1rem;
          overflow: hidden;
        }

        .orders-table th, .orders-table td {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border-color);
        }
        
        .orders-table tr:last-child td {
          border-bottom: none;
        }

        .orders-table th {
          color: var(--text-secondary);
          font-weight: 700;
          background: var(--bg-tertiary);
          font-size: 0.85rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        
        .orders-table td {
          font-size: 0.95rem;
          color: var(--text-primary);
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.375rem 0.875rem;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .status-badge.pending { 
          background: rgba(249, 115, 22, 0.12); 
          color: #f97316; 
        }
        .status-badge.processing { 
          background: rgba(59, 130, 246, 0.12); 
          color: #3b82f6; 
        }
        .status-badge.shipped { 
          background: rgba(168, 85, 247, 0.12); 
          color: #a855f7; 
        }
        .status-badge.delivered { 
          background: rgba(16, 185, 129, 0.12); 
          color: #047857; 
        }
        .status-badge.cancelled { 
          background: rgba(239, 68, 68, 0.12); 
          color: #dc2626; 
        }

        .loading-state {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
          font-size: 1.05rem;
          background: var(--bg-primary);
        }
        
        @media (max-width: 1200px) {
          .quick-actions {
            grid-template-columns: repeat(2, 1fr);
            padding: 2.5rem 2rem;
          }
          .portal-header {
            padding: 2.5rem 2rem;
          }
          .orders-section {
            padding: 2.5rem 2rem;
          }
        }
        
        @media (max-width: 768px) {
          .quick-actions {
            grid-template-columns: 1fr;
            padding: 2rem 1.5rem;
          }
          .portal-header {
            padding: 2rem 1.5rem;
          }
          .orders-section {
            padding: 2rem 1.5rem;
          }
          .portal-title {
            font-size: 2.25rem;
          }
          .profile-info {
            gap: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
