'use client';

import React from 'react';
import type { CancellationRequest, Inquiry, Notification, OrderRecord } from '@/types/cms';
import { getActionableAdminUpdates } from '../utils/liveAdminEvents';

type LiveEventsBarProps = {
  notifications: Notification[];
  orders: OrderRecord[];
  inquiries: Inquiry[];
  cancellationRequests: CancellationRequest[];
  onNavigate?: (tab: string) => void;
  onOpenCancellationRequests: () => void;
};

export default function LiveEventsBar({
  notifications,
  orders,
  inquiries,
  cancellationRequests,
  onNavigate,
  onOpenCancellationRequests,
}: LiveEventsBarProps) {
  const [liveUpdateIndex, setLiveUpdateIndex] = React.useState(0);
  const [isHoveringUpdate, setIsHoveringUpdate] = React.useState(false);
  const adminUpdates = React.useMemo(
    () => getActionableAdminUpdates(notifications, orders, inquiries, cancellationRequests),
    [cancellationRequests, inquiries, notifications, orders],
  );
  const currentLiveUpdate = adminUpdates.length ? adminUpdates[liveUpdateIndex % adminUpdates.length] : null;

  React.useEffect(() => {
    if (adminUpdates.length <= 1 || isHoveringUpdate) return;
    const interval = window.setInterval(() => {
      setLiveUpdateIndex((index) => (index + 1) % adminUpdates.length);
    }, 3000);
    return () => window.clearInterval(interval);
  }, [adminUpdates.length, isHoveringUpdate]);

  const openLiveUpdate = (actionLink?: string) => {
    if (!actionLink || !onNavigate) return;
    if (actionLink === 'orders:cancellations') {
      onOpenCancellationRequests();
      return;
    }
    const tab = actionLink.split(':')[0];
    if (['dashboard', 'orders', 'products', 'banners', 'faqs', 'inquiries', 'users', 'settings'].includes(tab)) {
      onNavigate(tab);
    }
  };

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return '';
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const getUpdateTypeColor = (type?: string) => {
    const value = type?.toLowerCase() || '';
    if (value.includes('order')) return { bg: 'rgba(37, 99, 235, 0.15)', color: '#2563eb' };
    if (value.includes('cancellation')) return { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' };
    if (value.includes('user')) return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' };
    if (value.includes('inquiry')) return { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' };
    return { bg: 'rgba(100, 116, 139, 0.15)', color: '#64748b' };
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .live-updates-container { display:flex; align-items:center; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:0.75rem 1rem; box-shadow:var(--shadow-sm); position:relative; overflow:hidden; min-height:48px; cursor:pointer; transition:all var(--transition-normal); }
        .live-updates-container:hover { box-shadow:var(--shadow-md); border-color:var(--primary-color); }
        .live-update-pulse { width:8px; height:8px; background-color:var(--primary-color); border-radius:50%; margin-right:12px; animation:livePulse 2s infinite; flex-shrink:0; }
        @keyframes livePulse { 0% { transform:scale(0.95); box-shadow:0 0 0 0 rgba(37,99,235,0.7); } 70% { transform:scale(1); box-shadow:0 0 0 6px rgba(37,99,235,0); } 100% { transform:scale(0.95); box-shadow:0 0 0 0 rgba(37,99,235,0); } }
        .live-update-content { display:flex; flex:1; align-items:center; overflow:hidden; }
        .live-update-slide { display:flex; align-items:center; flex:1; min-width:0; animation:slideUp 0.4s cubic-bezier(0.4,0,0.2,1); }
        @keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .live-update-type { font-size:0.7rem; font-weight:700; text-transform:uppercase; padding:0.15rem 0.5rem; border-radius:var(--radius-sm); margin-right:12px; flex-shrink:0; letter-spacing:0.05em; }
        .live-update-text { font-size:0.9rem; font-weight:500; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1; }
        .live-update-meta { display:flex; align-items:center; gap:16px; flex-shrink:0; margin-left:12px; }
        .live-update-time { font-size:0.75rem; color:var(--text-muted); font-weight:500; }
        .live-update-action { font-size:0.8rem; font-weight:600; color:var(--primary-color); display:flex; align-items:center; gap:4px; }
        .live-updates-container:hover .live-update-action { text-decoration:underline; }
        @media (prefers-reduced-motion: reduce) { .live-update-pulse, .live-update-slide { animation:none; } }
      ` }} />
      <div
        className="live-updates-container"
        onClick={() => openLiveUpdate(currentLiveUpdate?.ActionLink)}
        onMouseEnter={() => setIsHoveringUpdate(true)}
        onMouseLeave={() => setIsHoveringUpdate(false)}
      >
        <div className="live-update-pulse" />
        <div className="live-update-content">
          {currentLiveUpdate ? (
            <div key={liveUpdateIndex} className="live-update-slide">
              <span
                className="live-update-type"
                style={{
                  backgroundColor: getUpdateTypeColor(currentLiveUpdate.EventType || currentLiveUpdate.Title).bg,
                  color: getUpdateTypeColor(currentLiveUpdate.EventType || currentLiveUpdate.Title).color,
                }}
              >
                {currentLiveUpdate.EventType || 'Update'}
              </span>
              <span className="live-update-text">
                <span style={{ fontWeight: 600, marginRight: '8px' }}>{currentLiveUpdate.Title}:</span>
                {currentLiveUpdate.Message}
              </span>
              <div className="live-update-meta">
                <span className="live-update-time">{getTimeAgo(currentLiveUpdate.Timestamp)}</span>
                <span className="live-update-action">
                  Open
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </span>
              </div>
            </div>
          ) : (
            <div className="live-update-slide">
              <span className="live-update-text">No recent live updates at this time.</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
