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

export function PortalNotifications({ hideKPIs }: { hideKPIs?: boolean } = {}) {
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
          
          const filteredData = data.filter(n => {
             const type = String(n.Type || '').toLowerCase();
             if (type === 'admin' || type === 'inquiry') {
               return String(n.Message) === "Your inquiry has been reviewed";
             }
             return true;
          });

          const updated = filteredData.map(n => {
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

  const handleMarkAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => n.Read !== true && n.Read !== 'true');
      if (!unread.length) return;
      
      setNotifications(prev => prev.map(n => ({ ...n, Read: true })));
      
      const key = user ? `nimra_read_notifs_${user.ID || user.Username}` : 'nimra_read_notifs_guest';
      let readIds: string[] = [];
      try {
        readIds = JSON.parse(localStorage.getItem(key) || '[]');
      } catch {}
      
      unread.forEach(n => {
        if (!readIds.includes(String(n.ID))) readIds.push(String(n.ID));
      });
      localStorage.setItem(key, JSON.stringify(readIds));
      
      const api = await import('@/utils/api');
      await Promise.all(unread.map(n => api.saveNotification({ ID: n.ID, Read: true }, 'update')));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading notifications...</div>;
  }

  const unreadCount = notifications.filter(n => n.Read !== true && n.Read !== 'true').length;
  const adminNotifs = notifications.filter(n => String(n.Type || '').toLowerCase() === 'admin').length;
  const promoNotifs = notifications.filter(n => String(n.Type || '').toLowerCase() === 'promotional').length;

  return (
    <>
      {!hideKPIs && (
        <section className="metric-grid" aria-label="Notifications summary" style={{ gridTemplateColumns: 'repeat(3, 1fr)', margin: '0 auto 1.5rem', padding: '0' }}>
          <div className="metric-card">
            <span>Unread Alerts</span>
            <strong style={{ color: unreadCount > 0 ? '#ef4444' : 'inherit', fontSize: '1.4rem' }}>{unreadCount}</strong>
            <small>Messages requiring attention</small>
          </div>
          <div className="metric-card">
            <span>System & Admin</span>
            <strong>{adminNotifs}</strong>
            <small>Important account updates</small>
          </div>
          <div className="metric-card">
            <span>Promotions</span>
            <strong>{promoNotifs}</strong>
            <small>Offers and discounts</small>
          </div>
        </section>
      )}

      <div className="panel notifications-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0' }}>Notifications</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem', marginTop: '0.5rem' }}>Stay updated with NIMRA's latest updates and news.</p>
          </div>
          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllAsRead}
              className="btn btn-secondary btn-sm"
            >
              Mark all as read
            </button>
          )}
        </div>
        
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No notifications available at the moment.
          </div>
        ) : (
          <div className="notifications-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
          {(() => {
            const unreadNotifs = notifications.filter(n => n.Read !== true && n.Read !== 'true');
            return unreadNotifs.length > 0 && (
              <>
                <h3 style={{ fontSize: '1rem', color: 'var(--primary-color)', margin: '0 0 0.5rem', fontWeight: 700 }}>Recent</h3>
                {unreadNotifs.map((n) => {
                  const originalIdx = notifications.findIndex(item => item.ID === n.ID && item.Timestamp === n.Timestamp);
                  return (
                    <div 
                      key={`${n.ID}-${originalIdx}`} 
                      onClick={() => handleMarkAsRead(n.ID, originalIdx)}
                      style={{ 
                        padding: '1.25rem', 
                        borderRadius: 'var(--radius-lg)', 
                        border: '1px solid var(--primary-color)', 
                        background: 'rgba(37, 99, 235, 0.04)',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease, transform 0.15s ease',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', gap: '1rem' }}>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', paddingRight: '16px' }}>{n.Title}</h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {new Date(n.CreatedAt || n.Timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{n.Message}</p>
                      <span style={{
                        position: 'absolute',
                        top: '22px',
                        right: '1.25rem',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: 'var(--primary-color)'
                      }} />
                    </div>
                  );
                })}
              </>
            );
          })()}

          {(() => {
            const readNotifs = notifications.filter(n => n.Read === true || n.Read === 'true');
            return readNotifs.length > 0 && (
              <>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', margin: '1rem 0 0.5rem', fontWeight: 600 }}>Earlier</h3>
                {readNotifs.map((n) => {
                  const originalIdx = notifications.findIndex(item => item.ID === n.ID && item.Timestamp === n.Timestamp);
                  return (
                    <div 
                      key={`${n.ID}-${originalIdx}`} 
                      style={{ 
                        padding: '1.25rem', 
                        borderRadius: 'var(--radius-lg)', 
                        border: '1px solid var(--border-color)', 
                        background: 'var(--bg-secondary)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', gap: '1rem' }}>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{n.Title}</h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {new Date(n.CreatedAt || n.Timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{n.Message}</p>
                    </div>
                  );
                })}
              </>
            );
          })()}
        </div>
      )}
    </div>
    </>
  );
}

export default CartToast;
