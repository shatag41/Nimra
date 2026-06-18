import React, { useState } from 'react';
import { Notification } from '@/types/cms';

interface NotificationsTabProps {
  filteredNotifications: Notification[];
  handleSendNotif: (title: string, message: string) => Promise<boolean>;
  handleNotifDelete: (id: string | number) => Promise<boolean>;
  saveLoading: boolean;
}

export default function NotificationsTab({
  filteredNotifications,
  handleSendNotif,
  handleNotifDelete,
  saveLoading,
}: NotificationsTabProps) {
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle || !notifMessage) return;
    const success = await handleSendNotif(notifTitle, notifMessage);
    if (success) {
      setNotifTitle('');
      setNotifMessage('');
    }
  };

  return (
    <div className="notifications-tab card glass">
      <div className="notif-grid">
        {/* Sender Panel */}
        <form className="notif-sender-panel glass-inner" onSubmit={onSubmit}>
          <h3>Broadcast System Update</h3>
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Notification Title</label>
            <input
              required
              type="text"
              value={notifTitle}
              onChange={(e) => setNotifTitle(e.target.value)}
              placeholder="e.g. Scheduled Maintenance, Store Updates"
            />
          </div>
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Message Content</label>
            <textarea
              required
              rows={4}
              value={notifMessage}
              onChange={(e) => setNotifMessage(e.target.value)}
              placeholder="Broadcast message text..."
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '1.25rem', width: '100%' }} disabled={saveLoading}>
            📢 Log notification
          </button>
        </form>

        {/* Notifications History Log */}
        <div className="notif-logs-panel">
          <h3>Sent Notifications Log</h3>
          <div className="logs-list">
            {filteredNotifications.map((n, idx) => (
              <div key={`${n.ID}-${idx}`} className="log-item glass-inner">
                <div className="log-header">
                  <strong>{n.Title}</strong>
                  <button className="btn-delete-log" onClick={() => void handleNotifDelete(n.ID)}>✕</button>
                </div>
                <span className="log-time">{new Date(n.Timestamp).toLocaleString()}</span>
                <p>{n.Message}</p>
              </div>
            ))}
            {filteredNotifications.length === 0 && (
              <p className="empty">No notifications found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
