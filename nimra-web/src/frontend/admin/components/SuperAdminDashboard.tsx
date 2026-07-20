'use client';

import { AdminUser, Inquiry, Notification, OrderRecord, Product } from '@/types/cms';
import { normalizeRole } from '../utils/accessControl';

type Props = { orders: OrderRecord[]; users: AdminUser[]; products: Product[]; inquiries: Inquiry[]; notifications: Notification[]; onNavigate: (tab: string) => void };

export default function SuperAdminDashboard({ orders, users, products, inquiries, notifications, onNavigate }: Props) {
  const customers = users.filter(u => normalizeRole(u.Role) === 'CUSTOMER');
  const admins = users.filter(u => ['ADMIN','SUPER_ADMIN'].includes(normalizeRole(u.Role)));
  const today = new Date().toDateString();
  const todaysOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
  const revenue = (list: OrderRecord[]) => list.filter(o => o.status !== 'Cancelled').reduce((sum,o) => sum + Number(o.total || 0), 0);
  const money = (n: number) => `₹${n.toLocaleString('en-IN')}`;
  const pending = orders.filter(o => o.status === 'Pending').length;
  const completed = orders.filter(o => o.status === 'Delivered').length;
  const cancelled = orders.filter(o => o.status === 'Cancelled').length;
  const pendingInquiries = inquiries.filter(i => i.Status !== 'Reviewed').length;
  const cards = [
    ['Total Revenue',money(revenue(orders)),'Lifetime net sales','₹','revenue'], ["Today's Revenue",money(revenue(todaysOrders)),`${todaysOrders.length} orders today`,'↗','revenue'],
    ['Total Orders',orders.length,'All-time order volume','▣','orders'], ['Pending Orders',pending,'Requires attention','◷','inquiries'], ['Completed Orders',completed,`${orders.length ? Math.round(completed/orders.length*100) : 0}% completion rate`,'✓','revenue'],
    ['Cancelled Orders',cancelled,`${orders.length ? Math.round(cancelled/orders.length*100) : 0}% cancellation rate`,'×','danger'], ['Total Customers',customers.length,'Registered accounts','◉','customers'],
    ['Total Admins',admins.length,'Privileged team members','◆','customers'], ['Products',products.length,'Catalogue inventory','◇','products'], ['Pending Inquiries',pendingInquiries,'Awaiting response','?','inquiries'],
  ];
  const actions = [['＋','Add Product','Create a catalogue item','products'],['▣','Manage Orders','Review fulfilment','orders'],['◉','Manage Users','Customer accounts','users'],['◆','Manage Admins','Team and access','admins'],['?','View Inquiries','Resolve requests','inquiries'],['⚙','System Settings','Platform controls','settings'],['♢','Notifications','Message centre','notifications']];
  const productCounts = new Map<string,number>();
  orders.forEach(o => o.items?.forEach(item => productCounts.set(item.name,(productCounts.get(item.name)||0)+Number(item.quantity||0))));
  const topProducts = [...productCounts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,4);
  const recentCustomers = [...customers].sort((a,b)=>new Date(b.CreatedAt||0).getTime()-new Date(a.CreatedAt||0).getTime()).slice(0,4);
  const last7 = Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(6-i)); return orders.filter(o=>new Date(o.createdAt).toDateString()===d.toDateString()); });
  const score = (a: AdminUser) => Math.min(99,70+Number(a.OrdersManaged||0)*2+Number(a.InquiriesResolved||0));
  return <div className="enterprise-section command-center">
    <div className="enterprise-heading command-heading"><div><span className="eyebrow">Enterprise Overview</span><h2>Super Admin Command Center</h2><p>A focused view of revenue, operations, customers, and platform performance.</p></div><span className="command-status"><i/>All Systems Operational</span></div>
    <section><Heading kicker="Live performance" title="Business at a glance" note="Synced with your operational data"/><div className="enterprise-kpi-grid">{cards.map(([title,value,note,icon,tone])=><article className={`kpi-card glass tone-${tone}`} key={title}><div className="kpi-icon">{icon}</div><div className="kpi-copy"><span>{title}</span><strong>{value}</strong><small>{note}</small></div></article>)}</div></section>
    <section><Heading kicker="Workflows" title="Enterprise Quick Actions"/><div className="quick-action-grid">{actions.map(([icon,title,subtitle,tab])=><button className="quick-action glass" key={title} onClick={()=>onNavigate(tab)}><span className="quick-icon">{icon}</span><span><strong>{title}</strong><small>{subtitle}</small></span><b>→</b></button>)}</div></section>
    <section><Heading kicker="Intelligence" title="Business Insights"/><div className="insights-grid">
      <article className="insight-card glass insight-feature"><CardTitle title="Today's Order Trend" label="Live"/><strong className="insight-value">{todaysOrders.length}</strong><p>orders today · {money(revenue(todaysOrders))} in revenue</p><div className="mini-bars">{last7.map((day,i)=><i key={i} style={{height:`${Math.max(12,day.length/Math.max(...last7.map(x=>x.length),1)*100)}%`}}/>)}</div></article>
      <article className="insight-card glass"><CardTitle title="Most Sold Products" label="Units"/><div className="rank-list">{topProducts.length?topProducts.map(([name,count],i)=><div className="rank-row" key={name}><span><b>{i+1}</b>{name}</span><strong>{count}</strong></div>):<p>No product sales yet.</p>}</div></article>
      <article className="insight-card glass"><CardTitle title="Latest Registrations" label="Customers"/><div className="people-list">{recentCustomers.length?recentCustomers.map(u=><div key={u.ID}><span className="mini-avatar">{u.Name?.[0]||'C'}</span><span><strong>{u.Name}</strong><small>{u.CreatedAt?new Date(u.CreatedAt).toLocaleDateString('en-IN'):'Recently joined'}</small></span></div>):<p>No registrations yet.</p>}</div></article>
      <article className="insight-card glass"><CardTitle title="Operations Pulse" label="This week"/><div className="pulse-stat"><span>Cancelled orders</span><strong>{cancelled}</strong></div><div className="pulse-stat"><span>Unresolved inquiries</span><strong>{pendingInquiries}</strong></div><div className="pulse-stat"><span>Recent activity</span><strong>{notifications.length}</strong></div></article>
    </div></section>
    <section><Heading kicker="Team" title="Top Performing Admins"/><div className="admin-card-grid">{admins.slice(0,5).map(a=><article className="admin-performance-card glass" key={a.ID}><div className="admin-card-head"><span className="admin-avatar">{a.Name?.[0]||'A'}</span><div><h4>{a.Name}</h4><span className="role-chip">{normalizeRole(a.Role).replace('_',' ')}</span></div><span className="online-chip"><i/>Active</span></div><div className="admin-metrics"><div><span>Orders</span><strong>{a.OrdersManaged||0}</strong></div><div><span>Resolved</span><strong>{a.InquiriesResolved||0}</strong></div><div><span>Score</span><strong>{score(a)}%</strong></div></div><div className="score-track"><i style={{width:`${score(a)}%`}}/></div><small>Last login · {a.LastLogin?new Date(a.LastLogin).toLocaleString('en-IN'):'Never'}</small></article>)}{!admins.length&&<div className="empty-state glass">No admin activity yet.</div>}</div></section>
  </div>;
}

function Heading({kicker,title,note}:{kicker:string;title:string;note?:string}) { return <div className="section-heading"><div><span className="section-kicker">{kicker}</span><h3>{title}</h3></div>{note&&<span>{note}</span>}</div>; }
function CardTitle({title,label}:{title:string;label:string}) { return <div className="card-title"><h4>{title}</h4><span>{label}</span></div>; }
