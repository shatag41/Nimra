import { OrderRecord, Product, Banner, FAQ, Inquiry, AdminUser, Notification } from '@/types/cms';

export const filterOrders = (
  orders: OrderRecord[],
  searchLower: string,
  statusFilter: string,
  paymentFilter: string,
  sortOrder: string,
  startDate: string,
  endDate: string
): OrderRecord[] => {
  const sorted = [...orders].sort((a, b) => {
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    if (sortOrder === 'earliest') {
      if (dateA !== dateB) return dateA - dateB;
      return (a.orderId || '').localeCompare(b.orderId || '');
    } else {
      if (dateA !== dateB) return dateB - dateA;
      return (b.orderId || '').localeCompare(a.orderId || '');
    }
  });

  return sorted.filter(o => {
    const matchesSearch = String(o.orderId || '').toLowerCase().includes(searchLower) ||
      String(o.customer?.name || '').toLowerCase().includes(searchLower) ||
      String(o.customer?.mobile || '').toLowerCase().includes(searchLower) ||
      String(o.status || '').toLowerCase().includes(searchLower);
    
    let matchesStatus = false;
    if (statusFilter === 'All') {
      matchesStatus = true;
    } else if (statusFilter === 'InTransit') {
      matchesStatus = o.status !== 'Pending' && o.status !== 'Cancelled';
    } else {
      matchesStatus = o.status === statusFilter;
    }
    const matchesPayment = paymentFilter === 'All' || o.paymentMethod === paymentFilter;
    
    let matchesDateRange = true;
    if (startDate) {
      const start = new Date(startDate).getTime();
      const created = new Date(o.createdAt).getTime();
      if (created < start) matchesDateRange = false;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      const created = new Date(o.createdAt).getTime();
      if (created > end.getTime()) matchesDateRange = false;
    }
    
    return matchesSearch && matchesStatus && matchesPayment && matchesDateRange;
  });
};

export const filterProducts = (
  products: Product[],
  searchLower: string,
  categoryFilter: string,
  statusFilter: string
): Product[] => {
  return products.filter(p => {
    const matchesSearch = String(p.Name || '').toLowerCase().includes(searchLower) || 
      String(p.Category || '').toLowerCase().includes(searchLower) ||
      String(p.Description || '').toLowerCase().includes(searchLower);
      
    const matchesCategory = categoryFilter === 'All' || p.Category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || 
      (statusFilter === 'Active' && p.Active !== false) ||
      (statusFilter === 'Inactive' && p.Active === false);
      
    return matchesSearch && matchesCategory && matchesStatus;
  });
};

export const filterBanners = (
  banners: Banner[],
  searchLower: string,
  statusFilter: string
): Banner[] => {
  return banners.filter(b => {
    const matchesSearch = String(b.Title || '').toLowerCase().includes(searchLower) || 
      String(b.Subtitle || '').toLowerCase().includes(searchLower);
      
    const matchesStatus = statusFilter === 'All' || 
      (statusFilter === 'Active' && b.Active !== false) ||
      (statusFilter === 'Inactive' && b.Active === false);
      
    return matchesSearch && matchesStatus;
  });
};

export const filterFAQs = (
  faqs: FAQ[],
  searchLower: string,
  statusFilter: string
): FAQ[] => {
  return faqs.filter(f => {
    const matchesSearch = String(f.Question || '').toLowerCase().includes(searchLower) || 
      String(f.Answer || '').toLowerCase().includes(searchLower);
      
    const matchesStatus = statusFilter === 'All' || 
      (statusFilter === 'Active' && f.Active !== false) ||
      (statusFilter === 'Inactive' && f.Active === false);
      
    return matchesSearch && matchesStatus;
  });
};

export const filterInquiries = (
  inquiries: Inquiry[],
  searchLower: string,
  sortOrder: string,
  startDate: string,
  endDate: string
): Inquiry[] => {
  const sorted = [...inquiries].sort((a, b) => {
    const dateA = new Date(a.Timestamp || 0).getTime();
    const dateB = new Date(b.Timestamp || 0).getTime();
    return sortOrder === 'earliest' ? dateA - dateB : dateB - dateA;
  });

  return sorted.filter(i => {
    const matchesSearch = String(i.Name || '').toLowerCase().includes(searchLower) || 
      String(i.Subject || '').toLowerCase().includes(searchLower) || 
      String(i.Message || '').toLowerCase().includes(searchLower) ||
      String(i.Email || '').toLowerCase().includes(searchLower) ||
      String(i.Phone || '').toLowerCase().includes(searchLower);

    let matchesDateRange = true;
    if (startDate) {
      const start = new Date(startDate).getTime();
      const created = new Date(i.Timestamp).getTime();
      if (created < start) matchesDateRange = false;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      const created = new Date(i.Timestamp).getTime();
      if (created > end.getTime()) matchesDateRange = false;
    }

    return matchesSearch && matchesDateRange;
  });
};

export const filterUsers = (
  users: AdminUser[],
  searchLower: string,
  statusFilter: string
): AdminUser[] => {
  return users.filter(u => {
    const matchesSearch = String(u.Name || '').toLowerCase().includes(searchLower) || 
      String(u.Username || '').toLowerCase().includes(searchLower) || 
      String(u.Role || '').toLowerCase().includes(searchLower);
      
    const isActive = String(u.Active ?? true).toLowerCase() !== 'false';
    const matchesStatus = statusFilter === 'All' ||
      (statusFilter === 'Active' && isActive) ||
      (statusFilter === 'Inactive' && !isActive);

    return matchesSearch && matchesStatus;
  });
};

export const filterNotifications = (
  notifications: Notification[],
  searchLower: string,
  sortOrder: string
): Notification[] => {
  const sorted = [...notifications].sort((a, b) => {
    const dateA = new Date(a.Timestamp || 0).getTime();
    const dateB = new Date(b.Timestamp || 0).getTime();
    return sortOrder === 'earliest' ? dateA - dateB : dateB - dateA;
  });

  return sorted.filter(n => 
    String(n.Title || '').toLowerCase().includes(searchLower) || 
    String(n.Message || '').toLowerCase().includes(searchLower)
  );
};
