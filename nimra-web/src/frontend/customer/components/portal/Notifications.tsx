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
  const [currentPage, setCurrentPage] = React.useState(1);
  const { user } = useAuth();
  const pageSize = 5;

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
             const notif = n as any;
             const type = String(notif.Type || notif.type || '').toLowerCase();
             if (type === 'admin' || type === 'system') {
               return false;
             }
             if (!user) return false;
             
             const nUserId = notif.UserId ?? notif.userId ?? notif['User ID'] ?? notif['UserId'] ?? notif.CustomerID ?? notif.customerId ?? notif['Customer ID'];
             const nUsername = notif.Username ?? notif.username ?? notif.Email ?? notif.email;
             
             if (nUserId !== undefined && nUserId !== null && String(nUserId).trim() !== '') {
               return String(nUserId) === String(user.ID);
             }
             if (nUsername !== undefined && nUsername !== null && String(nUsername).trim() !== '') {
               return String(nUsername).toLowerCase() === String(user.Username).toLowerCase();
             }
             return false;
          });

          // Sort by CreatedAt / Timestamp descending
          const sorted = filteredData.sort((a, b) => {
            const timeA = new Date(a.CreatedAt || a.Timestamp || 0).getTime();
            const timeB = new Date(b.CreatedAt || b.Timestamp || 0).getTime();
            return timeB - timeA;
          });

          const updated = sorted.map(n => {
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

  const handleMarkAsRead = async (id: string | number) => {
    try {
      setNotifications(prev => prev.map(n => String(n.ID) === String(id) ? { ...n, Read: true } : n));
      
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
  const totalPages = Math.ceil(notifications.length / pageSize);
  const paginatedNotifications = notifications.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="notifications-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {paginatedNotifications.map((n) => {
              const isUnread = n.Read !== true && n.Read !== 'true';
              return (
                <div 
                  key={n.ID} 
                  onClick={() => isUnread && handleMarkAsRead(n.ID)}
                  style={{ 
                    padding: '1.25rem', 
                    borderRadius: 'var(--radius-lg)', 
                    border: isUnread ? '1px solid var(--primary-color)' : '1px solid var(--border-color)', 
                    background: isUnread ? 'rgba(37, 99, 235, 0.04)' : 'var(--bg-secondary)',
                    cursor: isUnread ? 'pointer' : 'default',
                    transition: 'background 0.2s ease, transform 0.15s ease',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', gap: '1rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: isUnread ? 700 : 600, color: isUnread ? 'var(--text-primary)' : 'var(--text-secondary)', paddingRight: isUnread ? '16px' : '0' }}>{n.Title}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(n.CreatedAt || n.Timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ margin: 0, color: isUnread ? 'var(--text-secondary)' : 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{n.Message}</p>
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

          {totalPages > 1 && (
            <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="btn btn-secondary btn-sm"
                style={{ opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`btn btn-sm ${currentPage === pageNum ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ minWidth: '2rem' }}
                >
                  {pageNum}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="btn btn-secondary btn-sm"
                style={{ opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CartToast;
