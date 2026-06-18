'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

interface CartToastProps {
  visible: boolean;
  name: string;
  onClose: () => void;
}

export function CartToast({ visible, name, onClose }: CartToastProps) {
  return (
    <div className={`cart-toast-banner ${visible ? 'visible' : ''}`}>
      <div className="toast-content">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <span><strong>{name}</strong> added to cart!</span>
      </div>
      <Link href="/cart" className="toast-go-btn" onClick={onClose}>
        Go to Cart →
      </Link>
      <button className="toast-close" onClick={onClose}>✕</button>
    </div>
  );
}

export function PortalNotifications() {
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { user } = useAuth();

  React.useEffect(() => {
    import('@/utils/api').then((api) => {
      api.fetchNotifications()
        .then((data) => {
          const key = user ? `nimra_read_notifs_${user.ID || user.Username}` : 'nimra_read_notifs_guest';
          let readIds: string[] = [];
          try {
            readIds = JSON.parse(localStorage.getItem(key) || '[]');
          } catch {}
          const updated = data.map(n => {
            const isRead = readIds.includes(String(n.ID)) || n.Read === true || n.Read === 'true';
            return { ...n, Read: isRead };
          });
          setNotifications(updated);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    });
  }, [user]);

  const handleMarkAsRead = async (id: string | number, index: number) => {
    try {
      setNotifications(prev => prev.map((n, i) => i === index ? { ...n, Read: true } : n));
      
      const key = user ? `nimra_read_notifs_${user.ID || user.Username}` : 'nimra_read_notifs_guest';
      let readIds: string[] = [];
      try {
        readIds = JSON.parse(localStorage.getItem(key) || '[]');
      } catch {}
      if (!readIds.includes(String(id))) {
        readIds.push(String(id));
        localStorage.setItem(key, JSON.stringify(readIds));
      }
      
      const api = await import('@/utils/api');
      await api.saveNotification({ ID: id, Read: true }, 'update');
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading notifications...</div>;
  }

  return (
    <div className="panel notifications-panel" style={{ padding: '2rem' }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Notifications</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Stay updated with NIMRA's latest updates and news.</p>
      
      {notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          No notifications available at the moment.
        </div>
      ) : (
        <div className="notifications-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {notifications.map((n, idx) => {
            const isUnread = n.Read !== true && n.Read !== 'true';
            return (
              <div 
                key={`${n.ID}-${idx}`} 
                onClick={() => handleMarkAsRead(n.ID, idx)}
                style={{ 
                  padding: '1.25rem', 
                  borderRadius: 'var(--radius-lg)', 
                  border: '1px solid var(--border-color)', 
                  background: isUnread ? 'rgba(37, 99, 235, 0.04)' : 'var(--bg-secondary)',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease, transform 0.15s ease',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', gap: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', paddingRight: isUnread ? '16px' : '0' }}>{n.Title}</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(n.CreatedAt || n.Timestamp).toLocaleDateString()}
                  </span>
                </div>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{n.Message}</p>
                {isUnread && (
                  <span style={{
                    position: 'absolute',
                    top: '22px',
                    right: '1.25rem',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--primary-color)'
                  }} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CartToast;
