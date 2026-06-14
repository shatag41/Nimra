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
          background: #f8fafc;
          min-height: 100vh;
        }

        .portal-header {
          padding: 3rem 4rem;
          background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 50%, #10b981 100%);
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
          border: none;
          text-align: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: white;
          color: #0f172a;
          text-decoration: none;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05);
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
          background: linear-gradient(90deg, #0ea5e9, #06b6d4, #10b981);
          transform: scaleX(0);
          transform-origin: center;
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .action-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px -15px rgba(14, 165, 233, 0.35), 0 10px 24px -10px rgba(14, 165, 233, 0.25);
          background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%);
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
          color: #0f172a;
          margin-bottom: 0.5rem;
          font-weight: 800;
          letter-spacing: -0.01em;
        }

        .action-card p {
          color: #64748b;
          font-size: 0.95rem;
          line-height: 1.6;
        }

        .orders-section {
          padding: 3rem 4rem;
          background: white;
          box-shadow: 0 -1px 0 rgba(0,0,0,0.05);
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
          color: #0f172a;
          margin: 0;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .orders-loading, .empty-orders {
          text-align: center;
          padding: 4rem 2rem;
          color: #64748b;
        }
        
        .empty-orders p {
          font-size: 1.1rem;
          margin-bottom: 1.5rem;
        }

        .table-responsive {
          overflow-x: auto;
          border-radius: 1rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
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
          border-bottom: 1px solid #e2e8f0;
        }
        
        .orders-table tr:last-child td {
          border-bottom: none;
        }

        .orders-table th {
          color: #475569;
          font-weight: 700;
          background: #f1f5f9;
          font-size: 0.85rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        
        .orders-table td {
          font-size: 0.95rem;
          color: #0f172a;
        }

        .status-badge {
          display: inline-block;
          padding: 0.4rem 1rem;
          border-radius: 999px;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.025em;
        }

        .status-badge.pending { background: #fef3c7; color: #92400e; border: none; }
        .status-badge.processing { background: #dbeafe; color: #1e40af; border: none; }
        .status-badge.shipped { background: #f3e8ff; color: #7c3aed; border: none; }
        .status-badge.delivered { background: #d1fae5; color: #065f46; border: none; }
        .status-badge.cancelled { background: #fee2e2; color: #991b1b; border: none; }

        .loading-state {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          font-size: 1.05rem;
          background: #f8fafc;
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
