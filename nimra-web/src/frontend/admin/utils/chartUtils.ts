import { OrderRecord } from '@/types/cms';

export interface ChartPoint {
  x: number;
  y: number;
  revenue: number;
  date: string;
}

export interface StatusStat {
  name: string;
  color: string;
  count: number;
  dashArray: string;
  dashOffset: number;
}

export const formatDateLabel = (dateStr: string) => {
  try {
    const [_, month, day] = dateStr.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIdx = parseInt(month, 10) - 1;
    return `${monthNames[monthIdx]} ${day}`;
  } catch {
    return dateStr;
  }
};

export const calculateDonutStats = (orders: OrderRecord[]): { statusStats: StatusStat[]; totalOrdersCount: number } => {
  const totalOrdersCount = orders.length;
  const circ = 377; // 2 * PI * 60 approx 376.99
  
  const orderStatuses = [
    { name: 'Pending', color: '#f59e0b' },
    { name: 'Confirmed', color: '#3b82f6' },
    { name: 'Processing', color: '#8b5cf6' },
    { name: 'Dispatched', color: '#6366f1' },
    { name: 'Out for Delivery', color: '#06b6d4' },
    { name: 'Delivered', color: '#10b981' },
    { name: 'Cancelled', color: '#ef4444' },
  ];

  let currentOffset = 0;
  const statusStats = orderStatuses.map(status => {
    const count = orders.filter(o => o.status === status.name).length;
    const fraction = totalOrdersCount > 0 ? count / totalOrdersCount : 0;
    const dashArray = `${(fraction * circ).toFixed(1)} ${circ}`;
    const dashOffset = currentOffset;
    currentOffset -= (fraction * circ);
    return { ...status, count, dashArray, dashOffset };
  });

  return { statusStats, totalOrdersCount };
};

export const calculateLineChartData = (orders: OrderRecord[]): {
  linePoints: ChartPoint[];
  linePathD: string;
  areaPathD: string;
  chartMax: number;
} => {
  const revenueByDate: { [date: string]: number } = {};
  orders
    .filter(o => o.status === 'Delivered')
    .forEach(o => {
      try {
        const targetDateStr = o.updatedAt || o.createdAt;
        if (!targetDateStr) return;
        const dateStr = new Date(targetDateStr as string).toISOString().split('T')[0];
        revenueByDate[dateStr] = (revenueByDate[dateStr] || 0) + Number(o.total || 0);
      } catch (e) {
        // Ignore date parse errors
      }
    });

  const last7Days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Days.push(d.toISOString().split('T')[0]);
  }

  const chartData = last7Days.map(day => ({
    date: day,
    revenue: revenueByDate[day] || 0
  }));

  const maxRev = Math.max(...chartData.map(d => d.revenue), 0);
  const chartMax = maxRev > 0 ? maxRev * 1.15 : 100;

  const linePoints = chartData.map((d, i) => {
    const x = 40 + i * (440 / 6);
    const y = 170 - (d.revenue / chartMax) * 150;
    return { x, y, revenue: d.revenue, date: d.date };
  });

  const linePathD = linePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPathD = linePoints.length > 0
    ? `${linePathD} L ${linePoints[linePoints.length - 1].x.toFixed(1)} 170 L ${linePoints[0].x.toFixed(1)} 170 Z`
    : '';

  return { linePoints, linePathD, areaPathD, chartMax };
};
