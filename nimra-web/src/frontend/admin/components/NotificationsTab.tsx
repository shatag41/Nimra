import React, { useState } from 'react';
import { Notification, NotificationCategory } from '@/types/cms';

interface NotificationsTabProps {
  filteredNotifications: Notification[];
  handleSendNotif: (title: string, message: string, extra?: Partial<Notification>) => Promise<boolean>;
  handleNotifDelete: (id: string | number) => Promise<boolean>;
  saveLoading: boolean;
}

const categories: NotificationCategory[] = ['Offers/Promotions', 'News', 'Updates'];

export default function NotificationsTab({
  filteredNotifications,
  handleSendNotif,
  handleNotifDelete,
  saveLoading,
}: NotificationsTabProps) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<NotificationCategory>('Offers/Promotions');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  const broadcasts = filteredNotifications.filter((notification) => {
    if (notification.TargetAudience !== 'CUSTOMER_NOTIFICATION' || notification.EventType !== 'ADMIN_BROADCAST') return false;
    if (!categories.includes(notification.Category as NotificationCategory)) return false;
    const query = search.trim().toLowerCase();
    if (query && !`${notification.Title} ${notification.Message}`.toLowerCase().includes(query)) return false;
    if (categoryFilter !== 'All' && notification.Category !== categoryFilter) return false;
    if (priorityFilter !== 'All' && (notification.Priority || 'Low') !== priorityFilter) return false;
    return true;
  });

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !message.trim()) return;
    const success = await handleSendNotif(title.trim(), message.trim(), {
      Category: category,
      Priority: priority,
      Role: 'Customer',
      TargetAudience: 'CUSTOMER_NOTIFICATION',
      EventType: 'ADMIN_BROADCAST',
      ActionLink: '',
    });
    if (success) {
      setTitle('');
      setMessage('');
      setCategory('Offers/Promotions');
      setPriority('Medium');
    }
  };

  const fieldStyle: React.CSSProperties = {
    width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)',
  };

  return (
    <div className="notifications-tab card glass" style={{ padding: '2rem' }}>
      <div className="notif-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '1.5rem', borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', height: 'fit-content' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Customer Broadcast</h3>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Title</label>
            <input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Summer Offer, Product News" style={fieldStyle} />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Message</label>
            <textarea required rows={4} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Message for customers" style={fieldStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Category</label>
              <select value={category} onChange={(event) => setCategory(event.target.value as NotificationCategory)} style={fieldStyle}>
                {categories.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Priority</label>
              <select value={priority} onChange={(event) => setPriority(event.target.value as typeof priority)} style={fieldStyle}>
                <option>High</option><option>Medium</option><option>Low</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={saveLoading}>Send to Customers</button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Customer Broadcast History</h3>
          <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.5rem' }}>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search broadcasts" style={fieldStyle} />
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} style={fieldStyle}>
              <option value="All">All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}
            </select>
            <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} style={fieldStyle}>
              <option value="All">All priorities</option><option>High</option><option>Medium</option><option>Low</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '550px', overflowY: 'auto' }}>
            {broadcasts.map((notification) => (
              <div key={String(notification.ID)} style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'var(--border-color)' }}>{notification.Category}</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'var(--bg-primary)' }}>{notification.Priority || 'Low'}</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'var(--bg-primary)' }}>Customers</span>
                    </div>
                    <strong>{notification.Title}</strong>
                  </div>
                  <button aria-label="Delete broadcast" onClick={() => void handleNotifDelete(notification.ID)} style={{ background: 'none', border: 0, color: 'var(--text-muted)', cursor: 'pointer' }}>X</button>
                </div>
                <span style={{ display: 'block', marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(notification.Timestamp || notification.CreatedAt || '').toLocaleString()}</span>
                <p style={{ margin: '0.6rem 0 0', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{notification.Message}</p>
              </div>
            ))}
            {!broadcasts.length && <p className="empty" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>No customer broadcasts found.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
