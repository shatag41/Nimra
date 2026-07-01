import React, { useState } from 'react';
import { Notification, NotificationCategory } from '@/types/cms';

interface NotificationsTabProps {
  filteredNotifications: Notification[];
  handleSendNotif: (title: string, message: string, extra?: Partial<Notification>) => Promise<boolean>;
  handleNotifDelete: (id: string | number) => Promise<boolean>;
  saveLoading: boolean;
  setActiveTab?: (tab: any) => void;
}

export default function NotificationsTab({
  filteredNotifications,
  handleSendNotif,
  handleNotifDelete,
  saveLoading,
  setActiveTab,
}: NotificationsTabProps) {
  // Broadcast fields
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifCategory, setNotifCategory] = useState<NotificationCategory>('System Alerts');
  const [notifPriority, setNotifPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [notifRole, setNotifRole] = useState<'Admin' | 'Customer' | 'All'>('All');
  const [notifActionLink, setNotifActionLink] = useState('');

  // Local log filtering fields
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');

  const categories: NotificationCategory[] = [
    'Orders',
    'Cancellation Requests',
    'Inquiries',
    'Users',
    'Products',
    'Offers/Promotions',
    'Inventory',
    'System Alerts',
    'Settings',
    'Delivery Updates',
    'Payments',
    'Account Updates'
  ];

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle || !notifMessage) return;

    const extra: Partial<Notification> = {
      Category: notifCategory,
      Priority: notifPriority,
      Role: notifRole,
      ActionLink: notifActionLink || undefined,
    };

    const success = await handleSendNotif(notifTitle, notifMessage, extra);
    if (success) {
      setNotifTitle('');
      setNotifMessage('');
      setNotifActionLink('');
      setNotifCategory('System Alerts');
      setNotifPriority('Medium');
      setNotifRole('All');
    }
  };

  // Filter logs locally
  const displayedNotifications = filteredNotifications.filter((n) => {
    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (
        !String(n.Title || '').toLowerCase().includes(q) &&
        !String(n.Message || '').toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    // 2. Category
    if (categoryFilter !== 'All') {
      if (String(n.Category || '').toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }
    }
    // 3. Priority
    if (priorityFilter !== 'All') {
      if (String(n.Priority || 'Low').toLowerCase() !== priorityFilter.toLowerCase()) {
        return false;
      }
    }
    // 4. Role
    if (roleFilter !== 'All') {
      if (String(n.Role || 'All').toLowerCase() !== roleFilter.toLowerCase()) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="notifications-tab card glass" style={{ padding: '2rem' }}>
      <div className="notif-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
        
        {/* Sender Panel */}
        <form className="notif-sender-panel glass-inner" onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '1.5rem', borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', height: 'fit-content' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Log & Broadcast Notification</h3>
          
          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Notification Title</label>
            <input
              required
              type="text"
              value={notifTitle}
              onChange={(e) => setNotifTitle(e.target.value)}
              placeholder="e.g. Scheduled Maintenance, Store Updates"
              style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Message Content</label>
            <textarea
              required
              rows={3}
              value={notifMessage}
              onChange={(e) => setNotifMessage(e.target.value)}
              placeholder="Broadcast message text..."
              style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Category</label>
              <select
                value={notifCategory}
                onChange={(e) => setNotifCategory(e.target.value as any)}
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Priority</label>
              <select
                value={notifPriority}
                onChange={(e) => setNotifPriority(e.target.value as any)}
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Target Audience</label>
              <select
                value={notifRole}
                onChange={(e) => setNotifRole(e.target.value as any)}
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              >
                <option value="All">All Users</option>
                <option value="Admin">Admins Only</option>
                <option value="Customer">Customers Only</option>
              </select>
            </div>

            <div className="form-group">
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Action Link / Tab Tag</label>
              <input
                type="text"
                value={notifActionLink}
                onChange={(e) => setNotifActionLink(e.target.value)}
                placeholder="e.g. orders, inquiries, /portal"
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full mt-2" disabled={saveLoading}>
            📢 Log & Broadcast Notification
          </button>
        </form>

        {/* Notifications History Log */}
        <div className="notif-logs-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Sent Notifications Log</h3>

          {/* Redesigned Search & Filters Header */}
          <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input
              type="text"
              placeholder="Search logs by text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.8rem' }}
                >
                  <option value="All">All Categories</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>Priority</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.8rem' }}
                >
                  <option value="All">All Priorities</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>Role</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.8rem' }}
                >
                  <option value="All">All Roles</option>
                  <option value="All">Broadcast (All)</option>
                  <option value="Admin">Admin Only</option>
                  <option value="Customer">Customer Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Logs List */}
          <div className="logs-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '550px', overflowY: 'auto', paddingRight: '0.25rem' }}>
            {displayedNotifications.map((n, idx) => {
              const priority = String(n.Priority || 'Low').toLowerCase();
              const badgeColor = priority === 'high' ? '#ef4444' : priority === 'medium' ? '#f59e0b' : '#3b82f6';
              const badgeBg = priority === 'high' ? 'rgba(239, 68, 68, 0.08)' : priority === 'medium' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(59, 130, 246, 0.08)';

              return (
                <div key={`${n.ID}-${idx}`} className="log-item glass-inner" style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div className="log-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        {n.Category && (
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'var(--border-color)', color: 'var(--text-primary)' }}>
                            {n.Category}
                          </span>
                        )}
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: badgeBg, color: badgeColor }}>
                          {n.Priority || 'Low'}
                        </span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
                          Target: {n.Role || 'All'}
                        </span>
                      </div>
                      <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{n.Title}</strong>
                    </div>
                    <button className="btn-delete-log" onClick={() => void handleNotifDelete(n.ID)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}>✕</button>
                  </div>
                  <span className="log-time" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(n.Timestamp || n.CreatedAt || '').toLocaleString()}</span>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{n.Message}</p>
                  
                  {/* Action Link Action Button */}
                  {n.ActionLink && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <button
                        onClick={() => {
                          if (setActiveTab) {
                            const link = String(n.ActionLink).trim().toLowerCase();
                            // If it's one of our dashboard tabs, change active tab
                            if (['dashboard', 'orders', 'products', 'banners', 'faqs', 'inquiries', 'users', 'notifications', 'settings'].includes(link)) {
                              setActiveTab(link as any);
                            } else if (link === 'inquiry') {
                              setActiveTab('inquiries');
                            } else if (link === 'product') {
                              setActiveTab('products');
                            } else {
                              // Standard routing
                              window.location.href = n.ActionLink!;
                            }
                          }
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                      >
                        Action: Go to {n.ActionLink} →
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {displayedNotifications.length === 0 && (
              <p className="empty" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>No notifications found matching filters.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

