import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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

// Timeline grouping helper
const getRelativeGroup = (dateString: string | number) => {
  if (!dateString) return 'Earlier';
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return 'Earlier';
};

const getTimeAgo = (dateString: string | number) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

const getCategoryIcon = (category: string) => {
  const cat = String(category || '').toLowerCase();
  if (cat.includes('order')) return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0"/></svg>;
  if (cat.includes('delivery')) return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>;
  if (cat.includes('payment')) return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>;
  if (cat.includes('offer') || cat.includes('promo')) return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>;
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>;
};

export function PortalNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Unread'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [showCategoryFilters, setShowCategoryFilters] = useState(false);
  const categoryFilterRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!showCategoryFilters) return;

    const closeOnOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (categoryFilterRef.current && !categoryFilterRef.current.contains(event.target as Node)) {
        setShowCategoryFilters(false);
      }
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('touchstart', closeOnOutsideClick);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('touchstart', closeOnOutsideClick);
    };
  }, [showCategoryFilters]);

  const loadNotifications = useCallback(() => {
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

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = useCallback(async (id: string | number) => {
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

  const handleDelete = useCallback(async (id: string | number) => {
    try {
      setNotifications(prev => prev.filter(n => String(n.ID) !== String(id)));
      const api = await import('@/utils/api');
      await api.saveNotification({ ID: id, UserId: user?.ID }, 'delete');
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  }, [user]);

  const handleMarkAllAsRead = useCallback(async () => {
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

  const handleClearRead = useCallback(async () => {
    try {
      const readNotifs = notifications.filter(n => n.Read === true || n.Read === 'true');
      if (!readNotifs.length) return;
      
      setNotifications(prev => prev.filter(n => n.Read !== true && n.Read !== 'true'));
      const api = await import('@/utils/api');
      await Promise.all(readNotifs.map(n => api.saveNotification({ ID: n.ID, UserId: user?.ID }, 'delete')));
    } catch (err) {
      console.error('Failed to clear read notifications:', err);
    }
  }, [notifications, user]);

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  // Derived state
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (statusFilter === 'Unread' && (n.Read === true || n.Read === 'true')) return false;
      if (categoryFilter !== 'All') {
        const cat = String(n.Category || '').toLowerCase();
        if (cat !== categoryFilter.toLowerCase()) return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const title = String(n.Title || '').toLowerCase();
        const message = String(n.Message || '').toLowerCase();
        if (!title.includes(query) && !message.includes(query)) return false;
      }
      return true;
    });
  }, [notifications, statusFilter, categoryFilter, searchQuery]);

  const unreadCount = notifications.filter(n => n.Read !== true && n.Read !== 'true').length;
  
  const groupedNotifications = useMemo(() => {
    const groups: Record<string, any[]> = { 'Today': [], 'Yesterday': [], 'Earlier': [] };
    filteredNotifications.forEach(n => {
      const group = getRelativeGroup(n.CreatedAt || n.Timestamp);
      groups[group].push(n);
    });
    return groups;
  }, [filteredNotifications]);

  const categories = ['All', 'Orders', 'Delivery Updates', 'Payments', 'Offers/Promotions', 'Account Updates', 'Cancellation Requests'];

  // Skeletons
  if (loading) {
    return (
      <div className="panel notifications-panel" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes shimmer {
            0% { background-position: -1000px 0; }
            100% { background-position: 1000px 0; }
          }
          .skeleton {
            animation: shimmer 2s infinite linear;
            background: linear-gradient(to right, var(--bg-secondary) 4%, var(--border-color) 25%, var(--bg-secondary) 36%);
            background-size: 1000px 100%;
            border-radius: var(--radius-sm);
          }
        `}} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div className="skeleton" style={{ width: '150px', height: '28px' }}></div>
          <div className="skeleton" style={{ width: '100px', height: '28px' }}></div>
        </div>
        <div className="skeleton" style={{ width: '100%', height: '60px', marginBottom: '2rem', borderRadius: 'var(--radius-lg)' }}></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="skeleton" style={{ width: '100%', height: '80px', borderRadius: 'var(--radius-md)' }}></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="panel notifications-panel" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <style dangerouslySetInnerHTML={{__html: `
        .notif-row {
          display: flex;
          gap: 1rem;
          padding: 1rem 1.25rem;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          position: relative;
          transition: all 0.2s ease;
          overflow: hidden;
        }
        .notif-row:hover {
          border-color: var(--primary-color);
          box-shadow: var(--shadow-sm);
          background: var(--bg-secondary);
        }
        .notif-row.unread {
          background: var(--bg-secondary);
        }
        .notif-row.unread::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background: var(--primary-color);
        }
        .notif-actions {
          display: flex;
          gap: 0.5rem;
          opacity: 0;
          transition: opacity 0.2s ease;
          align-items: center;
        }
        .notif-row:hover .notif-actions {
          opacity: 1;
        }
        .notif-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
          padding: 0.35rem;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }
        .notif-btn:hover {
          color: var(--text-primary);
          background: var(--border-color);
        }
        .notif-btn.delete:hover {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }
        .filter-chip {
          padding: 0.35rem 0.85rem;
          border-radius: 50px;
          font-size: 0.8rem;
          font-weight: 600;
          border: 1px solid var(--border-color);
          background: var(--bg-primary);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .filter-chip:hover {
          background: var(--border-color);
          color: var(--text-primary);
        }
        .filter-chip.active {
          border-color: var(--primary-color);
          background: var(--primary-color);
          color: #ffffff;
        }
        .notification-filter-wrap {
          position: relative;
          flex: 1;
          min-width: 200px;
        }
        .notification-search-input {
          width: 100%;
          box-sizing: border-box;
          padding: 0.45rem 3rem 0.45rem 2.2rem;
          border-radius: 50px;
          border: 1px solid var(--border-color);
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: 0.85rem;
          outline: none;
        }
        .notification-filter-toggle {
          position: absolute;
          z-index: 2;
          top: 50%;
          right: 0.42rem;
          display: grid;
          place-items: center;
          width: 2rem;
          height: 2rem;
          padding: 0;
          transform: translateY(-50%);
          border: 1px solid transparent;
          border-radius: 50%;
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          transition: border-color 180ms ease, background 180ms ease, color 180ms ease, transform 180ms ease;
        }
        .notification-filter-toggle:hover,
        .notification-filter-toggle:focus-visible,
        .notification-filter-toggle.active {
          border-color: color-mix(in srgb, var(--primary-color) 24%, transparent);
          background: color-mix(in srgb, var(--primary-color) 12%, transparent);
          color: var(--primary-color);
          outline: none;
        }
        .notification-category-panel {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          max-height: 8rem;
          margin-top: 1rem;
          opacity: 1;
          transform: translateY(0);
          overflow: hidden;
          transition: max-height 220ms ease, margin 220ms ease, opacity 180ms ease, transform 220ms ease;
        }
        .notification-category-panel.filters-closed {
          pointer-events: none;
          max-height: 0;
          margin-top: 0;
          opacity: 0;
          transform: translateY(-0.35rem);
        }
        @media (max-width: 600px) {
          .notifications-panel {
            padding: 0.7rem !important;
          }
          .notifications-header {
            width: 100%;
            flex-wrap: nowrap !important;
            align-items: center !important;
            gap: 0.4rem !important;
            margin-bottom: 0.65rem !important;
          }
          .notifications-heading-wrap {
            flex: 1 1 auto;
            min-width: 0;
          }
          .notifications-title {
            flex-wrap: nowrap;
            gap: 0.3rem !important;
            min-width: 0;
            font-size: clamp(0.95rem, 4.4vw, 1.08rem) !important;
            line-height: 1.15;
            white-space: nowrap;
          }
          .notifications-unread-count {
            flex: 0 0 auto;
            padding: 2px 6px !important;
            font-size: 0.62rem !important;
            white-space: nowrap;
          }
          .notifications-subtitle {
            display: none;
          }
          .notifications-header-actions {
            flex: 0 0 auto;
            gap: 0.18rem !important;
            min-width: 0;
          }
          .notifications-header-actions .btn {
            min-width: 0;
            min-height: 30px !important;
            height: 30px !important;
            padding: 0.22rem 0.36rem !important;
            border-radius: 7px !important;
            font-size: clamp(0.56rem, 2.5vw, 0.64rem) !important;
            line-height: 1;
            white-space: nowrap;
          }
          .notifications-header-actions .btn svg {
            width: 12px;
            height: 12px;
          }
          .notifications-toolbar {
            padding: 0.45rem !important;
            margin-bottom: 0.8rem !important;
            border-radius: 12px !important;
          }
          .notifications-toolbar-row {
            display: flex !important;
            flex-wrap: nowrap !important;
            justify-content: flex-start !important;
            gap: 0.4rem !important;
            width: 100%;
            min-width: 0;
          }
          .notifications-status-toggle {
            flex: 0 0 auto;
            align-items: center;
            gap: 2px !important;
            height: 29px;
            padding: 2px !important;
            border-radius: 8px !important;
            box-sizing: border-box;
          }
          .notifications-status-toggle .filter-chip {
            min-height: 23px;
            height: 23px;
            padding: 0.15rem 0.4rem !important;
            border-radius: 6px !important;
            font-size: 0.62rem !important;
            line-height: 1;
          }
          .notif-row,
          .notif-row.unread {
            display: grid;
            grid-template-columns: 36px minmax(0, 1fr);
            align-items: start;
            gap: 0.75rem;
            width: 100%;
            min-width: 0;
            padding: 0.85rem 0.9rem;
            box-sizing: border-box;
            background: var(--bg-primary);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            box-shadow: none;
          }
          .notif-row.unread::before {
            display: block;
          }
          .notif-card-icon {
            grid-column: 1;
            width: 36px !important;
            height: 36px !important;
            min-width: 36px;
            flex-shrink: 0 !important;
          }
          .notif-card-content {
            grid-column: 2;
            width: 100%;
            min-width: 0 !important;
          }
          .notif-card-heading {
            display: flex !important;
            align-items: flex-start !important;
            justify-content: space-between !important;
            gap: 0.65rem !important;
            min-width: 0;
          }
          .notif-card-title-wrap {
            flex: 1 1 auto;
            min-width: 0;
          }
          .notif-card-title {
            min-width: 0;
            max-width: 100%;
            font-size: 0.9rem !important;
            line-height: 1.35;
            white-space: normal;
            word-break: normal;
            overflow-wrap: anywhere;
          }
          .notif-card-time {
            flex: 0 0 auto;
            flex-shrink: 0 !important;
            margin-left: auto;
            text-align: right;
            white-space: nowrap !important;
          }
          .notif-card-message {
            width: 100%;
            min-width: 0;
            font-size: 0.82rem !important;
            line-height: 1.45 !important;
            overflow-wrap: break-word;
          }
          .notif-card-link {
            align-self: flex-start;
          }
          .notif-actions {
            position: absolute;
            right: 0.65rem;
            bottom: 0.55rem;
            margin: 0;
          }
          .notif-row:focus-within .notif-actions {
            opacity: 1;
          }
          .notification-filter-wrap {
            flex: 1 1 auto;
            flex-basis: auto;
            width: auto;
            min-width: 0;
          }
          .notification-search-input {
            min-width: 0;
            height: 34px;
            padding: 0.38rem 2.35rem 0.38rem 1.9rem;
            font-size: 0.75rem;
          }
          .notification-filter-toggle {
            right: 0.2rem;
            width: 1.8rem;
            height: 1.8rem;
          }
          .notification-category-panel {
            gap: 0.4rem;
            max-height: 12rem;
          }
          .notification-category-panel .filter-chip {
            padding: 0.32rem 0.68rem;
            font-size: 0.74rem;
          }
        }
        .group-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          user-select: none;
          margin-bottom: 1rem;
        }
        .group-header h4 {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0;
        }
        .group-header:hover h4 {
          color: var(--text-primary);
        }
        .group-content {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
      `}} />

      {/* Header */}
      <div className="notifications-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="notifications-heading-wrap">
          <h2 className="notifications-title" style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Notifications
            {unreadCount > 0 && (
              <span className="notifications-unread-count" style={{ fontSize: '0.8rem', background: 'var(--primary-color)', color: '#fff', padding: '2px 8px', borderRadius: '50px', fontWeight: 700 }}>
                {unreadCount} new
              </span>
            )}
          </h2>
          <p className="notifications-subtitle" style={{ color: 'var(--text-secondary)', marginBottom: '0', fontSize: '0.9rem', marginTop: '0.25rem' }}>View and manage your account updates.</p>
        </div>
        <div className="notifications-header-actions" style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleMarkAllAsRead} className="btn btn-secondary btn-sm" disabled={unreadCount === 0} style={{ opacity: unreadCount === 0 ? 0.5 : 1 }}>
            Mark all read
          </button>
          <button onClick={handleClearRead} className="btn btn-secondary btn-sm">
            Clear read
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div ref={categoryFilterRef} className="notifications-toolbar" style={{ display: 'flex', flexDirection: 'column', marginBottom: '2rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
        <div className="notifications-toolbar-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          
          {/* Status Toggles */}
          <div className="notifications-status-toggle" style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-primary)', padding: '4px', borderRadius: '50px', border: '1px solid var(--border-color)' }}>
            <button className={`filter-chip ${statusFilter === 'All' ? 'active' : ''}`} style={{ border: 'none' }} onClick={() => setStatusFilter('All')}>All</button>
            <button className={`filter-chip ${statusFilter === 'Unread' ? 'active' : ''}`} style={{ border: 'none' }} onClick={() => setStatusFilter('Unread')}>Unread</button>
          </div>

          {/* Search */}
          <div className="notification-filter-wrap">
            <input 
              type="text" 
              placeholder="Search notifications..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="notification-search-input"
            />
            <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <button
              type="button"
              onClick={() => setShowCategoryFilters(open => !open)}
              className={`notification-filter-toggle ${showCategoryFilters || categoryFilter !== 'All' ? 'active' : ''}`}
              aria-label={`${showCategoryFilters ? 'Hide' : 'Show'} notification category filters`}
              aria-expanded={showCategoryFilters}
              aria-controls="notification-category-filters"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
            </button>
          </div>
        </div>

        {/* Category Chips */}
        <div
          id="notification-category-filters"
          className={`notification-category-panel ${showCategoryFilters ? 'filters-open animate-fade-in' : 'filters-closed'}`}
          aria-hidden={!showCategoryFilters}
        >
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`filter-chip ${categoryFilter === cat ? 'active' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Notification List / Timeline */}
      {filteredNotifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-color)' }}>
          <svg style={{ margin: '0 auto 1rem', color: 'var(--text-muted)' }} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem', color: 'var(--text-primary)' }}>All caught up!</h3>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>You have no new notifications right now.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxHeight: '65vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
          {Object.entries(groupedNotifications).map(([group, notifs]) => {
            if (notifs.length === 0) return null;
            const isCollapsed = collapsedGroups[group];
            
            return (
              <div key={group}>
                <div className="group-header" onClick={() => toggleGroup(group)}>
                  <svg 
                    width="14" 
                    height="14" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', color: 'var(--text-muted)' }}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                  <h4>{group}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                    {notifs.length}
                  </span>
                </div>
                
                {!isCollapsed && (
                  <div className="group-content">
                    {notifs.map((n) => {
                      const isUnread = n.Read !== true && n.Read !== 'true';
                      const priority = String(n.Priority || 'Low').toLowerCase();
                      const priorityColor = priority === 'high' ? '#ef4444' : priority === 'medium' ? '#f59e0b' : 'var(--text-muted)';

                      return (
                        <div key={n.ID} className={`notif-row ${isUnread ? 'unread' : ''}`}>
                          
                          {/* Icon */}
                          <div className="notif-card-icon" style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--text-primary)' }}>
                            {getCategoryIcon(n.Category)}
                          </div>

                          {/* Content */}
                          <div className="notif-card-content" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <div className="notif-card-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                              <div className="notif-card-title-wrap" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <h5 className="notif-card-title" style={{ margin: 0, fontSize: '0.95rem', fontWeight: isUnread ? 700 : 600, color: 'var(--text-primary)' }}>{n.Title}</h5>
                                {priority !== 'low' && (
                                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: priorityColor }} title={`${priority} priority`} />
                                )}
                              </div>
                              <span className="notif-card-time" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                {getTimeAgo(n.CreatedAt || n.Timestamp)}
                              </span>
                            </div>
                            
                            <p className="notif-card-message" style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {n.Message}
                              {n.Title?.toLowerCase().includes('inquiry reviewed') && ' Our team will contact you shortly.'}
                            </p>

                            {n.ActionLink && !n.Title?.toLowerCase().includes('inquiry reviewed') && (
                              <div className="notif-card-link" style={{ marginTop: '0.5rem' }}>
                                <button
                                  onClick={(e) => {
                                    if (isUnread) handleMarkAsRead(n.ID);
                                    router.push(n.ActionLink);
                                  }}
                                  style={{ background: 'none', border: 'none', padding: 0, color: 'var(--primary-color)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                >
                                  View Details <span style={{ fontSize: '1rem', lineHeight: 1 }}>→</span>
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Quick Actions (Hover) */}
                          <div className="notif-actions">
                            {isUnread && (
                              <button className="notif-btn" onClick={() => handleMarkAsRead(n.ID)} title="Mark as read">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                              </button>
                            )}
                            <button className="notif-btn delete" onClick={() => handleDelete(n.ID)} title="Delete">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                            </button>
                          </div>

                        </div>
                      );
                    })}
                  </div>
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
