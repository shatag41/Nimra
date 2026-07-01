'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  const [categoryFilter, setCategoryFilter] = React.useState<string>('All');
  const [priorityFilter, setPriorityFilter] = React.useState<string>('All');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const { user } = useAuth();
  const router = useRouter();
  const pageSize = 5;

  const loadNotifications = React.useCallback(() => {
    import('@/utils/api').then((api) => {
      api.fetchNotifications(user?.ID, user?.Username)
        .then((data) => {
          const key = user ? `nimra_read_notifs_${user.ID || user.Username}` : 'nimra_read_notifs_guest';
          let readIds: string[] = [];
          try {
            readIds = JSON.parse(localStorage.getItem(key) || '[]');
          } catch {}
          
          const filteredData = data.filter(n => n.TargetAudience === 'CUSTOMER_NOTIFICATION');

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

  React.useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 10000); // 10s Polling
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const handleMarkAsRead = React.useCallback(async (id: string | number) => {
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
      await api.saveNotification({ ID: id, Read: true, UserId: user?.ID }, 'update');
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, [user]);

  const handleMarkAllAsRead = React.useCallback(async () => {
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
      await Promise.all(unread.map(n => api.saveNotification({ ID: n.ID, Read: true, UserId: user?.ID }, 'update')));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  }, [notifications, user]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading notifications...</div>;
  }

  // Filter local list based on filter states
  const filteredNotificationsList = notifications.filter(n => {
    // 1. Category Filter
    if (categoryFilter !== 'All') {
      const cat = String(n.Category || '').toLowerCase();
      if (cat !== categoryFilter.toLowerCase()) return false;
    }
    // 2. Priority Filter
    if (priorityFilter !== 'All') {
      const prio = String(n.Priority || 'Low').toLowerCase();
      if (prio !== priorityFilter.toLowerCase()) return false;
    }
    // 3. Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const title = String(n.Title || '').toLowerCase();
      const message = String(n.Message || '').toLowerCase();
      if (!title.includes(query) && !message.includes(query)) return false;
    }
    return true;
  });

  const unreadCount = filteredNotificationsList.filter(n => n.Read !== true && n.Read !== 'true').length;
  const totalPages = Math.ceil(filteredNotificationsList.length / pageSize);
  const paginatedNotifications = filteredNotificationsList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const categories = ['All', 'Orders', 'Delivery Updates', 'Payments', 'Offers/Promotions', 'Account Updates', 'Cancellation Requests'];
  const priorities = ['All', 'High', 'Medium', 'Low'];

  return (
    <div className="panel notifications-panel" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0' }}>Notifications</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '0', fontSize: '0.9rem', marginTop: '0.25rem' }}>Stay updated with NIMRA's latest updates and news.</p>
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

      {/* Redesigned Filters Panel */}
      <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ flex: '1 1 250px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Search Notifications</label>
            <input 
              type="text" 
              placeholder="Search by title or text..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              style={{ padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
            />
          </div>

          {/* Priority Filter */}
          <div style={{ flex: '0 1 180px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Priority</label>
            <select 
              value={priorityFilter}
              onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
              style={{ padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
            >
              {priorities.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Filter by Category</label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {categories.map((cat) => {
              const isActive = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => { setCategoryFilter(cat); setCurrentPage(1); }}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '50px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    border: isActive ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
                    background: isActive ? 'var(--primary-color)' : 'var(--bg-primary)',
                    color: isActive ? '#ffffff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      {filteredNotificationsList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)', fontSize: '0.95rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-color)' }}>
          No notifications match your search and filter criteria.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="notifications-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {paginatedNotifications.map((n) => {
              const isUnread = n.Read !== true && n.Read !== 'true';
              
              // Priority Styling
              const priority = String(n.Priority || 'Low').toLowerCase();
              const priorityColor = 
                priority === 'high' ? '#ef4444' : 
                priority === 'medium' ? '#f59e0b' : '#3b82f6';
              const priorityBg = 
                priority === 'high' ? 'rgba(239, 68, 68, 0.08)' : 
                priority === 'medium' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(59, 130, 246, 0.08)';

              return (
                <div 
                  key={n.ID} 
                  onClick={() => isUnread && handleMarkAsRead(n.ID)}
                  style={{ 
                    padding: '1.5rem', 
                    borderRadius: 'var(--radius-lg)', 
                    border: isUnread ? '1px solid var(--primary-color)' : '1px solid var(--border-color)', 
                    background: isUnread ? 'rgba(37, 99, 235, 0.03)' : 'var(--bg-secondary)',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {n.Category && (
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: 'var(--border-color)', color: 'var(--text-primary)' }}>
                            {n.Category}
                          </span>
                        )}
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: priorityBg, color: priorityColor }}>
                          {n.Priority || 'Low'}
                        </span>
                      </div>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: isUnread ? 700 : 600, color: 'var(--text-primary)', paddingRight: '2rem' }}>
                        {n.Title}
                      </h4>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(n.CreatedAt || n.Timestamp).toLocaleString()}
                    </span>
                  </div>

                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {n.Message}
                  </p>

                  {/* Action Link button */}
                  {n.ActionLink && (
                    <div style={{ display: 'flex', marginTop: '0.25rem' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isUnread) handleMarkAsRead(n.ID);
                          router.push(n.ActionLink);
                        }}
                        className="btn btn-primary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <span>View Details</span>
                        <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>→</span>
                      </button>
                    </div>
                  )}

                  {isUnread && (
                    <span style={{
                      position: 'absolute',
                      top: '24px',
                      right: '1.5rem',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'var(--primary-color)'
                    }} />
                  )}
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
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

