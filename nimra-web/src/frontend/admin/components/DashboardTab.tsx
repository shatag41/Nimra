import React, { useState } from 'react';
import { OrderRecord, Inquiry } from '@/types/cms';
import { formatCurrency } from '@/frontend/customer/utils/commerce';
import { calculateDonutStats, calculateLineChartData, formatDateLabel, ChartPoint } from '../utils/chartUtils';

interface DashboardTabProps {
  orders: OrderRecord[];
  filteredInquiries: Inquiry[];
  filteredOrders: OrderRecord[];
}

export default function DashboardTab({ orders, filteredInquiries, filteredOrders }: DashboardTabProps) {
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null);

  // Stats calculations
  const deliveredOrders = orders.filter(o => o.status === 'Delivered');
  const totalRevenue = deliveredOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const avgOrderValue = deliveredOrders.length > 0 ? totalRevenue / deliveredOrders.length : 0;
  const uniqueMobiles = new Set(orders.map(o => o.customer?.mobile).filter(Boolean));
  const totalCustomers = uniqueMobiles.size;

  // Chart calculations
  const { statusStats, totalOrdersCount } = calculateDonutStats(orders);
  const { linePoints, linePathD, areaPathD, chartMax } = calculateLineChartData(orders);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!linePoints || linePoints.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const svgX = (clientX / rect.width) * 500;
    
    let closest = linePoints[0];
    let minDiff = Math.abs(linePoints[0].x - svgX);
    
    for (let i = 1; i < linePoints.length; i++) {
      const diff = Math.abs(linePoints[i].x - svgX);
      if (diff < minDiff) {
        minDiff = diff;
        closest = linePoints[i];
      }
    }
    
    setHoveredPoint(closest);
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
    <div className="overview-tab">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card glass">
          <span className="stat-label">Total Revenue</span>
          <strong className="stat-val">{formatCurrency(totalRevenue)}</strong>
          <span className="stat-desc">From completed orders</span>
        </div>
        <div className="stat-card glass">
          <span className="stat-label">Total Orders</span>
          <strong className="stat-val">{orders.length}</strong>
          <span className="stat-desc">All tracking statuses</span>
        </div>
        <div className="stat-card glass">
          <span className="stat-label">Average Order Value</span>
          <strong className="stat-val">{formatCurrency(avgOrderValue)}</strong>
          <span className="stat-desc">Per completed delivery</span>
        </div>
        <div className="stat-card glass">
          <span className="stat-label">Total Customers</span>
          <strong className="stat-val">{totalCustomers}</strong>
          <span className="stat-desc">Unique mobile registers</span>
        </div>
      </div>

      {/* SVG Charts section */}
      <div className="charts-grid">
        {/* Revenue Line Chart */}
        <div className="chart-card glass">
          <h3>Revenue Trend (Delivered Orders)</h3>
          <div className="chart-wrapper">
            <svg 
              viewBox="0 0 500 200" 
              className="svg-chart"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoveredPoint(null)}
              style={{ overflow: 'visible' }}
            >
              {/* Grid lines */}
              <line x1="40" y1="20" x2="480" y2="20" stroke="var(--border-color)" strokeDasharray="4 4" />
              <line x1="40" y1="70" x2="480" y2="70" stroke="var(--border-color)" strokeDasharray="4 4" />
              <line x1="40" y1="120" x2="480" y2="120" stroke="var(--border-color)" strokeDasharray="4 4" />
              <line x1="40" y1="170" x2="480" y2="170" stroke="var(--border-color)" />
              
              {/* Area Gradient */}
              {areaPathD && (
                <path
                  d={areaPathD}
                  fill="url(#chartAreaGrad)"
                />
              )}
              
              {/* Line */}
              {linePathD && (
                <path
                  d={linePathD}
                  fill="none"
                  stroke="var(--primary-color)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              )}
              
              {/* Points */}
              {linePoints.map((p, idx) => (
                <circle 
                  key={idx} 
                  cx={p.x} 
                  cy={p.y} 
                  r={hoveredPoint?.date === p.date ? 6 : 4} 
                  fill="var(--primary-color)"
                  style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                />
              ))}

              {/* Labels */}
              {linePoints.map((p, idx) => {
                if (idx === 0 || idx === 2 || idx === 4 || idx === 6) {
                  return (
                    <text key={idx} x={p.x} y="190" textAnchor="middle" fontSize="9" fill="var(--text-secondary)">
                      {formatDateLabel(p.date)}
                    </text>
                  );
                }
                return null;
              })}

              {/* Hover Tooltip Overlay */}
              {hoveredPoint && (
                <g style={{ pointerEvents: 'none' }}>
                  {/* Vertical indicator line */}
                  <line 
                    x1={hoveredPoint.x} 
                    y1={hoveredPoint.y} 
                    x2={hoveredPoint.x} 
                    y2={170} 
                    stroke="var(--primary-color)" 
                    strokeWidth="1.5" 
                    strokeDasharray="2 2" 
                  />
                  
                  {/* Pulsing highlight ring */}
                  <circle 
                    cx={hoveredPoint.x} 
                    cy={hoveredPoint.y} 
                    r="8" 
                    fill="transparent" 
                    stroke="var(--primary-color)" 
                    strokeWidth="1.5" 
                    style={{ opacity: 0.5 }}
                  />
                  
                  {/* Tooltip block */}
                  <g transform={`translate(${hoveredPoint.x > 380 ? hoveredPoint.x - 110 : hoveredPoint.x < 120 ? hoveredPoint.x : hoveredPoint.x - 55}, ${hoveredPoint.y - 45})`}>
                    <rect 
                      width="110" 
                      height="36" 
                      rx="6" 
                      fill="var(--glass-bg)" 
                      stroke="var(--primary-color)" 
                      strokeWidth="1" 
                      style={{ 
                        filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.15))', 
                        backdropFilter: 'blur(4px)' 
                      }} 
                    />
                    <text x="55" y="14" textAnchor="middle" fontSize="9" fontWeight="bold" fill="var(--text-primary)">
                      {formatDateLabel(hoveredPoint.date)}
                    </text>
                    <text x="55" y="27" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="var(--primary-color)">
                      {formatCurrency(hoveredPoint.revenue)}
                    </text>
                  </g>
                </g>
              )}

              <defs>
                <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary-color)" stopOpacity="0.3"/>
                  <stop offset="100%" stopColor="var(--primary-color)" stopOpacity="0.0"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Order Status Donut Chart */}
        <div className="chart-card glass">
          <h3>Orders Status Distribution</h3>
          <div className="donut-chart-flex">
            <div style={{ position: 'relative', width: 140, height: 140 }}>
              <svg viewBox="0 0 160 160" width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="80" cy="80" r="60" fill="transparent" stroke="var(--border-color)" strokeWidth="15" />
                {statusStats.map((stat, idx) => stat.count > 0 && (
                  <circle key={idx} cx="80" cy="80" r="60" fill="transparent" stroke={stat.color} strokeWidth="15" 
                          strokeDasharray={stat.dashArray} strokeDashoffset={stat.dashOffset} />
                ))}
              </svg>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <strong style={{ fontSize: '1.4rem', color: 'var(--text-primary)', lineHeight: 1, marginBottom: '2px' }}>{totalOrdersCount}</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total</span>
              </div>
            </div>
            <div className="legend-list" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '4px', fontSize: '0.8rem', flex: 1, marginLeft: '1rem', alignContent: 'center' }}>
              {statusStats.map((stat, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', opacity: stat.count > 0 ? 1 : 0.4 }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: stat.color, marginRight: '6px', display: 'inline-block' }}></span>
                    {stat.name}
                  </div>
                  <strong>{stat.count}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Inquiries and Orders lists */}
      <div className="recent-activity-grid">
        <div className="activity-card glass">
          <h3>Recent Inquiries</h3>
          <div className="mini-list">
            {filteredInquiries.slice(0, 3).map((inq, i) => (
              <div key={i} className="mini-item">
                <div>
                  <strong>{inq.Name}</strong> - <span className="topic">{inq.Subject}</span>
                </div>
                <p>{String(inq.Message || '').slice(0, 80)}...</p>
              </div>
            ))}
            {filteredInquiries.length === 0 && <p className="empty">No inquiries found.</p>}
          </div>
        </div>

        <div className="activity-card glass">
          <h3>Pending Deliveries</h3>
          <div className="mini-list">
            {filteredOrders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').slice(0, 3).map((o) => (
              <div key={o.orderId} className="mini-item row-flex">
                <div>
                  <strong>{o.customer.name}</strong> ({String(o.orderId || '').slice(-6)})
                  <span className={`badge ${getStatusBadge(o.status)}`} style={{ marginLeft: '8px', scale: '0.85' }}>{o.status}</span>
                </div>
                <strong>{formatCurrency(o.total)}</strong>
              </div>
            ))}
            {filteredOrders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length === 0 && <p className="empty">All orders completed!</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
