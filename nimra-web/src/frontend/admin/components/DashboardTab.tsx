import React, { useState } from 'react';
import { OrderRecord, Inquiry, CancellationRequest, Product, AdminUser, Notification } from '@/types/cms';
import { formatCurrency } from '@/frontend/customer/utils/commerce';
import { calculateDonutStats, formatDateLabel } from '../utils/chartUtils';
import { useNotification } from '@/frontend/customer/contexts/NotificationContext';
import LogoutConfirmationModal from '@/frontend/customer/components/LogoutConfirmationModal';

interface DashboardTabProps {
  orders: OrderRecord[];
  products: Product[];
  users: AdminUser[];
  filteredInquiries: Inquiry[];
  filteredOrders: OrderRecord[];
  cancellationRequests: CancellationRequest[];
  onReviewCancellation: (requestId: string, decision: 'Approved' | 'Rejected', adminRemarks: string) => Promise<boolean>;
  onOpenCancellationRequests: () => void;
  setActiveTab?: (tab: any) => void;
  notifications?: Notification[];
  onNavigateToOrdersWithFilter?: (statusFilter: string, view: 'active' | 'cancellations', startDate?: string) => void;
}

const DashboardTab = React.memo(function DashboardTab({
  orders,
  products,
  users,
  filteredInquiries,
  filteredOrders,
  cancellationRequests,
  onReviewCancellation,
  onOpenCancellationRequests,

  setActiveTab,
  notifications = [],
  onNavigateToOrdersWithFilter,
}: DashboardTabProps) {
  const { notify } = useNotification();
  const [remarksByRequest, setRemarksByRequest] = useState<Record<string, string>>({});
  const [liveUpdateIndex, setLiveUpdateIndex] = useState(0);
  const [isHoveringUpdate, setIsHoveringUpdate] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month'>('week');
  const [hoveredTrendPoint, setHoveredTrendPoint] = useState<any | null>(null);
  const [hoveredBar, setHoveredBar] = useState<any | null>(null);
  const [showPriorityAlerts, setShowPriorityAlerts] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin_show_priority_alerts');
      return saved !== 'false';
    }
    return true;
  });
  const adminUpdates = notifications.filter((event) => event.TargetAudience === 'ADMIN_UPDATE');
  const currentLiveUpdate = adminUpdates.length ? adminUpdates[liveUpdateIndex % adminUpdates.length] : null;

  React.useEffect(() => {
    if (adminUpdates.length <= 1 || isHoveringUpdate) return;
    const interval = window.setInterval(() => {
      setLiveUpdateIndex((index) => (index + 1) % adminUpdates.length);
    }, 3000);
    return () => window.clearInterval(interval);
  }, [adminUpdates.length, isHoveringUpdate]);

  const openLiveUpdate = (actionLink?: string) => {
    if (!actionLink || !setActiveTab) return;
    if (actionLink === 'orders:cancellations') {
      onOpenCancellationRequests();
      return;
    }
    const tab = actionLink.split(':')[0];
    if (['dashboard', 'orders', 'products', 'banners', 'faqs', 'inquiries', 'users', 'settings'].includes(tab)) {
      setActiveTab(tab);
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
    const t = type?.toLowerCase() || '';
    if (t.includes('order')) return { bg: 'rgba(37, 99, 235, 0.15)', color: '#2563eb' };
    if (t.includes('cancellation')) return { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' };
    if (t.includes('user')) return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' };
    if (t.includes('inquiry')) return { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' };
    return { bg: 'rgba(100, 116, 139, 0.15)', color: '#64748b' };
  };
  
  // Confirmation Modal State
  const [confirmAction, setConfirmAction] = useState<{request: CancellationRequest, decision: 'Approved' | 'Rejected'} | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Time-filtering calculation setup
  const now = new Date();
  let filterStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // default week
  if (timeFilter === 'today') {
    filterStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (timeFilter === 'month') {
    filterStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const formatDateForInput = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // General metrics calculations (filtered by selected time filter)
  const filteredOrdersInWindow = orders.filter(o => {
    const d = new Date(o.createdAt || o.updatedAt || now);
    return d >= filterStartDate;
  });

  const deliveredOrders = orders.filter(o => o.status === 'Delivered');
  const filteredDeliveredOrdersInWindow = deliveredOrders.filter(o => {
    const d = new Date(o.createdAt || o.updatedAt || now);
    return d >= filterStartDate;
  });

  const totalRevenue = filteredDeliveredOrdersInWindow.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const avgOrderValue = filteredDeliveredOrdersInWindow.length > 0 ? totalRevenue / filteredDeliveredOrdersInWindow.length : 0;

  const customerOrdersMap = new Map<string, number>();
  filteredOrdersInWindow.forEach(o => {
    if (o.customer?.mobile) {
      customerOrdersMap.set(o.customer.mobile, (customerOrdersMap.get(o.customer.mobile) || 0) + 1);
    }
  });
  const totalCustomers = customerOrdersMap.size;

  // CUSTOMER ACTIVITY DASHBOARD DATA GENERATION (Excluding cancellations and cancellation requests)
  const activeOrders = orders.filter(o => 
    o.status !== 'Cancelled' && 
    o.cancellationStatus !== 'Pending' && 
    o.cancellationStatus !== 'Approved'
  );

  const filteredActiveOrders = activeOrders.filter(o => {
    const d = new Date(o.createdAt || o.updatedAt || now);
    return d >= filterStartDate;
  });

  const activeCustomersMap = new Map<string, number>();
  filteredActiveOrders.forEach(o => {
    if (o.customer?.mobile) {
      activeCustomersMap.set(o.customer.mobile, (activeCustomersMap.get(o.customer.mobile) || 0) + 1);
    }
  });
  const activeCustomers = activeCustomersMap.size;

  const filteredInquiriesInWindow = filteredInquiries.filter(i => {
    const d = new Date(i.Timestamp || now);
    return d >= filterStartDate;
  });

  // Identify new customers (Users registered in filter window - fallback is ID timestamp)
  const newCustomersInWindow = users.filter(u => {
    if (u.Role !== 'Customer') return false;
    if (typeof u.ID === 'number' && u.ID > 1000000000000) {
      const d = new Date(u.ID);
      return d >= filterStartDate;
    }
    return false;
  });

  // Calculate Most Purchased Products in active orders within selected window
  const productSalesMap = new Map<string, { id: string, count: number, name: string, price: number, img: string }>();
  filteredActiveOrders.forEach(o => {
    (o.items || []).forEach(item => {
      const key = item.productId || item.name;
      const current = productSalesMap.get(key) || { id: key, count: 0, name: item.name, price: item.price, img: item.imageUrl };
      current.count += item.quantity || 0;
      productSalesMap.set(key, current);
    });
  });
  const mostPurchasedProducts = Array.from(productSalesMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  // Calculate Top Customers in active orders within selected window
  const customerSpendMap = new Map<string, { name: string, mobile: string, totalSpend: number, orderCount: number }>();
  filteredActiveOrders.forEach(o => {
    const mobile = o.customer?.mobile || 'Unknown';
    const name = o.customer?.name || 'Guest Customer';
    const current = customerSpendMap.get(mobile) || { name, mobile, totalSpend: 0, orderCount: 0 };
    current.totalSpend += Number(o.total || 0);
    current.orderCount += 1;
    customerSpendMap.set(mobile, current);
  });
  const topCustomers = Array.from(customerSpendMap.values())
    .sort((a, b) => b.totalSpend - a.totalSpend)
    .slice(0, 4);

  // Recent orders sorted by date
  const sortedRecentActiveOrders = [...filteredActiveOrders]
    .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
    .slice(0, 5);

  // Customer Growth & Order Trends Line Chart calculations (7 intervals)
  const chartPointsCount = 7;
  const timeSpan = now.getTime() - filterStartDate.getTime();
  const intervalMs = timeSpan / chartPointsCount;

  const trendPoints = Array.from({ length: chartPointsCount }).map((_, idx) => {
    const pStart = new Date(filterStartDate.getTime() + idx * intervalMs);
    const pEnd = new Date(filterStartDate.getTime() + (idx + 1) * intervalMs);
    
    const intervalOrders = filteredActiveOrders.filter(o => {
      const d = new Date(o.createdAt || o.updatedAt || now);
      return d >= pStart && d < pEnd;
    });

    const intervalSignups = newCustomersInWindow.filter(u => {
      if (typeof u.ID === 'number' && u.ID > 1000000000000) {
        const d = new Date(u.ID);
        return d >= pStart && d < pEnd;
      }
      return false;
    });

    let label = '';
    if (timeFilter === 'today') {
      label = pStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      label = pStart.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }

    return {
      label,
      orders: intervalOrders.length,
      signups: intervalSignups.length,
      revenue: intervalOrders.reduce((sum, o) => sum + Number(o.total || 0), 0)
    };
  });

  // Calculate SVG line paths
  const maxVal = Math.max(...trendPoints.map(p => Math.max(p.orders, p.signups)), 3);
  const chartWidth = 460;
  const chartHeight = 120;
  const xOffset = 30;
  const yOffset = 10;
  const points = trendPoints.map((p, idx) => {
    const x = xOffset + (idx / (chartPointsCount - 1)) * (chartWidth - xOffset - 10);
    const yOrders = chartHeight - yOffset - (p.orders / maxVal) * (chartHeight - yOffset - 15);
    const ySignups = chartHeight - yOffset - (p.signups / maxVal) * (chartHeight - yOffset - 15);
    return { x, yOrders, ySignups, ...p };
  });

  const ordersLinePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.yOrders}`).join(' ');
  const signupsLinePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.ySignups}`).join(' ');

  // Peak Ordering Hours calculations (grouped by hour categories)
  const hourCounts = Array.from({ length: 24 }, () => 0);
  activeOrders.forEach(o => {
    const d = new Date(o.createdAt || o.updatedAt || now);
    const hour = d.getHours();
    hourCounts[hour] += 1;
  });

  const peakHourBlocks = [
    { name: 'Late Night (12am-6am)', count: 0, hours: [0, 1, 2, 3, 4, 5] },
    { name: 'Morning (6am-11am)', count: 0, hours: [6, 7, 8, 9, 10] },
    { name: 'Noon (11am-2pm)', count: 0, hours: [11, 12, 13] },
    { name: 'Afternoon (2pm-5pm)', count: 0, hours: [14, 15, 16] },
    { name: 'Evening (5pm-9pm)', count: 0, hours: [17, 18, 19, 20] },
    { name: 'Night (9pm-12am)', count: 0, hours: [21, 22, 23] }
  ];
  peakHourBlocks.forEach(block => {
    block.count = block.hours.reduce((sum, h) => sum + hourCounts[h], 0);
  });

  // Bar chart layout calculations
  const maxBarVal = Math.max(...peakHourBlocks.map(b => b.count), 2);
  const barChartWidth = 460;
  const barChartHeight = 120;
  const barXOffset = 40;
  const barWidth = 40;
  const barGap = 25;

  const barData = peakHourBlocks.map((b, idx) => {
    const x = barXOffset + idx * (barWidth + barGap);
    const h = (b.count / maxBarVal) * (barChartHeight - 35);
    const y = barChartHeight - 25 - h;
    return { x, y, h, ...b };
  });

  // Priority Alerts calculations
  const unconfirmedOrdersAlertCount = filteredOrdersInWindow.filter(o => o.status === 'Pending').length;
  const inTransitOrdersAlertCount = filteredOrdersInWindow.filter(o => o.status !== 'Pending' && o.status !== 'Cancelled').length;
  const failedDeliveriesAlertCount = filteredOrdersInWindow.filter(o => o.status === 'Cancelled' || o.cancellationStatus === 'Approved').length;
  const newInquiriesAlertCount = filteredInquiriesInWindow.filter(i => !i.Status || i.Status === 'New').length;
  const newRegistrationsAlertCount = newCustomersInWindow.length;
  const pendingCancellationRequests = cancellationRequests.filter((request) => {
    const d = new Date(request.requestDate || now);
    return d >= filterStartDate && request.status === 'Pending';
  });

  const pendingActionsCount = 
    inTransitOrdersAlertCount + 
    unconfirmedOrdersAlertCount + 
    failedDeliveriesAlertCount +
    newInquiriesAlertCount + 
    pendingCancellationRequests.length;

  const initiateReview = (request: CancellationRequest, decision: 'Approved' | 'Rejected') => {
    setConfirmAction({ request, decision });
  };

  const executeReview = async () => {
    if (!confirmAction) return;
    setIsProcessingAction(true);
    try {
      const { request, decision } = confirmAction;
      const success = await onReviewCancellation(request.requestId, decision, remarksByRequest[request.requestId] || '');
      if (success) {
        setRemarksByRequest((prev) => {
          const next = { ...prev };
          delete next[request.requestId];
          return next;
        });
        notify.success('Request Processed', `Successfully ${decision.toLowerCase()} request.`);
      } else {
        notify.error('Request Failed', `Failed to process request.`);
      }
    } catch (e) {
      notify.error('Request Error', `Error processing request.`);
    } finally {
      setIsProcessingAction(false);
      setConfirmAction(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending': return 'badge-orange';
      case 'Confirmed': return 'badge-confirmed';
      case 'Processing': return 'badge-processing';
      case 'Dispatched': return 'badge-dispatched';
      case 'Out for Delivery': return 'badge-out';
      case 'Delivered': return 'badge-primary';
      case 'Cancelled': return 'badge-cancelled';
      default: return 'badge-secondary';
    }
  };

  return (
    <div className="overview-tab customer-activity-dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes alertPulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { transform: scale(1.02); box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .critical-alert-pulse {
          animation: alertPulse 2s infinite ease-in-out;
        }
        .alert-card-interactive {
          transition: all 0.2s ease-in-out;
          cursor: pointer;
        }
        .alert-card-interactive:hover {
          transform: translateY(-2px);
          filter: brightness(1.05);
        }
        .stat-card {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 20px -8px rgba(0, 0, 0, 0.15) !important;
          border-color: var(--primary-color) !important;
        }
        .card-pending-actions:hover {
          border-color: #ef4444 !important;
          box-shadow: 0 12px 20px -8px rgba(239, 68, 68, 0.15) !important;
        }
        .active-kpi-border {
          border-color: #ef4444 !important;
          box-shadow: 0 4px 12px -2px rgba(239, 68, 68, 0.12) !important;
        }
        .live-updates-container {
          display: flex;
          align-items: center;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 0.75rem 1rem;
          box-shadow: var(--shadow-sm);
          position: relative;
          overflow: hidden;
          min-height: 48px;
          cursor: pointer;
          transition: all var(--transition-normal);
        }
        .live-updates-container:hover {
          box-shadow: var(--shadow-md);
          border-color: var(--primary-color);
        }
        .live-update-pulse {
          width: 8px;
          height: 8px;
          background-color: var(--primary-color);
          border-radius: 50%;
          margin-right: 12px;
          animation: livePulse 2s infinite;
          flex-shrink: 0;
        }
        @keyframes livePulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(37, 99, 235, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
        }
        .live-update-content {
          display: flex;
          flex: 1;
          align-items: center;
          overflow: hidden;
        }
        .live-update-slide {
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 0;
          animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .live-update-type {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          padding: 0.15rem 0.5rem;
          border-radius: var(--radius-sm);
          margin-right: 12px;
          flex-shrink: 0;
          letter-spacing: 0.05em;
        }
        .live-update-text {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
        }
        .live-update-meta {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-shrink: 0;
          margin-left: 12px;
        }
        .live-update-time {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 500;
        }
        .live-update-action {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--primary-color);
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .live-updates-container:hover .live-update-action {
          text-decoration: underline;
        }
      ` }} />

      {/* 1. Main Dashboard Header with Period Filters */}
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
                  color: getUpdateTypeColor(currentLiveUpdate.EventType || currentLiveUpdate.Title).color 
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
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', width: '100%' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.65rem', color: 'var(--text-primary)' }}>
            Customer Activity Dashboard
          </h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Live enterprise e-commerce metrics, order trends, and customer analytics.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          {(['today', 'week', 'month'] as const).map(filter => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: timeFilter === filter ? 'var(--primary-color)' : 'transparent',
                color: timeFilter === filter ? '#ffffff' : 'var(--text-secondary)',
                transition: 'all 0.15s ease'
              }}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Overview Stats Cards (4 KPI Cards at the top) */}
      <div className="stats-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '1.5rem', 
        width: '100%' 
      }}>
        <div className="stat-card glass card-revenue" style={{ 
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '1.25rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          minHeight: '120px'
        }}>
          <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '0.5rem' }}>
            <span className="stat-label" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Revenue</span>
            <div className="stat-icon" style={{ color: 'var(--primary-color)', display: 'flex', alignItems: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
          </div>
          <strong className="stat-val" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{formatCurrency(totalRevenue)}</strong>
          <span className="stat-desc" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>From completed deliveries</span>
        </div>
        
        <div className="stat-card glass card-orders" style={{ 
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '1.25rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          minHeight: '120px'
        }}>
          <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '0.5rem' }}>
            <span className="stat-label" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Orders</span>
            <div className="stat-icon" style={{ color: 'var(--primary-color)', display: 'flex', alignItems: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0"/></svg>
            </div>
          </div>
          <strong className="stat-val" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{filteredOrdersInWindow.length}</strong>
          <span className="stat-desc" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>All tracking statuses</span>
        </div>

        <div 
          className={`stat-card glass card-pending-actions ${showPriorityAlerts ? 'active-kpi-border' : ''}`} 
          style={{ 
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '1.25rem',
            borderRadius: 'var(--radius-lg)',
            border: showPriorityAlerts ? '1px solid #ef4444' : '1px solid var(--border-color)',
            background: showPriorityAlerts ? 'rgba(239, 68, 68, 0.03)' : 'var(--bg-secondary)',
            cursor: 'pointer',
            minHeight: '120px'
          }}
          onClick={() => {
            const nextVal = !showPriorityAlerts;
            setShowPriorityAlerts(nextVal);
            if (typeof window !== 'undefined') {
              localStorage.setItem('admin_show_priority_alerts', String(nextVal));
            }
          }}
        >
          <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '0.5rem' }}>
            <span className="stat-label" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Pending Actions</span>
            <div className="stat-icon" style={{ color: pendingActionsCount > 0 ? '#ef4444' : 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
          </div>
          <strong className="stat-val" style={{ fontSize: '1.75rem', fontWeight: 800, color: pendingActionsCount > 0 ? '#ef4444' : 'var(--text-primary)' }}>{pendingActionsCount}</strong>
          <span className="stat-desc" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {showPriorityAlerts ? '▲ Click to collapse alerts' : '▼ Click to expand alerts'}
          </span>
        </div>
        
        <div className="stat-card glass card-customers" style={{ 
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '1.25rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          minHeight: '120px'
        }}>
          <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '0.5rem' }}>
            <span className="stat-label" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Active Customers</span>
            <div className="stat-icon" style={{ color: 'var(--primary-color)', display: 'flex', alignItems: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
          </div>
          <strong className="stat-val" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{activeCustomers}</strong>
          <span className="stat-desc" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>With active orders</span>
        </div>
      </div>

      {/* 3. Collapsible Priority Alerts Section (Accordion) */}
      <div style={{
        maxHeight: showPriorityAlerts ? '1000px' : '0px',
        opacity: showPriorityAlerts ? 1 : 0,
        overflow: 'hidden',
        transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease, margin 0.3s ease',
        width: '100%',
        marginTop: showPriorityAlerts ? '0.5rem' : '0px',
        marginBottom: showPriorityAlerts ? '0.5rem' : '0px',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', background: 'rgba(239, 68, 68, 0.01)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px dashed rgba(239, 68, 68, 0.2)' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ⚠️ Priority Alerts Requiring Attention
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', width: '100%' }}>
            {[
              { label: 'Unconfirmed Orders', count: unconfirmedOrdersAlertCount, severity: 'Critical', tab: 'orders', filter: 'Pending', view: 'active' },
              { label: 'Unapproved Cancel Orders', count: pendingCancellationRequests.length, severity: 'Critical', tab: 'orders', filter: 'Pending', view: 'cancellations', onClickAction: onOpenCancellationRequests },
              { label: 'In Transit Orders', count: inTransitOrdersAlertCount, severity: 'High', tab: 'orders', filter: 'InTransit', view: 'active' },
              { label: 'New Inquiries', count: newInquiriesAlertCount, severity: 'Medium', tab: 'inquiries' }
            ].map((alert, idx) => {
              const isCritical = alert.severity === 'Critical';
              const isHigh = alert.severity === 'High';
              const hasAlert = alert.count > 0;
              
              let badgeBg = 'rgba(100, 116, 139, 0.1)';
              let badgeColor = 'var(--text-secondary)';
              let cardBorder = 'var(--border-color)';
              
              if (hasAlert) {
                if (isCritical) {
                  badgeBg = 'rgba(239, 68, 68, 0.15)';
                  badgeColor = '#ef4444';
                  cardBorder = 'rgba(239, 68, 68, 0.4)';
                } else if (isHigh) {
                  badgeBg = 'rgba(249, 115, 22, 0.15)';
                  badgeColor = '#f97316';
                  cardBorder = 'rgba(249, 115, 22, 0.4)';
                } else {
                  badgeBg = 'rgba(234, 179, 8, 0.15)';
                  badgeColor = '#eab308';
                  cardBorder = 'rgba(234, 179, 8, 0.4)';
                }
              }

              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (hasAlert) {
                      if (onNavigateToOrdersWithFilter && alert.tab === 'orders' && alert.filter && alert.view) {
                        onNavigateToOrdersWithFilter(alert.filter, alert.view as any, formatDateForInput(filterStartDate));
                      } else if (alert.onClickAction) {
                        alert.onClickAction();
                      } else if (setActiveTab && alert.tab) {
                        setActiveTab(alert.tab);
                      }
                    }
                  }}
                  className={`alert-card-interactive ${hasAlert && isCritical ? 'critical-alert-pulse' : ''}`}
                  style={{
                    background: 'var(--bg-secondary)',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${cardBorder}`,
                    opacity: hasAlert ? 1 : 0.55,
                    cursor: hasAlert ? 'pointer' : 'default',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {alert.label}
                    </span>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: badgeBg,
                      color: badgeColor,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {alert.severity}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                    <strong style={{ fontSize: '1.4rem', color: hasAlert ? badgeColor : 'var(--text-primary)' }}>
                      {alert.count}
                    </strong>
                    {hasAlert && (
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        Review →
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)', margin: 0, width: '100%' }} />

      {/* 5. Live Charts (Growth Trends & Peak Hours) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Behavioral Trends & Sales Charts
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', width: '100%' }}>
          
          {/* Customer Growth & Order Trends */}
          <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', position: 'relative' }}>
            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', fontWeight: 700 }}>Customer Growth & Order Trends</h4>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-color)', display: 'inline-block' }} />
                <span>Orders Count</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                <span>New Signups</span>
              </div>
            </div>
            
            <svg 
              viewBox="0 0 460 140" 
              style={{ width: '100%', height: 'auto', overflow: 'visible' }}
              onMouseLeave={() => setHoveredTrendPoint(null)}
            >
              <line x1="30" y1="20" x2="450" y2="20" stroke="var(--border-color)" strokeDasharray="3 3" />
              <line x1="30" y1="60" x2="450" y2="60" stroke="var(--border-color)" strokeDasharray="3 3" />
              <line x1="30" y1="100" x2="450" y2="100" stroke="var(--border-color)" strokeDasharray="3 3" />
              <line x1="30" y1="110" x2="450" y2="110" stroke="var(--border-color)" />
              <path d={ordersLinePath} fill="none" stroke="var(--primary-color)" strokeWidth="2.5" strokeLinecap="round" />
              <path d={signupsLinePath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />

              {points.map((p, idx) => (
                <g key={idx}>
                  <rect x={p.x - 15} y="10" width="30" height="100" fill="transparent" style={{ cursor: 'pointer' }} onMouseMove={() => setHoveredTrendPoint(p)} />
                  <circle cx={p.x} cy={p.yOrders} r="3.5" fill="var(--primary-color)" stroke="var(--bg-secondary)" strokeWidth="1" />
                  <circle cx={p.x} cy={p.ySignups} r="3.5" fill="#10b981" stroke="var(--bg-secondary)" strokeWidth="1" />
                  {idx % 2 === 0 && (
                    <text x={p.x} y="125" textAnchor="middle" fontSize="7.5" fill="var(--text-muted)">{p.label}</text>
                  )}
                </g>
              ))}

              {hoveredTrendPoint && (
                <g style={{ pointerEvents: 'none' }}>
                  <line x1={hoveredTrendPoint.x} y1="15" x2={hoveredTrendPoint.x} y2="110" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="2 2" />
                  <foreignObject x={hoveredTrendPoint.x > 300 ? hoveredTrendPoint.x - 120 : hoveredTrendPoint.x + 10} y="15" width="110" height="60">
                    <div style={{ background: 'var(--bg-primary)', padding: '5px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.7rem', color: 'var(--text-primary)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                      <strong style={{ display: 'block', fontSize: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '2px', marginBottom: '2px' }}>{hoveredTrendPoint.label}</strong>
                      <div>Orders: <strong style={{ color: 'var(--primary-color)' }}>{hoveredTrendPoint.orders}</strong></div>
                      <div>Signups: <strong style={{ color: '#10b981' }}>{hoveredTrendPoint.signups}</strong></div>
                      <div>Sales: <strong>{formatCurrency(hoveredTrendPoint.revenue)}</strong></div>
                    </div>
                  </foreignObject>
                </g>
              )}
            </svg>
          </div>

          {/* Peak Ordering Hours */}
          <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', position: 'relative' }}>
            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', fontWeight: 700 }}>🕒 Peak Ordering Hours Distribution</h4>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Shows hour groupings when customer orders are finalized.
            </div>

            <svg 
              viewBox="0 0 460 140" 
              style={{ width: '100%', height: 'auto', overflow: 'visible' }}
              onMouseLeave={() => setHoveredBar(null)}
            >
              <line x1="40" y1="20" x2="450" y2="20" stroke="var(--border-color)" strokeDasharray="3 3" />
              <line x1="40" y1="60" x2="450" y2="60" stroke="var(--border-color)" strokeDasharray="3 3" />
              <line x1="40" y1="95" x2="450" y2="95" stroke="var(--border-color)" />

              {barData.map((bar, idx) => (
                <g key={idx}>
                  <rect x={bar.x - 5} y="10" width={barWidth + 10} height="90" fill="transparent" style={{ cursor: 'pointer' }} onMouseMove={() => setHoveredBar(bar)} />
                  <rect x={bar.x} y={bar.y} width={barWidth} height={Math.max(bar.h, 2)} rx="4" fill={hoveredBar?.name === bar.name ? 'var(--primary-color)' : 'rgba(59, 130, 246, 0.65)'} style={{ transition: 'all 0.15s ease' }} />
                  <text x={bar.x + barWidth / 2} y="112" textAnchor="middle" fontSize="6.5" fill="var(--text-secondary)">{bar.name.split(' ')[0]}</text>
                </g>
              ))}

              {hoveredBar && (
                <g style={{ pointerEvents: 'none' }}>
                  <foreignObject x={hoveredBar.x > 300 ? hoveredBar.x - 130 : hoveredBar.x + 45} y="20" width="120" height="50">
                    <div style={{ background: 'var(--bg-primary)', padding: '4px 6px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.7rem', color: 'var(--text-primary)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                      <strong style={{ display: 'block', fontSize: '0.75rem', color: 'var(--primary-color)' }}>{hoveredBar.name}</strong>
                      <div>Total Orders: <strong>{hoveredBar.count}</strong></div>
                    </div>
                  </foreignObject>
                </g>
              )}
            </svg>
          </div>

        </div>
      </div>

      <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)', margin: 0, width: '100%' }} />

      {/* 6. Drill-down Panels Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Customer Activity Drill-downs
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', width: '100%' }}>
          
          {/* Top Spenders */}
          <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>💎 Top Spenders</h4>
              <button 
                onClick={() => setActiveTab && setActiveTab('users')}
                style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
              >
                View Users →
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {topCustomers.map((cust, idx) => (
                <div key={cust.mobile} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: idx < topCustomers.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{idx + 1}</div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{cust.name}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{cust.mobile} • {cust.orderCount} orders</span>
                  </div>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--primary-color)' }}>{formatCurrency(cust.totalSpend)}</strong>
                </div>
              ))}
              {topCustomers.length === 0 && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No spending records in this window.</div>
              )}
            </div>
          </div>

          {/* Most Purchased */}
          <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>📦 Most Purchased</h4>
              <button 
                onClick={() => setActiveTab && setActiveTab('products')}
                style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Products →
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {mostPurchasedProducts.map((p) => {
                const totalUnits = mostPurchasedProducts.reduce((sum, item) => sum + item.count, 0);
                const pct = totalUnits > 0 ? (p.count / totalUnits) * 100 : 0;
                return (
                  <div key={p.id || p.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{p.count} Units</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--primary-color)', borderRadius: '3px', transition: 'width 0.3s ease' }} />
                    </div>
                  </div>
                );
              })}
              {mostPurchasedProducts.length === 0 && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No orders placed.</div>
              )}
            </div>
          </div>

          {/* Recent Inquiries */}
          <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}> 💬 Recent Inquiries</h4>
              <button 
                onClick={() => setActiveTab && setActiveTab('inquiries')}
                style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Inquiries →
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {filteredInquiries.slice(0, 3).map((inq, idx) => (
                <div 
                  key={idx}
                  onClick={() => setActiveTab && setActiveTab('inquiries')}
                  style={{ display: 'flex', flexDirection: 'column', padding: '0.4rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', cursor: 'pointer', transition: 'all 0.15s ease' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    <span>{inq.Name}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                      {inq.Timestamp ? new Date(inq.Timestamp).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--primary-color)', fontWeight: 600 }}>{inq.Subject}</span>
                  <p style={{ margin: '0.1rem 0 0 0', fontSize: '0.7rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {inq.Message}
                  </p>
                </div>
              ))}
              {filteredInquiries.length === 0 && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No recent inquiries.</div>
              )}
            </div>
          </div>

          {/* Recent Orders */}
          <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>🛒 Recent Orders</h4>
              <button 
                onClick={() => setActiveTab && setActiveTab('orders')}
                style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Orders →
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {sortedRecentActiveOrders.map((ord) => (
                <div 
                  key={ord.orderId}
                  onClick={() => setActiveTab && setActiveTab('orders')}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{ord.orderId}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{ord.customer?.name || 'Customer'}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <strong style={{ fontSize: '0.75rem', color: 'var(--primary-color)' }}>{formatCurrency(ord.total)}</strong>
                    <span className={`badge ${getStatusBadge(ord.status)}`} style={{ fontSize: '0.6rem', padding: '1px 4px' }}>
                      {ord.status}
                    </span>
                  </div>
                </div>
              ))}
              {sortedRecentActiveOrders.length === 0 && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No orders matching filters.</div>
              )}
            </div>
          </div>

          {/* Cancellation Approvals (Merged inside Customer Activity Drill-downs) */}
          <div className="activity-card glass cancellation-card" style={{ margin: 0, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', gridColumn: '1 / -1' }}>
            <div className="activity-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0, padding: 0 }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Cancellation Audit Reviews</h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Review customer requests before an order is cancelled.</p>
              </div>
              <button
                type="button"
                className="badge badge-orange cancellation-count-btn"
                onClick={onOpenCancellationRequests}
                title="Open cancellation requests"
                style={{ cursor: 'pointer' }}
              >
                {pendingCancellationRequests.length} Pending
              </button>
            </div>
            
            <div className="table-responsive dashboard-cancellation-table" style={{ width: '100%', display: 'block' }}>
              <table className="admin-table compact-table">
                <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                  <tr>
                    <th style={{ background: 'var(--bg-secondary)' }}>Status</th>
                    <th style={{ background: 'var(--bg-secondary)' }}>Order</th>
                    <th style={{ background: 'var(--bg-secondary)' }}>Customer</th>
                    <th style={{ background: 'var(--bg-secondary)' }}>Requested</th>
                    <th style={{ background: 'var(--bg-secondary)' }}>Payment / Refund</th>
                    <th style={{ background: 'var(--bg-secondary)' }}>Admin Remarks</th>
                    <th className="sticky-action-col" style={{ background: 'var(--bg-secondary)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingCancellationRequests.slice(0, 3).map((request) => (
                    <tr key={request.requestId}>
                      <td><span className="badge badge-orange">{request.status}</span></td>
                      <td>
                        <strong className="order-id-link">{request.orderId}</strong>
                        <br />
                        <small>{formatCurrency(request.orderTotal)}</small>
                      </td>
                      <td>
                        <div>{request.customerName}</div>
                        <small>{request.customerMobile} - {request.customerEmail || 'No email'}</small>
                      </td>
                      <td>{new Date(request.requestDate).toLocaleString('en-IN')}</td>
                      <td>
                        <div>{request.paymentMethod || 'Cash on Delivery'}</div>
                        <small>{request.refundStatus || 'Pending approval'}</small>
                      </td>
                      <td className="remarks-col">
                        <textarea
                          className="form-input remarks-textarea"
                          value={remarksByRequest[request.requestId] || ''}
                          onChange={(event) => setRemarksByRequest((prev) => ({ ...prev, [request.requestId]: event.target.value }))}
                          placeholder="Audit remarks"
                          rows={2}
                        />
                      </td>
                      <td className="sticky-action-col">
                        <div className="actions-flex row-wrap">
                          <button type="button" className="btn-table btn-reject" onClick={() => initiateReview(request, 'Rejected')}>✗ Reject</button>
                          <button type="button" className="btn-table btn-approve" onClick={() => initiateReview(request, 'Approved')}>✓ Approve</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pendingCancellationRequests.length === 0 && (
                    <tr>
                      <td colSpan={7} className="empty-td">No pending cancellation requests.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="cancellation-mobile-list">
              {pendingCancellationRequests.slice(0, 3).map((request) => (
                <div key={request.requestId} className="cancellation-mobile-item">
                  <div className="cancellation-mobile-top">
                    <span className="badge badge-orange">{request.status}</span>
                    <strong>{request.orderId}</strong>
                  </div>
                  <div className="cancellation-mobile-grid">
                    <span>Customer</span>
                    <strong>{request.customerName}</strong>
                    <span>Mobile</span>
                    <strong>{request.customerMobile}</strong>
                    <span>Total</span>
                    <strong>{formatCurrency(request.orderTotal)}</strong>
                    <span>Requested</span>
                    <strong>{new Date(request.requestDate).toLocaleDateString('en-IN')}</strong>
                  </div>
                  <textarea
                    className="form-input"
                    value={remarksByRequest[request.requestId] || ''}
                    onChange={(event) => setRemarksByRequest((prev) => ({ ...prev, [request.requestId]: event.target.value }))}
                    placeholder="Audit remarks"
                    rows={2}
                  />
                  <div className="cancellation-mobile-actions">
                    <button type="button" className="btn-table btn-reject" onClick={() => initiateReview(request, 'Rejected')}>✗ Reject</button>
                    <button type="button" className="btn-table btn-approve" onClick={() => initiateReview(request, 'Approved')}>✓ Approve</button>
                  </div>
                </div>
              ))}
              {pendingCancellationRequests.length === 0 && (
                <div className="empty-td">No pending cancellation requests.</div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Confirmation Modal using Reusable Component */}
      <LogoutConfirmationModal
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={executeReview}
        title="Confirm Action"
        description={confirmAction ? `Are you sure you want to ${confirmAction.decision === 'Approved' ? 'approve' : 'reject'} this cancellation request?` : ''}
        confirmText="Confirm"
        cancelText="Cancel"
        confirmButtonClass={confirmAction?.decision === 'Approved' ? 'btn btn-primary' : 'btn btn-error'}
        isProcessing={isProcessingAction}
      />
    </div>
  );
});

export default DashboardTab;
