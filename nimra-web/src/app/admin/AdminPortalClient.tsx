'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import {
  CMSData,
  OrderRecord,
  Inquiry,
  AdminUser,
  Notification,
  Product,
  Banner,
  FAQ,
  CompanyInfo,
} from '../../types/cms';
import {
  fetchOrders,
  updateOrderStatus,
  fetchInquiries,
  fetchUsers,
  saveUser,
  fetchNotifications,
  saveNotification,
  saveProduct,
  saveBanner,
  saveFAQ,
  saveCompanyInfo,
} from '../../utils/api';
import { formatCurrency } from '../../utils/commerce';
import LogoutConfirmationModal from '../../components/LogoutConfirmationModal';
import ThemeToggle from '../../components/ThemeToggle';
import { useAuth } from '../../context/AuthContext';

interface AdminPortalClientProps {
  initialCMSData: CMSData;
}

type TabType = 'dashboard' | 'orders' | 'products' | 'banners' | 'faqs' | 'inquiries' | 'users' | 'notifications' | 'settings';

interface CustomSelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  clearable?: boolean;
  onClear?: () => void;
}

function CustomSelect({ value, onChange, options, placeholder = 'Select...', clearable = false, onClear }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOpt = options.find(o => o.value === value);

  return (
    <div ref={containerRef} className="custom-select-container">
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
      >
        <span className="custom-select-text">{selectedOpt ? selectedOpt.label : placeholder}</span>
        <div className="custom-select-actions">
          {clearable && value !== 'All' && value !== 'latest' && onClear && (
            <span 
              onClick={(e) => {
                e.stopPropagation();
                onClear();
                setIsOpen(false);
              }} 
              className="custom-select-clear"
            >
              ✕
            </span>
          )}
          <span className="custom-select-arrow">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </span>
        </div>
      </div>
      {isOpen && (
        <div className="custom-select-options-list">
          {options.map((opt) => (
            <div 
              key={opt.value} 
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`custom-select-option ${opt.value === value ? 'selected' : ''}`}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminPortalClient({ initialCMSData }: AdminPortalClientProps) {
  const router = useRouter();
  const { logout } = useAuth();
  
  // Auth state
  const [currentUser, setCurrentUser] = useState<{
    id?: string | number;
    username: string;
    role: 'Admin' | 'Manager';
    name: string;
    email?: string;
    phone?: string;
  } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nimra_admin_active_tab');
      if (saved) return saved as TabType;
    }
    return 'dashboard';
  });
  const [globalSearch, setGlobalSearch] = useState('');

  // Persist activeTab to localStorage
  useEffect(() => {
    localStorage.setItem('nimra_admin_active_tab', activeTab);
  }, [activeTab]);

  // DB States
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; revenue: number; date: string } | null>(null);
  const [products, setProducts] = useState<Product[]>(initialCMSData.products || []);
  const [banners, setBanners] = useState<Banner[]>(initialCMSData.banners || []);
  const [faqs, setFaqs] = useState<FAQ[]>(initialCMSData.faqs || []);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(initialCMSData.companyInfo || {} as CompanyInfo);

  // Loading and Notification UI
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ text: '', type: 'success' }); // success or error

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [orderStatusVal, setOrderStatusVal] = useState('');
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isProfilePanelOpen, setIsProfilePanelOpen] = useState(false);
  
  // Profile editing state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [profileFeedback, setProfileFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profileValidationErrors, setProfileValidationErrors] = useState<{ [key: string]: string }>({});
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  
  // Product Edit Form state
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [productFormOpen, setProductFormOpen] = useState(false);

  // Banner Edit Form state
  const [editingBanner, setEditingBanner] = useState<Partial<Banner> | null>(null);
  const [bannerFormOpen, setBannerFormOpen] = useState(false);

  // FAQ Edit Form state
  const [editingFAQ, setEditingFAQ] = useState<Partial<FAQ> | null>(null);
  const [faqFormOpen, setFAQFormOpen] = useState(false);

  // User Edit Form state
  const [editingUser, setEditingUser] = useState<Partial<AdminUser> | null>(null);
  const [userFormOpen, setUserFormOpen] = useState(false);

  // Filters State
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('All');
  const [productCategoryFilter, setProductCategoryFilter] = useState('All');
  const [productStatusFilter, setProductStatusFilter] = useState('All');
  const [bannerStatusFilter, setBannerStatusFilter] = useState('All');
  const [faqStatusFilter, setFaqStatusFilter] = useState('All');
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const [userStatusFilter, setUserStatusFilter] = useState('All');

  // Date sorting and Date range Filter States
  const [orderSort, setOrderSort] = useState('latest');
  const [showFilters, setShowFilters] = useState(false);
  const [orderStartDate, setOrderStartDate] = useState('');
  const [orderEndDate, setOrderEndDate] = useState('');

  const [inquirySort, setInquirySort] = useState('latest');
  const [inquiryStartDate, setInquiryStartDate] = useState('');
  const [inquiryEndDate, setInquiryEndDate] = useState('');

  const [notificationSort, setNotificationSort] = useState('latest');

  // Clear Filter Handlers
  const handleClearOrderFilters = () => {
    setOrderStatusFilter('All');
    setOrderPaymentFilter('All');
    setOrderSort('latest');
    setOrderStartDate('');
    setOrderEndDate('');
  };

  const handleClearProductFilters = () => {
    setProductCategoryFilter('All');
    setProductStatusFilter('All');
  };

  const handleClearBannerFilters = () => {
    setBannerStatusFilter('All');
  };

  const handleClearFaqFilters = () => {
    setFaqStatusFilter('All');
  };

  const handleClearInquiryFilters = () => {
    setInquirySort('latest');
    setInquiryStartDate('');
    setInquiryEndDate('');
  };

  const handleClearUserFilters = () => {
    setUserRoleFilter('All');
    setUserStatusFilter('All');
  };

  // Notification Send Form state
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');

  // Check auth on mount
  useEffect(() => {
    const session = localStorage.getItem('nimra_admin_user');
    if (session) {
      try {
        const parsedSession = JSON.parse(session);
        const appSession = Cookies.get('nimra_user');
        const parsedCookieUser = appSession ? JSON.parse(appSession) : null;
        const role = parsedSession.role || parsedCookieUser?.Role;
        if (role !== 'Admin') {
          localStorage.removeItem('nimra_admin_user');
          Cookies.remove('nimra_user', { path: '/' });
          router.replace('/login');
          return;
        }
        const adminSession = {
          id: parsedSession.id || parsedSession.ID || parsedCookieUser?.ID || '',
          username: parsedSession.username || parsedSession.email || parsedCookieUser?.Username || '',
          role: 'Admin' as const,
          name: parsedSession.name || parsedCookieUser?.Name || '',
          email: parsedSession.email || parsedSession.username || parsedCookieUser?.Username || '',
          phone: parsedSession.phone || parsedCookieUser?.Mobile || '',
        };
        setCurrentUser(adminSession);
        setAuthChecked(true);
        return;
      } catch {
        localStorage.removeItem('nimra_admin_user');
      }
    }

    const appSession = Cookies.get('nimra_user');
    if (appSession) {
      try {
        const user = JSON.parse(appSession);
        if (user?.Role === 'Admin') {
          const adminSession = {
            id: user.ID,
            username: user.Username,
            role: user.Role,
            name: user.Name,
            email: user.Username,
            phone: user.Mobile || '',
          };
          localStorage.setItem('nimra_admin_user', JSON.stringify(adminSession));
          setCurrentUser(adminSession);
          setAuthChecked(true);
          return;
        }
      } catch {
        Cookies.remove('nimra_user', { path: '/' });
      }
    }

    router.replace('/login');
  }, [router]);

  // Load all dashboard databases
  const refreshData = async () => {
    setLoading(true);
    try {
      const fetchedOrders = await fetchOrders();
      const fetchedInquiries = await fetchInquiries();
      const fetchedUsers = await fetchUsers();
      const fetchedNotifs = await fetchNotifications();

      setOrders(fetchedOrders);
      setInquiries(fetchedInquiries);
      setUsers(fetchedUsers);
      setNotifications(fetchedNotifs);
    } catch (err) {
      console.error('Failed to load admin databases', err);
      showAlert('Error updating real-time databases. Local fallback remains active.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authChecked) {
      refreshData();
    }
  }, [authChecked]);

  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        name: currentUser.name || '',
        email: currentUser.email || currentUser.username || '',
        phone: currentUser.phone || '',
      });
      setProfileFeedback(null);
    }
  }, [currentUser]);
  
  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Disable body scroll when profile panel is open
  useEffect(() => {
    if (isProfilePanelOpen) {
      document.body.style.overflow = 'hidden';
      setProfileValidationErrors({});
      setProfileFeedback(null);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isProfilePanelOpen]);

  const showAlert = (text: string, type: 'success' | 'error' = 'success') => {
    setAlertMsg({ text, type });
    setTimeout(() => setAlertMsg({ text: '', type: 'success' }), 4000);
  };

  const performLogout = () => {
    logout();
  };

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const handleProfileSave = async () => {
    const trimmedName = (profileForm.name || '').trim();
    const trimmedEmail = (profileForm.email || '').trim();
    const trimmedPhone = (profileForm.phone || '').toString().trim();
    const errors: { [key: string]: string } = {};

    // Name validation
    if (!trimmedName) {
      errors.name = 'Please enter your full name';
    }

    // Email validation regex (simple but effective)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail) {
      errors.email = 'Please enter your email address';
    } else if (!emailRegex.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address (e.g., name@example.com)';
    }

    // Phone number validation (Indian format - 10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    const cleanedPhone = trimmedPhone.replace(/\D/g, '');
    if (trimmedPhone && !phoneRegex.test(cleanedPhone)) {
      errors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (Object.keys(errors).length > 0) {
      setProfileValidationErrors(errors);
      setProfileFeedback({ type: 'error', text: 'Please fix the errors below before saving.' });
      return;
    }

    setProfileValidationErrors({});
    setIsProfileSaving(true);
    setProfileFeedback(null);

    try {
      const existingCookie = Cookies.get('nimra_user');
      const parsedCookieUser = existingCookie ? JSON.parse(existingCookie) : null;
      const updatedSession = {
        ...(parsedCookieUser || {}),
        ID: currentUser?.id || parsedCookieUser?.ID || 0,
        Name: trimmedName,
        Username: trimmedEmail,
        Mobile: cleanedPhone,
        Role: currentUser?.role || parsedCookieUser?.Role || 'Admin',
        Active: true,
      };

      const saveResult = await saveUser(
        {
          ID: currentUser?.id || parsedCookieUser?.ID || 0,
          Name: trimmedName,
          Username: trimmedEmail,
          Mobile: cleanedPhone,
        },
        'update'
      );

      if (!saveResult.success) {
        throw new Error(saveResult.message || 'Unable to update profile');
      }

      Cookies.set('nimra_user', JSON.stringify(updatedSession), { path: '/', sameSite: 'lax' });

      const updatedAdminSession = {
        id: currentUser?.id || parsedCookieUser?.ID || 0,
        username: trimmedEmail,
        role: 'Admin' as const,
        name: trimmedName,
        email: trimmedEmail,
        phone: cleanedPhone,
      };

      localStorage.setItem('nimra_admin_user', JSON.stringify(updatedAdminSession));
      setCurrentUser(updatedAdminSession);
      setProfileFeedback({ type: 'success', text: 'Profile updated successfully. Your admin details are now saved.' });
      showAlert('Profile updated successfully!', 'success');
      window.setTimeout(() => {
        setIsProfilePanelOpen(false);
        setProfileFeedback(null);
      }, 800);
    } catch (error) {
      console.error('Failed to save admin profile', error);
      setProfileFeedback({ type: 'error', text: 'Unable to save your profile right now. Please try again.' });
    } finally {
      setIsProfileSaving(false);
    }
  };

  // Dashboard Stats Calculations
  const deliveredOrders = orders.filter(o => o.status === 'Delivered');
  const totalRevenue = deliveredOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const avgOrderValue = deliveredOrders.length > 0 ? totalRevenue / deliveredOrders.length : 0;
  const uniqueMobiles = new Set(orders.map(o => o.customer?.mobile).filter(Boolean));
  const totalCustomers = uniqueMobiles.size;

  // Sorting and Filtering
  const searchLower = globalSearch.toLowerCase();
  
  // Sort orders by date
  const sortedOrders = [...orders].sort((a, b) => {
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    if (orderSort === 'earliest') {
      if (dateA !== dateB) return dateA - dateB;
      return (a.orderId || '').localeCompare(b.orderId || '');
    } else {
      if (dateA !== dateB) return dateB - dateA;
      return (b.orderId || '').localeCompare(a.orderId || '');
    }
  });

  const filteredOrders = sortedOrders.filter(o => {
    const matchesSearch = String(o.orderId || '').toLowerCase().includes(searchLower) ||
      String(o.customer?.name || '').toLowerCase().includes(searchLower) ||
      String(o.customer?.mobile || '').toLowerCase().includes(searchLower) ||
      String(o.status || '').toLowerCase().includes(searchLower);
    
    const matchesStatus = orderStatusFilter === 'All' || o.status === orderStatusFilter;
    const matchesPayment = orderPaymentFilter === 'All' || o.paymentMethod === orderPaymentFilter;
    
    let matchesDateRange = true;
    if (orderStartDate) {
      const start = new Date(orderStartDate).getTime();
      const created = new Date(o.createdAt).getTime();
      if (created < start) matchesDateRange = false;
    }
    if (orderEndDate) {
      const end = new Date(orderEndDate);
      end.setHours(23, 59, 59, 999);
      const created = new Date(o.createdAt).getTime();
      if (created > end.getTime()) matchesDateRange = false;
    }
    
    return matchesSearch && matchesStatus && matchesPayment && matchesDateRange;
  });

  const filteredProducts = products.filter(p => {
    const matchesSearch = String(p.Name || '').toLowerCase().includes(searchLower) || 
      String(p.Category || '').toLowerCase().includes(searchLower) ||
      String(p.Description || '').toLowerCase().includes(searchLower);
      
    const matchesCategory = productCategoryFilter === 'All' || p.Category === productCategoryFilter;
    const matchesStatus = productStatusFilter === 'All' || 
      (productStatusFilter === 'Active' && p.Active !== false) ||
      (productStatusFilter === 'Inactive' && p.Active === false);
      
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const filteredBanners = banners.filter(b => {
    const matchesSearch = String(b.Title || '').toLowerCase().includes(searchLower) || 
      String(b.Subtitle || '').toLowerCase().includes(searchLower);
      
    const matchesStatus = bannerStatusFilter === 'All' || 
      (bannerStatusFilter === 'Active' && b.Active !== false) ||
      (bannerStatusFilter === 'Inactive' && b.Active === false);
      
    return matchesSearch && matchesStatus;
  });

  const filteredFaqs = faqs.filter(f => {
    const matchesSearch = String(f.Question || '').toLowerCase().includes(searchLower) || 
      String(f.Answer || '').toLowerCase().includes(searchLower);
      
    const matchesStatus = faqStatusFilter === 'All' || 
      (faqStatusFilter === 'Active' && f.Active !== false) ||
      (faqStatusFilter === 'Inactive' && f.Active === false);
      
    return matchesSearch && matchesStatus;
  });

  const sortedInquiries = [...inquiries].sort((a, b) => {
    const dateA = new Date(a.Timestamp || 0).getTime();
    const dateB = new Date(b.Timestamp || 0).getTime();
    return inquirySort === 'earliest' ? dateA - dateB : dateB - dateA;
  });

  const filteredInquiries = sortedInquiries.filter(i => {
    const matchesSearch = String(i.Name || '').toLowerCase().includes(searchLower) || 
      String(i.Subject || '').toLowerCase().includes(searchLower) || 
      String(i.Message || '').toLowerCase().includes(searchLower) ||
      String(i.Email || '').toLowerCase().includes(searchLower) ||
      String(i.Phone || '').toLowerCase().includes(searchLower);

    let matchesDateRange = true;
    if (inquiryStartDate) {
      const start = new Date(inquiryStartDate).getTime();
      const created = new Date(i.Timestamp).getTime();
      if (created < start) matchesDateRange = false;
    }
    if (inquiryEndDate) {
      const end = new Date(inquiryEndDate);
      end.setHours(23, 59, 59, 999);
      const created = new Date(i.Timestamp).getTime();
      if (created > end.getTime()) matchesDateRange = false;
    }

    return matchesSearch && matchesDateRange;
  });

  const filteredUsers = users.filter(u => {
    const matchesSearch = String(u.Name || '').toLowerCase().includes(searchLower) || 
      String(u.Username || '').toLowerCase().includes(searchLower) || 
      String(u.Role || '').toLowerCase().includes(searchLower);
      
    const matchesRole = userRoleFilter === 'All' || u.Role === userRoleFilter;
    const matchesStatus = userStatusFilter === 'All' || 
      (userStatusFilter === 'Active' && u.Active !== false) ||
      (userStatusFilter === 'Inactive' && u.Active === false);
      
    return matchesSearch && matchesRole && matchesStatus;
  });

  const sortedNotifications = [...notifications].sort((a, b) => {
    const dateA = new Date(a.Timestamp || 0).getTime();
    const dateB = new Date(b.Timestamp || 0).getTime();
    return notificationSort === 'earliest' ? dateA - dateB : dateB - dateA;
  });

  const filteredNotifications = sortedNotifications.filter(n => 
    String(n.Title || '').toLowerCase().includes(searchLower) || 
    String(n.Message || '').toLowerCase().includes(searchLower)
  );

  // Order status helper styling
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

  // Update order status callback
  const handleUpdateStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setSaveLoading(true);
    try {
      const res = await updateOrderStatus(selectedOrder.orderId, orderStatusVal);
      if (res.success) {
        showAlert(res.message);
        // Refresh local orders list
        setOrders(prev => prev.map(o => o.orderId === selectedOrder.orderId ? { ...o, status: orderStatusVal as any, updatedAt: new Date().toISOString() } : o));
        setSelectedOrder(null);
      } else {
        showAlert(res.message, 'error');
      }
    } catch (err) {
      showAlert('Failed to connect to backend api.', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  // CRUD Product callbacks
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setSaveLoading(true);
    const action = editingProduct.ID ? 'update' : 'create';
    try {
      const res = await saveProduct(editingProduct, action);
      if (res.success) {
        showAlert(res.message);
        setProductFormOpen(false);
        // Reload products state
        if (action === 'create') {
          setProducts(prev => [...prev, { ...editingProduct, ID: res.ID } as Product]);
        } else {
          setProducts(prev => prev.map(p => p.ID === editingProduct.ID ? editingProduct as Product : p));
        }
      } else {
        showAlert(res.message, 'error');
      }
    } catch (err) {
      showAlert('Failed to save product changes', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleProductDelete = async (id: string | number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    setSaveLoading(true);
    try {
      const res = await saveProduct({ ID: id }, 'delete');
      if (res.success) {
        showAlert(res.message);
        setProducts(prev => prev.filter(p => p.ID !== id));
      } else {
        showAlert(res.message, 'error');
      }
    } catch (err) {
      showAlert('Failed to delete product', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  // CRUD Banner callbacks
  const handleBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner) return;
    setSaveLoading(true);
    const action = editingBanner.ID ? 'update' : 'create';
    try {
      const res = await saveBanner(editingBanner, action);
      if (res.success) {
        showAlert(res.message);
        setBannerFormOpen(false);
        if (action === 'create') {
          setBanners(prev => [...prev, { ...editingBanner, ID: res.ID } as Banner]);
        } else {
          setBanners(prev => prev.map(b => b.ID === editingBanner.ID ? editingBanner as Banner : b));
        }
      } else {
        showAlert(res.message, 'error');
      }
    } catch (err) {
      showAlert('Failed to save banner changes', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleBannerDelete = async (id: string | number) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    setSaveLoading(true);
    try {
      const res = await saveBanner({ ID: id }, 'delete');
      if (res.success) {
        showAlert(res.message);
        setBanners(prev => prev.filter(b => b.ID !== id));
      } else {
        showAlert(res.message, 'error');
      }
    } catch (err) {
      showAlert('Failed to delete banner', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  // CRUD FAQ callbacks
  const handleFAQSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFAQ) return;
    setSaveLoading(true);
    const action = editingFAQ.ID ? 'update' : 'create';
    try {
      const res = await saveFAQ(editingFAQ, action);
      if (res.success) {
        showAlert(res.message);
        setFAQFormOpen(false);
        if (action === 'create') {
          setFaqs(prev => [...prev, { ...editingFAQ, ID: res.ID } as FAQ]);
        } else {
          setFaqs(prev => prev.map(f => f.ID === editingFAQ.ID ? editingFAQ as FAQ : f));
        }
      } else {
        showAlert(res.message, 'error');
      }
    } catch (err) {
      showAlert('Failed to save FAQ changes', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleFAQDelete = async (id: string | number) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;
    setSaveLoading(true);
    try {
      const res = await saveFAQ({ ID: id }, 'delete');
      if (res.success) {
        showAlert(res.message);
        setFaqs(prev => prev.filter(f => f.ID !== id));
      } else {
        showAlert(res.message, 'error');
      }
    } catch (err) {
      showAlert('Failed to delete FAQ', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  // CRUD User callbacks
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSaveLoading(true);
    const action = editingUser.ID ? 'update' : 'create';
    try {
      const res = await saveUser(editingUser, action);
      if (res.success) {
        showAlert(res.message);
        setUserFormOpen(false);
        if (action === 'create') {
          setUsers(prev => [...prev, { ...editingUser, ID: res.ID, Active: true } as AdminUser]);
        } else {
          setUsers(prev => prev.map(u => u.ID === editingUser.ID ? editingUser as AdminUser : u));
        }
      } else {
        showAlert(res.message, 'error');
      }
    } catch (err) {
      showAlert('Failed to save user account', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleUserDelete = async (id: string | number) => {
    if (currentUser?.username === users.find(u => u.ID === id)?.Username) {
      showAlert("You cannot delete your own logged-in user account!", 'error');
      return;
    }
    if (!confirm('Are you sure you want to delete this admin account?')) return;
    setSaveLoading(true);
    try {
      const res = await saveUser({ ID: id }, 'delete');
      if (res.success) {
        showAlert(res.message);
        setUsers(prev => prev.filter(u => u.ID !== id));
      } else {
        showAlert(res.message, 'error');
      }
    } catch (err) {
      showAlert('Failed to delete user account', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  // Notification Broadcast Submit
  const handleSendNotif = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle || !notifMessage) return;
    setSaveLoading(true);
    try {
      const res = await saveNotification({ Title: notifTitle, Message: notifMessage }, 'create');
      if (res.success) {
        showAlert('Notification logged and broadcasted successfully!');
        setNotifTitle('');
        setNotifMessage('');
        // Reload notifications list
        const fetchedNotifs = await fetchNotifications();
        setNotifications(fetchedNotifs);
      } else {
        showAlert(res.message, 'error');
      }
    } catch (err) {
      showAlert('Failed to broadcast announcement', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleNotifDelete = async (id: string | number) => {
    if (!confirm('Are you sure you want to delete this notification log?')) return;
    setSaveLoading(true);
    try {
      const res = await saveNotification({ ID: id }, 'delete');
      if (res.success) {
        showAlert(res.message);
        setNotifications(prev => prev.filter(n => n.ID !== id));
      } else {
        showAlert(res.message, 'error');
      }
    } catch (err) {
      showAlert('Failed to delete notification', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  // Settings Save
  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      const res = await saveCompanyInfo(companyInfo);
      if (res.success) {
        showAlert(res.message);
      } else {
        showAlert(res.message, 'error');
      }
    } catch (err) {
      showAlert('Failed to update settings', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSettingsFieldChange = (key: string, value: string) => {
    setCompanyInfo(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Dynamic Chart Calculations
  // Donut Chart calculations
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

  // Line Chart calculations
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

  const last7Days = [];
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

  const formatDateLabel = (dateStr: string) => {
    try {
      const [_, month, day] = dateStr.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIdx = parseInt(month, 10) - 1;
      return `${monthNames[monthIdx]} ${day}`;
    } catch {
      return dateStr;
    }
  };

  // Hover tracker
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

  if (!currentUser) return null;

  return (
    <>
      <div className="admin-container">
      {/* SIDEBAR */}
      <aside className={`admin-sidebar glass ${isProfilePanelOpen ? 'blur-background' : ''}`}>
        <div className="sidebar-brand">
          <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 5C50 5 15 45 15 65C15 84.33 30.67 100 50 100C69.33 100 85 84.33 85 65C85 45 50 5 50 5Z" fill="url(#sidebarWaterGrad)"/>
            <defs>
              <linearGradient id="sidebarWaterGrad" x1="50" y1="5" x2="50" y2="100" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00E5FF"/>
                <stop offset="1" stopColor="#00a299"/>
              </linearGradient>
            </defs>
          </svg>
          <span className="brand-text">NIMRA Console</span>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">{currentUser.name[0]}</div>
          <div className="user-details">
            <span className="user-name">{currentUser.name}</span>
            <span className="user-role badge badge-primary">{currentUser.role}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button onClick={() => setActiveTab('dashboard')} className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}>
            📊 Overview
          </button>
          <button onClick={() => setActiveTab('orders')} className={`nav-btn ${activeTab === 'orders' ? 'active' : ''}`}>
            🛒 Orders
          </button>
          <button onClick={() => setActiveTab('products')} className={`nav-btn ${activeTab === 'products' ? 'active' : ''}`}>
            💧 Products
          </button>
          <button onClick={() => setActiveTab('banners')} className={`nav-btn ${activeTab === 'banners' ? 'active' : ''}`}>
            🖼️ Homepage Banners
          </button>
          <button onClick={() => setActiveTab('faqs')} className={`nav-btn ${activeTab === 'faqs' ? 'active' : ''}`}>
            ❓ Store FAQs
          </button>
          <button onClick={() => setActiveTab('inquiries')} className={`nav-btn ${activeTab === 'inquiries' ? 'active' : ''}`}>
            ✉️ Inquiries
          </button>
          <button onClick={() => setActiveTab('users')} className={`nav-btn ${activeTab === 'users' ? 'active' : ''}`}>
            👥 Users
          </button>
          <button onClick={() => setActiveTab('notifications')} className={`nav-btn ${activeTab === 'notifications' ? 'active' : ''}`}>
            🔔 Announcements
          </button>
          <button onClick={() => setActiveTab('settings')} className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`}>
            ⚙️ Settings
          </button>
        </nav>
      </aside>

      {/* MAIN VIEW */}
      <main className={`admin-main animate-fade-in ${isProfilePanelOpen ? 'blur-background' : ''}`}>
        {/* TOP BAR */}
        <header className="main-header glass">
          <h1>
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Panel
          </h1>
          <div className="header-actions">
            {activeTab !== 'dashboard' && activeTab !== 'notifications' && activeTab !== 'settings' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexGrow: 1, maxWidth: '500px' }}>
                <div className="search-container" style={{ position: 'relative', display: 'flex', alignItems: 'center', flexGrow: 1, width: '100%' }}>
                  <input
                    type="text"
                    placeholder={`Search ${activeTab}...`}
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    className="search-bar-glass"
                  />
                  <svg 
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="search-icon-svg"
                    style={{ 
                      position: 'absolute', 
                      left: '18px', 
                      pointerEvents: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      zIndex: 2
                    }}
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  {globalSearch && (
                    <button
                      onClick={() => setGlobalSearch('')}
                      style={{
                        position: 'absolute',
                        right: '16px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px',
                        borderRadius: '50%',
                        zIndex: 3,
                        transition: 'all var(--transition-fast)'
                      }}
                      className="search-clear-btn"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
                  style={{
                    background: showFilters ? 'var(--primary-color)' : 'var(--bg-secondary)',
                    color: showFilters ? 'white' : 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    padding: '8px 14px',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    transition: 'all var(--transition-fast)',
                    flexShrink: 0
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                  </svg>
                  Filters
                </button>
              </div>
            )}
            <button onClick={refreshData} disabled={loading} className="btn-refresh">
              {loading ? 'Syncing...' : '🔄 Sync Live Sheets'}
            </button>
            <span className="db-indicator">
              <span className="dot active"></span>
              {process.env.NEXT_PUBLIC_APPS_SCRIPT_URL ? 'Connected to Google Sheets' : 'Local Fallback Mode'}
            </span>
            
            {/* Profile Dropdown */}
            <div className="profile-dropdown" ref={profileDropdownRef}>
              <button 
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="profile-btn"
              >
                <div className="profile-avatar">{currentUser.name[0]}</div>
              </button>
              
              {isProfileDropdownOpen && (
                <div className="profile-menu">
                  <div className="profile-header">
                    <div className="menu-avatar">{currentUser.name[0]}</div>
                    <div>
                      <div className="menu-name">{currentUser.name}</div>
                      <div className="menu-role">{currentUser.role}</div>
                    </div>
                  </div>
                  <div className="menu-divider"></div>
                  <button 
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      setIsProfilePanelOpen(true);
                    }}
                    className="menu-item"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    <span className="menu-label">Edit Profile</span>
                  </button>
                  <div
                    className="menu-item"
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      const themeToggle = document.querySelector<HTMLElement>('.theme-toggle-btn');
                      themeToggle?.click();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        const themeToggle = document.querySelector<HTMLElement>('.theme-toggle-btn');
                        themeToggle?.click();
                      }
                    }}
                  >
                    <ThemeToggle />
                    <span className="menu-label">Theme</span>
                  </div>
                  <button 
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      handleLogout();
                    }}
                    className="menu-item menu-logout"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    <span className="menu-label">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ALERTS */}
        {alertMsg.text && (
          <div className={`toast animate-fade-in ${alertMsg.type}`}>
            {alertMsg.text}
          </div>
        )}

        {loading && (
          <div className="main-loading-overlay">
            <div className="spinner"></div>
            <p>Loading NIMRA Databases...</p>
          </div>
        )}

        {/* TAB CONTENTS */}
        {!loading && (
          <div className="tab-viewport">
            
            {/* OVERVIEW DASHBOARD */}
            {activeTab === 'dashboard' && (
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
                          {/* Simple Donut SVG */}
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
            )}

            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
              <div className="orders-tab card glass">
                {showFilters && (
                  <div className="filter-bar animate-fade-in">
                    <div className="filter-group">
                      <label>Status:</label>
                      <CustomSelect
                        value={orderStatusFilter}
                        onChange={setOrderStatusFilter}
                        clearable={true}
                        onClear={() => setOrderStatusFilter('All')}
                        options={[
                          { value: 'All', label: 'All Statuses' },
                          { value: 'Pending', label: 'Pending' },
                          { value: 'Confirmed', label: 'Confirmed' },
                          { value: 'Processing', label: 'Processing' },
                          { value: 'Dispatched', label: 'Dispatched' },
                          { value: 'Out for Delivery', label: 'Out for Delivery' },
                          { value: 'Delivered', label: 'Delivered' },
                          { value: 'Cancelled', label: 'Cancelled' },
                        ]}
                      />
                    </div>
                    <div className="filter-group">
                      <label>Payment:</label>
                      <CustomSelect
                        value={orderPaymentFilter}
                        onChange={setOrderPaymentFilter}
                        clearable={true}
                        onClear={() => setOrderPaymentFilter('All')}
                        options={[
                          { value: 'All', label: 'All Payments' },
                          { value: 'Cash on Delivery', label: 'Cash on Delivery' },
                          { value: 'UPI / Online', label: 'UPI / Online' },
                          { value: 'Google Pay', label: 'Google Pay' },
                        ]}
                      />
                    </div>
                    <div className="filter-group">
                      <label>Date Sort:</label>
                      <CustomSelect
                        value={orderSort}
                        onChange={setOrderSort}
                        clearable={true}
                        onClear={() => setOrderSort('latest')}
                        options={[
                          { value: 'latest', label: 'Latest First' },
                          { value: 'earliest', label: 'Earliest First' },
                        ]}
                      />
                    </div>
                    <div className="filter-group">
                      <label>From:</label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          type="date"
                          value={orderStartDate}
                          onChange={(e) => setOrderStartDate(e.target.value)}
                          className="form-input filter-input"
                        />
                      </div>
                    </div>
                    <div className="filter-group">
                      <label>To:</label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="date"
                          value={orderEndDate}
                          min={orderStartDate}
                          onChange={(e) => setOrderEndDate(e.target.value)}
                          className="form-input filter-input"
                        />
                        {(orderStatusFilter !== 'All' || orderPaymentFilter !== 'All' || orderSort !== 'latest' || orderStartDate !== '' || orderEndDate !== '') && (
                          <button className="btn-clear" onClick={handleClearOrderFilters} title="Clear Filters" style={{ display: 'inline-flex', flexShrink: 0, whiteSpace: 'nowrap', alignItems: 'center', justifyContent: 'center', padding: '0.45rem 0.55rem' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M23 4v6h-6"></path>
                              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Status</th>
                        <th>Method</th>
                        <th>Total</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((o, idx) => (
                        <tr key={o.orderId || idx}>
                          <td><strong>{o.orderId}</strong></td>
                          <td>{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'N/A'}</td>
                          <td>
                            <div>{o.customer?.name || 'N/A'}</div>
                            <small>{o.customer?.mobile || 'N/A'}</small>
                          </td>
                          <td>
                            <span className={`badge ${getStatusBadge(o.status)}`}>{o.status}</span>
                          </td>
                          <td>{o.paymentMethod}</td>
                          <td><strong>{formatCurrency(o.total)}</strong></td>
                          <td>
                            <button className="btn-table btn-edit" onClick={() => {
                              setSelectedOrder(o);
                              setOrderStatusVal(o.status);
                            }}>
                              Manage Status
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredOrders.length === 0 && (
                        <tr>
                          <td colSpan={7} className="empty-td">No orders found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* PRODUCTS TAB */}
            {activeTab === 'products' && (
              <div className="products-tab card glass">
                <div className="section-head-btn">
                  <h3>Products Catalog ({products.length})</h3>
                  <button className="btn btn-primary btn-add" onClick={() => {
                    setEditingProduct({ Name: '', Category: 'Packaged Water', Volume: '1L', Price: '', Description: '', ImageUrl: '', Active: true });
                    setProductFormOpen(true);
                  }}>
                    ➕ Add Product
                  </button>
                </div>

                {showFilters && (
                  <div className="filter-bar animate-fade-in">
                    <div className="filter-group">
                      <label>Category:</label>
                      <CustomSelect
                        value={productCategoryFilter}
                        onChange={setProductCategoryFilter}
                        clearable={true}
                        onClear={() => setProductCategoryFilter('All')}
                        options={[
                          { value: 'All', label: 'All Categories' },
                          { value: 'Packaged Water', label: 'Packaged Water' },
                          { value: 'Mineral Water', label: 'Mineral Water' },
                          { value: 'Bulk Water', label: 'Bulk Water' },
                          { value: 'Upcoming RUSH Soda', label: 'Upcoming RUSH Soda' },
                        ]}
                      />
                    </div>
                    <div className="filter-group">
                      <label>Status:</label>
                      <CustomSelect
                        value={productStatusFilter}
                        onChange={setProductStatusFilter}
                        clearable={true}
                        onClear={() => setProductStatusFilter('All')}
                        options={[
                          { value: 'All', label: 'All Statuses' },
                          { value: 'Active', label: 'Active' },
                          { value: 'Inactive', label: 'Inactive' },
                        ]}
                      />
                    </div>

                  </div>
                )}

                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Volume</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((p) => (
                        <tr key={p.ID}>
                          <td>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.ImageUrl || '/favicon.ico'} alt={p.Name} className="table-thumbnail" />
                          </td>
                          <td><strong>{p.Name}</strong></td>
                          <td>{p.Category}</td>
                          <td>{p.Volume}</td>
                          <td><strong>{formatCurrency(Number(p.Price))}</strong></td>
                          <td>
                            <span className={`badge ${p.Active !== false ? 'badge-primary' : 'badge-cancelled'}`}>
                              {p.Active !== false ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <div className="actions-flex">
                              <button className="btn-table btn-edit" onClick={() => {
                                setEditingProduct(p);
                                setProductFormOpen(true);
                              }}>
                                Edit
                              </button>
                              <button className="btn-table btn-delete" onClick={() => handleProductDelete(p.ID)}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredProducts.length === 0 && (
                        <tr>
                          <td colSpan={7} className="empty-td">No products found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* HOMEPAGE BANNERS */}
            {activeTab === 'banners' && (
              <div className="banners-tab card glass">
                <div className="section-head-btn">
                  <h3>Homepage Slider Banners</h3>
                  <button className="btn btn-primary btn-add" onClick={() => {
                    setEditingBanner({ Title: '', Subtitle: '', ImageUrl: '', ButtonText: 'Order Now', ButtonLink: '/products', Active: true });
                    setBannerFormOpen(true);
                  }}>
                    ➕ Add Banner Slide
                  </button>
                </div>

                {showFilters && (
                  <div className="filter-bar animate-fade-in">
                    <div className="filter-group">
                      <label>Status:</label>
                      <CustomSelect
                        value={bannerStatusFilter}
                        onChange={setBannerStatusFilter}
                        clearable={true}
                        onClear={() => setBannerStatusFilter('All')}
                        options={[
                          { value: 'All', label: 'All Statuses' },
                          { value: 'Active', label: 'Active' },
                          { value: 'Inactive', label: 'Inactive' },
                        ]}
                      />
                    </div>

                  </div>
                )}

                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Slide Image</th>
                        <th>Title</th>
                        <th>Subtitle</th>
                        <th>Button Text</th>
                        <th>Link</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBanners.map((b) => (
                        <tr key={b.ID}>
                          <td>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={b.ImageUrl} alt={b.Title} className="table-thumbnail wide" />
                          </td>
                          <td><strong>{b.Title}</strong></td>
                          <td className="max-cell-width">{b.Subtitle}</td>
                          <td>{b.ButtonText}</td>
                          <td><code>{b.ButtonLink}</code></td>
                          <td>
                            <span className={`badge ${b.Active !== false ? 'badge-primary' : 'badge-cancelled'}`}>
                              {b.Active !== false ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <div className="actions-flex">
                              <button className="btn-table btn-edit" onClick={() => {
                                setEditingBanner(b);
                                setBannerFormOpen(true);
                              }}>
                                Edit
                              </button>
                              <button className="btn-table btn-delete" onClick={() => handleBannerDelete(b.ID)}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* FAQS TAB */}
            {activeTab === 'faqs' && (
              <div className="faqs-tab card glass">
                <div className="section-head-btn">
                  <h3>Frequently Asked Questions</h3>
                  <button className="btn btn-primary btn-add" onClick={() => {
                    setEditingFAQ({ Question: '', Answer: '', Active: true });
                    setFAQFormOpen(true);
                  }}>
                    ➕ Add FAQ
                  </button>
                </div>

                {showFilters && (
                  <div className="filter-bar animate-fade-in">
                    <div className="filter-group">
                      <label>Status:</label>
                      <CustomSelect
                        value={faqStatusFilter}
                        onChange={setFaqStatusFilter}
                        clearable={true}
                        onClear={() => setFaqStatusFilter('All')}
                        options={[
                          { value: 'All', label: 'All Statuses' },
                          { value: 'Active', label: 'Active' },
                          { value: 'Inactive', label: 'Inactive' },
                        ]}
                      />
                    </div>

                  </div>
                )}

                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Question</th>
                        <th>Answer</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFaqs.map((f) => (
                        <tr key={f.ID}>
                          <td>{f.ID}</td>
                          <td><strong>{f.Question}</strong></td>
                          <td className="max-cell-width">{f.Answer}</td>
                          <td>
                            <span className={`badge ${f.Active !== false ? 'badge-primary' : 'badge-cancelled'}`}>
                              {f.Active !== false ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <div className="actions-flex">
                              <button className="btn-table btn-edit" onClick={() => {
                                setEditingFAQ(f);
                                setFAQFormOpen(true);
                              }}>
                                Edit
                              </button>
                              <button className="btn-table btn-delete" onClick={() => handleFAQDelete(f.ID)}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* INQUIRIES TAB */}
            {activeTab === 'inquiries' && (
              <div className="inquiries-tab card glass">
                {showFilters && (
                  <div className="filter-bar animate-fade-in">
                    <div className="filter-group">
                      <label>Date Sort:</label>
                      <CustomSelect
                        value={inquirySort}
                        onChange={setInquirySort}
                        clearable={true}
                        onClear={() => setInquirySort('latest')}
                        options={[
                          { value: 'latest', label: 'Latest First' },
                          { value: 'earliest', label: 'Earliest First' },
                        ]}
                      />
                    </div>
                    <div className="filter-group">
                      <label>From:</label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          type="date"
                          value={inquiryStartDate}
                          onChange={(e) => setInquiryStartDate(e.target.value)}
                          className="form-input filter-input"
                        />
                      </div>
                    </div>
                    <div className="filter-group">
                      <label>To:</label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          type="date"
                          value={inquiryEndDate}
                          min={inquiryStartDate}
                          onChange={(e) => setInquiryEndDate(e.target.value)}
                          className="form-input filter-input"
                        />
                      </div>
                    </div>
                  </div>
                )}
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Customer</th>
                        <th>Inquiry Details</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInquiries.map((inq, index) => (
                        <tr key={index}>
                          <td>{new Date(inq.Timestamp).toLocaleString()}</td>
                          <td>
                            <div><strong>{inq.Name}</strong></div>
                            <small>{inq.Phone}</small>
                            {inq.Email && <div><small>{inq.Email}</small></div>}
                          </td>
                          <td>
                            <div style={{ fontWeight: 800, color: 'var(--primary-color)' }}>{inq.Subject}</div>
                            <p className="message-cell">{inq.Message}</p>
                          </td>
                          <td>
                            <div className="actions-flex vertical">
                              <a href={`tel:${inq.Phone}`} className="btn-table btn-edit text-center">
                                📞 Call
                              </a>
                              <a
                                href={`https://wa.me/${String(inq.Phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${inq.Name}, thank you for reaching out to NIMRA regarding "${inq.Subject}".`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-table btn-whatsapp"
                              >
                                💬 WhatsApp
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredInquiries.length === 0 && (
                        <tr>
                          <td colSpan={4} className="empty-td">No inquiries found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* USERS TAB */}
            {activeTab === 'users' && (
              <div className="users-tab card glass">
                {currentUser.role !== 'Admin' ? (
                  <div className="access-denied-block">
                    <h2>🚫 Administrative Privileges Required</h2>
                    <p>Only full administrators can view, register, or delete system user accounts.</p>
                  </div>
                ) : (
                  <>
                    <div className="section-head-btn">
                      <h3>Portal User Accounts</h3>
                      <button className="btn btn-primary btn-add" onClick={() => {
                        setEditingUser({ Username: '', Password: '', Role: 'Customer', Name: '', Active: true });
                        setUserFormOpen(true);
                      }}>
                        ➕ Create User
                      </button>
                    </div>

                    {showFilters && (
                      <div className="filter-bar animate-fade-in">
                        <div className="filter-group">
                          <label>Role:</label>
                          <CustomSelect
                            value={userRoleFilter}
                            onChange={setUserRoleFilter}
                            clearable={true}
                            onClear={() => setUserRoleFilter('All')}
                            options={[
                              { value: 'All', label: 'All Roles' },
                              { value: 'Admin', label: 'Admin' },
                              { value: 'Customer', label: 'Customer' },
                            ]}
                          />
                        </div>
                        <div className="filter-group">
                          <label>Status:</label>
                          <CustomSelect
                            value={userStatusFilter}
                            onChange={setUserStatusFilter}
                            clearable={true}
                            onClear={() => setUserStatusFilter('All')}
                            options={[
                              { value: 'All', label: 'All Statuses' },
                              { value: 'Active', label: 'Active' },
                              { value: 'Inactive', label: 'Disabled' },
                            ]}
                          />
                        </div>

                      </div>
                    )}

                    <div className="table-responsive">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Username</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map((u) => (
                            <tr key={u.ID}>
                              <td>{u.ID}</td>
                              <td><strong>{u.Name}</strong></td>
                              <td><code>{u.Username}</code></td>
                              <td>
                                <span className={`badge ${u.Role === 'Admin' ? 'badge-primary' : 'badge-secondary'}`}>
                                  {u.Role}
                                </span>
                              </td>
                              <td>
                                <span className={`badge ${u.Active !== false ? 'badge-primary' : 'badge-cancelled'}`}>
                                  {u.Active !== false ? 'Active' : 'Disabled'}
                                </span>
                              </td>
                              <td>
                                <div className="actions-flex">
                                  <button className="btn-table btn-edit" onClick={() => {
                                    setEditingUser(u);
                                    setUserFormOpen(true);
                                  }}>
                                    Edit
                                  </button>
                                  <button className="btn-table btn-delete" onClick={() => handleUserDelete(u.ID)}>
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ANNOUNCEMENTS & NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div className="notifications-tab card glass">
                <div className="notif-grid">
                  {/* Sender Panel */}
                  <form className="notif-sender-panel glass-inner" onSubmit={handleSendNotif}>
                    <h3>Broadcast System Update</h3>
                    <div className="form-group" style={{ marginTop: '1rem' }}>
                      <label>Announcement Title</label>
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
                      📢 Log announcement
                    </button>
                  </form>

                  {/* Notifications History Log */}
                  <div className="notif-logs-panel">
                    <h3>Sent Announcements Log</h3>
                    <div className="logs-list">
                      {filteredNotifications.map((n) => (
                        <div key={n.ID} className="log-item glass-inner">
                          <div className="log-header">
                            <strong>{n.Title}</strong>
                            <button className="btn-delete-log" onClick={() => handleNotifDelete(n.ID)}>✕</button>
                          </div>
                          <span className="log-time">{new Date(n.Timestamp).toLocaleString()}</span>
                          <p>{n.Message}</p>
                        </div>
                      ))}
                      {filteredNotifications.length === 0 && (
                        <p className="empty">No announcements found.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SETTINGS (Company Info) */}
            {activeTab === 'settings' && (
              <div className="settings-tab">
                {currentUser.role !== 'Admin' ? (
                  <div className="access-denied-block">
                    <h2>🚫 Administrative Privileges Required</h2>
                    <p>Only full administrators can view, register, or edit core company settings.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSettingsSubmit} className="settings-form">
                    <div className="settings-header-banner" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem' }}>
                      <div className="settings-banner-icon" style={{ fontSize: '2rem' }}>⚙️</div>
                      <div>
                        <h3 style={{ margin: 0 }}>NIMRA Brand & Contact Configurator</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                          These settings sync instantly across all checkout panels, headers, maps, and social integrations on both Customer Web and Customer Mobile applications.
                        </p>
                      </div>
                    </div>

                    {/* SECTION 1: Brand & Contact Info */}
                    <div className="settings-section">
                      <div className="settings-section-title">
                        <span>🏷️</span> Brand Details & Social Channels
                      </div>
                      <div className="settings-grid">
                        <div className="form-group">
                          <label>Brand Name</label>
                          <input
                            required
                            type="text"
                            value={companyInfo.BrandName || ''}
                            onChange={(e) => handleSettingsFieldChange('BrandName', e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Support Phone Number</label>
                          <input
                            required
                            type="text"
                            value={companyInfo.Phone || ''}
                            onChange={(e) => handleSettingsFieldChange('Phone', e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Contact Email Address</label>
                          <input
                            required
                            type="email"
                            value={companyInfo.Email || ''}
                            onChange={(e) => handleSettingsFieldChange('Email', e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>WhatsApp Registry Number (Country Code Prepended)</label>
                          <input
                            required
                            type="text"
                            value={companyInfo.WhatsAppNumber || ''}
                            onChange={(e) => handleSettingsFieldChange('WhatsAppNumber', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2: Operations & Plant Locations */}
                    <div className="settings-section">
                      <div className="settings-section-title">
                        <span>📍</span> Operations & Plant Locations
                      </div>
                      <div className="form-group">
                        <label>Office Address Location Description</label>
                        <input
                          required
                          type="text"
                          value={companyInfo.OfficeAddress || ''}
                          onChange={(e) => handleSettingsFieldChange('OfficeAddress', e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ marginTop: '1.25rem' }}>
                        <label>Packaging Plant Address Location Description</label>
                        <input
                          required
                          type="text"
                          value={companyInfo.PlantAddress || ''}
                          onChange={(e) => handleSettingsFieldChange('PlantAddress', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* SECTION 3: Brand Narrative & Identity */}
                    <div className="settings-section">
                      <div className="settings-section-title">
                        <span>📖</span> Brand Story & Quality Standards
                      </div>
                      <div className="form-group">
                        <label>About Us Brand Story Narrative</label>
                        <textarea
                          rows={4}
                          value={companyInfo.AboutStory || ''}
                          onChange={(e) => handleSettingsFieldChange('AboutStory', e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ marginTop: '1.25rem' }}>
                        <label>Quality Standards Narrative Text</label>
                        <textarea
                          rows={3}
                          value={companyInfo.QualityText || ''}
                          onChange={(e) => handleSettingsFieldChange('QualityText', e.target.value)}
                        />
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%', display: 'flex', justifyContent: 'center' }} disabled={saveLoading}>
                      {saveLoading ? 'Saving Info...' : '💾 Overwrite Company Info'}
                    </button>
                  </form>
                )}
              </div>
            )}

          </div>
        )}
      </main>

      {/* ==================================================== */}
      {/* MODAL SYSTEM */}
      {/* ==================================================== */}

      {/* ORDER MANAGE STATUS DIALOG */}
      {selectedOrder && (
        <div className="modal-backdrop glass">
          <div className="modal-card animate-fade-in">
            <div className="modal-header">
              <h2>Manage Order #{String(selectedOrder.orderId || '').slice(-6)}</h2>
              <button className="close-btn" onClick={() => setSelectedOrder(null)}>✕</button>
            </div>
            
            <form onSubmit={handleUpdateStatusSubmit} className="modal-body">
              <div className="modal-info-block">
                <div><strong>Client Name:</strong> {selectedOrder.customer.name}</div>
                <div><strong>Mobile:</strong> {selectedOrder.customer.mobile}</div>
                <div><strong>Address:</strong> {selectedOrder.customer.address}, {selectedOrder.customer.city}, {selectedOrder.customer.state} - {selectedOrder.customer.pincode}</div>
                {selectedOrder.customer.instructions && (
                  <div className="instructions-callout"><strong>Instructions:</strong> {selectedOrder.customer.instructions}</div>
                )}
              </div>

              <div className="order-items-summary">
                <h4>Items Ordered</h4>
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="order-item-row">
                    <span>{item.name} x {item.quantity}</span>
                  </div>
                ))}
                <div style={{ marginTop: '0.5rem', textAlign: 'right', fontWeight: 800 }}>
                  Grand Total: {formatCurrency(selectedOrder.total)}
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>Update Delivery Status</label>
                <CustomSelect
                  value={orderStatusVal}
                  onChange={setOrderStatusVal}
                  options={[
                    { value: 'Pending', label: 'Pending' },
                    { value: 'Confirmed', label: 'Confirmed' },
                    { value: 'Processing', label: 'Processing' },
                    { value: 'Dispatched', label: 'Dispatched' },
                    { value: 'Out for Delivery', label: 'Out for Delivery' },
                    { value: 'Delivered', label: 'Delivered' },
                    { value: 'Cancelled', label: 'Cancelled' },
                  ]}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saveLoading}>
                  {saveLoading ? 'Updating Status...' : 'Apply Status Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRODUCT CRUD DIALOG */}
      {productFormOpen && editingProduct && (
        <div className="modal-backdrop glass">
          <div className="modal-card animate-fade-in">
            <div className="modal-header">
              <h2>{editingProduct.ID ? 'Edit Product ID #' + editingProduct.ID : 'Add New Product'}</h2>
              <button className="close-btn" onClick={() => setProductFormOpen(false)}>✕</button>
            </div>
            
            <form onSubmit={handleProductSubmit} className="modal-body">
              <div className="form-group">
                <label>Product Catalog Name</label>
                <input
                  required
                  type="text"
                  value={editingProduct.Name || ''}
                  onChange={(e) => setEditingProduct(prev => ({ ...prev, Name: e.target.value }))}
                  placeholder="e.g. NIMRA 1 Litre Bottle"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Volume Format</label>
                  <input
                    required
                    type="text"
                    value={editingProduct.Volume || ''}
                    onChange={(e) => setEditingProduct(prev => ({ ...prev, Volume: e.target.value }))}
                    placeholder="e.g. 1L, 20L Jar, 500ml"
                  />
                </div>
                <div className="form-group">
                  <label>Unit Price (Rs)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={editingProduct.Price || ''}
                    onChange={(e) => setEditingProduct(prev => ({ ...prev, Price: e.target.value }))}
                    placeholder="e.g. 20.00"
                  />
                </div>
              </div>

              <div className="form-row" style={{ zIndex: 12, position: 'relative' }}>
                <div className="form-group">
                  <label>Product Category</label>
                  <CustomSelect
                    value={editingProduct.Category || 'Packaged Water'}
                    onChange={(val) => setEditingProduct(prev => ({ ...prev, Category: val }))}
                    options={[
                      { value: 'Packaged Water', label: 'Packaged Water' },
                      { value: 'Mineral Water', label: 'Mineral Water' },
                      { value: 'Bulk Water', label: 'Bulk Water' },
                      { value: 'Upcoming RUSH Soda', label: 'Upcoming RUSH Soda' },
                    ]}
                  />
                </div>
                <div className="form-group">
                  <label>Catalog Status</label>
                  <CustomSelect
                    value={editingProduct.Active !== false ? 'true' : 'false'}
                    onChange={(val) => setEditingProduct(prev => ({ ...prev, Active: val === 'true' }))}
                    options={[
                      { value: 'true', label: 'Active & Visible' },
                      { value: 'false', label: 'Hidden / Inactive' },
                    ]}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Product Image Unsplash/Web URL</label>
                <input
                  required
                  type="url"
                  value={editingProduct.ImageUrl || ''}
                  onChange={(e) => setEditingProduct(prev => ({ ...prev, ImageUrl: e.target.value }))}
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div className="form-group">
                <label>Specification Details</label>
                <input
                  type="text"
                  value={editingProduct.Specifications || ''}
                  onChange={(e) => setEditingProduct(prev => ({ ...prev, Specifications: e.target.value }))}
                  placeholder="e.g. Balanced minerals, UV ozone treated"
                />
              </div>

              <div className="form-group">
                <label>Product Summary Description</label>
                <textarea
                  required
                  rows={3}
                  value={editingProduct.Description || ''}
                  onChange={(e) => setEditingProduct(prev => ({ ...prev, Description: e.target.value }))}
                  placeholder="Describe the product for customers..."
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setProductFormOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saveLoading}>
                  {saveLoading ? 'Writing catalog...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BANNER CRUD DIALOG */}
      {bannerFormOpen && editingBanner && (
        <div className="modal-backdrop glass">
          <div className="modal-card animate-fade-in">
            <div className="modal-header">
              <h2>{editingBanner.ID ? 'Edit Slide ID #' + editingBanner.ID : 'Add Homepage Slide'}</h2>
              <button className="close-btn" onClick={() => setBannerFormOpen(false)}>✕</button>
            </div>
            
            <form onSubmit={handleBannerSubmit} className="modal-body">
              <div className="form-group">
                <label>Banner Slide Title</label>
                <input
                  required
                  type="text"
                  value={editingBanner.Title || ''}
                  onChange={(e) => setEditingBanner(prev => ({ ...prev, Title: e.target.value }))}
                  placeholder="Pure Hydration. Healthy Living."
                />
              </div>

              <div className="form-group">
                <label>Slide Subtitle Text</label>
                <input
                  required
                  type="text"
                  value={editingBanner.Subtitle || ''}
                  onChange={(e) => setEditingBanner(prev => ({ ...prev, Subtitle: e.target.value }))}
                  placeholder="Enter details text describing hydration..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>CTA Button Label</label>
                  <input
                    required
                    type="text"
                    value={editingBanner.ButtonText || ''}
                    onChange={(e) => setEditingBanner(prev => ({ ...prev, ButtonText: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Button Action Route/ID</label>
                  <input
                    required
                    type="text"
                    value={editingBanner.ButtonLink || ''}
                    onChange={(e) => setEditingBanner(prev => ({ ...prev, ButtonLink: e.target.value }))}
                    placeholder="e.g. /products, #products"
                  />
                </div>
              </div>

              <div className="form-row" style={{ zIndex: 12, position: 'relative' }}>
                <div className="form-group">
                  <label>Slide Image URL</label>
                  <input
                    required
                    type="url"
                    value={editingBanner.ImageUrl || ''}
                    onChange={(e) => setEditingBanner(prev => ({ ...prev, ImageUrl: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Banner Status</label>
                  <CustomSelect
                    value={editingBanner.Active !== false ? 'true' : 'false'}
                    onChange={(val) => setEditingBanner(prev => ({ ...prev, Active: val === 'true' }))}
                    options={[
                      { value: 'true', label: 'Active (Visible)' },
                      { value: 'false', label: 'Inactive (Hidden)' },
                    ]}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setBannerFormOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saveLoading}>
                  Save Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FAQ CRUD DIALOG */}
      {faqFormOpen && editingFAQ && (
        <div className="modal-backdrop glass">
          <div className="modal-card animate-fade-in">
            <div className="modal-header">
              <h2>{editingFAQ.ID ? 'Edit FAQ ID #' + editingFAQ.ID : 'Add Store FAQ'}</h2>
              <button className="close-btn" onClick={() => setFAQFormOpen(false)}>✕</button>
            </div>
            
            <form onSubmit={handleFAQSubmit} className="modal-body">
              <div className="form-group">
                <label>Question Topic</label>
                <input
                  required
                  type="text"
                  value={editingFAQ.Question || ''}
                  onChange={(e) => setEditingFAQ(prev => ({ ...prev, Question: e.target.value }))}
                  placeholder="e.g. What makes NIMRA water pure?"
                />
              </div>

              <div className="form-group">
                <label>Answer Explanation</label>
                <textarea
                  required
                  rows={4}
                  value={editingFAQ.Answer || ''}
                  onChange={(e) => setEditingFAQ(prev => ({ ...prev, Answer: e.target.value }))}
                  placeholder="Explain details..."
                />
              </div>

              <div className="form-group" style={{ zIndex: 12, position: 'relative' }}>
                <label>FAQ Registry Status</label>
                <CustomSelect
                  value={editingFAQ.Active !== false ? 'true' : 'false'}
                  onChange={(val) => setEditingFAQ(prev => ({ ...prev, Active: val === 'true' }))}
                  options={[
                    { value: 'true', label: 'Active & Published' },
                    { value: 'false', label: 'Draft / Inactive' },
                  ]}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setFAQFormOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saveLoading}>
                  Save FAQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USER CRUD DIALOG */}
      {userFormOpen && editingUser && (
        <div className="modal-backdrop glass">
          <div className="modal-card animate-fade-in">
            <div className="modal-header">
              <h2>{editingUser.ID ? 'Edit Account ID #' + editingUser.ID : 'Create System Account'}</h2>
              <button className="close-btn" onClick={() => setUserFormOpen(false)}>✕</button>
            </div>
            
            <form onSubmit={handleUserSubmit} className="modal-body">
              <div className="form-group">
                <label>Full Display Name</label>
                <input
                  required
                  type="text"
                  value={editingUser.Name || ''}
                  onChange={(e) => setEditingUser(prev => ({ ...prev, Name: e.target.value }))}
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Portal Login Username</label>
                  <input
                    required
                    type="text"
                    value={editingUser.Username || ''}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, Username: e.target.value }))}
                    placeholder="e.g. johndoe"
                  />
                </div>
                <div className="form-group">
                  <label>Security Password</label>
                  <input
                    required
                    type="password"
                    value={editingUser.Password || ''}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, Password: e.target.value }))}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="form-row" style={{ zIndex: 12, position: 'relative' }}>
                <div className="form-group">
                  <label>Access Role Authority</label>
                  <CustomSelect
                    value={editingUser.Role || 'Customer'}
                    onChange={(val) => setEditingUser(prev => ({ ...prev, Role: val as any }))}
                    options={[
                      { value: 'Admin', label: 'Admin (Full Control)' },
                      { value: 'Customer', label: 'Customer (Portal Access)' },
                    ]}
                  />
                </div>
                <div className="form-group">
                  <label>Account Status</label>
                  <CustomSelect
                    value={editingUser.Active !== false ? 'true' : 'false'}
                    onChange={(val) => setEditingUser(prev => ({ ...prev, Active: val === 'true' }))}
                    options={[
                      { value: 'true', label: 'Enabled (Access Allowed)' },
                      { value: 'false', label: 'Disabled (Suspended)' },
                    ]}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setUserFormOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saveLoading}>
                  Save User Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <LogoutConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={() => {
          setIsLogoutModalOpen(false);
          performLogout();
        }}
      />
      
      {/* PROFILE EDIT PANEL - OUTSIDE ADMIN CONTAINER */}
      {isProfilePanelOpen && (
        <div className="profile-panel-overlay" onClick={() => setIsProfilePanelOpen(false)}>
          <div className="profile-panel" onClick={(e) => e.stopPropagation()}>
            <div className="profile-panel-header">
              <div>
                <h2>Edit Profile</h2>
                <p>Update your profile information</p>
              </div>
              <button 
                onClick={() => setIsProfilePanelOpen(false)}
                className="close-btn"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="profile-panel-content">
              <div className="profile-avatar-section">
                <div className="profile-panel-avatar">
                  {currentUser?.name?.[0] || 'A'}
                </div>
              </div>
              
              <form className="profile-form" onSubmit={(e) => { e.preventDefault(); void handleProfileSave(); }}>
                <div className="form-group">
                  <label htmlFor="profile-name">Full Name</label>
                  <input 
                    id="profile-name"
                    type="text" 
                    value={profileForm.name}
                    onChange={(e) => {
                      setProfileForm((prev) => ({ ...prev, name: e.target.value }));
                      if (profileValidationErrors.name) {
                        setProfileValidationErrors((prev) => ({ ...prev, name: '' }));
                      }
                    }}
                    className={`form-input ${profileValidationErrors.name ? 'form-input-error' : ''}`}
                  />
                  {profileValidationErrors.name && (
                    <div className="form-input-error-message">
                      {profileValidationErrors.name}
                    </div>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="profile-email">Email Address</label>
                  <input 
                    id="profile-email"
                    type="email" 
                    value={profileForm.email}
                    onChange={(e) => {
                      setProfileForm((prev) => ({ ...prev, email: e.target.value }));
                      if (profileValidationErrors.email) {
                        setProfileValidationErrors((prev) => ({ ...prev, email: '' }));
                      }
                    }}
                    className={`form-input ${profileValidationErrors.email ? 'form-input-error' : ''}`}
                    placeholder="your@email.com"
                  />
                  {profileValidationErrors.email && (
                    <div className="form-input-error-message">
                      {profileValidationErrors.email}
                    </div>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="profile-phone">Phone Number</label>
                  <input 
                    id="profile-phone"
                    type="tel" 
                    value={profileForm.phone}
                    onChange={(e) => {
                      setProfileForm((prev) => ({ ...prev, phone: e.target.value }));
                      if (profileValidationErrors.phone) {
                        setProfileValidationErrors((prev) => ({ ...prev, phone: '' }));
                      }
                    }}
                    className={`form-input ${profileValidationErrors.phone ? 'form-input-error' : ''}`}
                    placeholder="+91 99999 99999"
                  />
                  {profileValidationErrors.phone && (
                    <div className="form-input-error-message">
                      {profileValidationErrors.phone}
                    </div>
                  )}
                </div>

                {profileFeedback && (
                  <div className={`profile-feedback ${profileFeedback.type}`}>
                    {profileFeedback.text}
                  </div>
                )}
                
                <div className="profile-actions">
                  <button 
                    onClick={() => {
                      setProfileFeedback(null);
                      setIsProfilePanelOpen(false);
                    }}
                    className="btn btn-secondary"
                    type="button"
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn-primary"
                    type="submit"
                    disabled={isProfileSaving}
                  >
                    {isProfileSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* DESIGN SYSTEM CSS */}
      <style jsx>{`
        .admin-container {
          display: flex;
          min-height: 100vh;
          background-color: var(--bg-primary);
          color: var(--text-primary);
        }

        /* SIDEBAR STYLING */
        .admin-sidebar {
          width: 220px;
          min-width: 220px;
          background: var(--bg-primary);
          border-right: 1px solid var(--border-color);
          padding: 1.25rem 0.875rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          z-index: 200;
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          overflow-y: auto;
          scrollbar-width: none; /* Firefox */
          box-shadow: 4px 0 24px rgba(0, 0, 0, 0.02);
        }
        [data-theme="dark"] .admin-sidebar {
          background: var(--bg-primary);
          border-right: 1px solid var(--border-color);
        }
        
        .admin-sidebar::-webkit-scrollbar {
          display: none; /* Chrome, Safari and Opera */
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border-color);
        }
        .brand-text {
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 1.2rem;
          background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .sidebar-user {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.625rem;
          border-radius: var(--radius-md);
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          box-shadow: var(--shadow-sm);
          transition: transform var(--transition-fast), box-shadow var(--transition-fast);
        }
        .sidebar-user:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        .user-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1rem;
          box-shadow: var(--shadow-sm);
        }
        .user-details {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }
        .user-name {
          font-size: 0.85rem;
          font-weight: 700;
        }
        .user-role {
          font-size: 0.65rem;
          padding: 0.1rem 0.375rem;
          width: fit-content;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
          flex: 1;
        }
        .nav-btn {
          background: transparent;
          border: none;
          text-align: left;
          padding: 0.55rem 0.75rem;
          border-radius: var(--radius-md);
          color: rgba(37, 99, 235, 0.7);
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all var(--transition-normal);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          position: relative;
          overflow: hidden;
        }
        [data-theme="dark"] .nav-btn {
          color: rgba(147, 197, 253, 0.75);
        }
        .nav-btn:hover {
          color: var(--primary-color);
          background: rgba(var(--primary-rgb), 0.08);
          transform: translateX(4px);
        }
        [data-theme="dark"] .nav-btn:hover {
          color: #93c5fd;
          background: rgba(59, 130, 246, 0.12);
        }
        .nav-btn.active {
          color: white;
          background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
          box-shadow: 0 4px 14px rgba(var(--primary-rgb), 0.3);
          transform: translateX(4px);
        }
        [data-theme="dark"] .nav-btn.active {
          color: white;
          background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
        }

        /* MAIN SECTION STYLING */
        .admin-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 1.25rem 1.5rem;
          margin-left: 220px;
          position: relative;
          height: 100vh;
          overflow: hidden;
          gap: 1rem;
        }

        .main-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--border-color);
          background: var(--nav-bg);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          box-shadow: var(--shadow-sm);
          position: sticky;
          top: 0;
          z-index: 150;
          margin-left: -1.5rem;
          margin-right: -1.5rem;
          margin-top: -1.25rem;
          margin-bottom: 2rem;
        }
        .main-header h1 {
          font-size: 1.6rem;
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          position: relative;
          z-index: 1000;
          flex-grow: 1;
          justify-content: flex-end;
        }
        .btn-refresh {
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          padding: 0.625rem 1.25rem;
          border-radius: var(--radius-xl);
          font-weight: 700;
          font-size: 0.875rem;
          cursor: pointer;
          color: var(--text-primary);
          transition: all var(--transition-normal);
          box-shadow: var(--shadow-sm);
        }
        .btn-refresh:hover {
          border-color: var(--primary-color);
          color: var(--primary-color);
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
        }
        .db-indicator {
          font-size: 0.8rem;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          display: inline-block;
        }
        .dot.active {
          background: var(--accent-color);
          box-shadow: 0 0 10px rgba(var(--accent-rgb), 0.4);
          animation: pulse-glow 2s infinite;
        }

        /* PROFILE DROPDOWN */
        .profile-dropdown {
          position: relative;
        }
        .profile-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 2px solid var(--border-color);
          background: var(--bg-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-normal);
          box-shadow: var(--shadow-sm);
        }
        .profile-btn:hover {
          border-color: var(--primary-color);
          box-shadow: var(--shadow-md);
          transform: scale(1.05);
        }
        .profile-avatar {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          font-size: 1.1rem;
          font-family: var(--font-heading);
        }
        .profile-menu {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 0.75rem;
          width: 260px;
          background: var(--bg-secondary);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-2xl);
          border: 1px solid var(--border-color);
          padding: 0.75rem;
          z-index: 99999;
          animation: scaleIn 0.2s ease-out forwards;
        }
        .profile-header {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.75rem;
          margin-bottom: 0.25rem;
        }
        .menu-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          font-size: 1.3rem;
          font-family: var(--font-heading);
        }
        .menu-name {
          font-weight: 700;
          color: var(--text-primary);
          font-size: 1rem;
          font-family: var(--font-heading);
        }
        .menu-role {
          font-size: 0.8rem;
          color: var(--text-secondary);
          font-weight: 600;
        }
        .menu-divider {
          height: 1px;
          background: var(--border-color);
          margin: 0.5rem 0;
        }
        .menu-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.75rem;
          border-radius: var(--radius-lg);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all var(--transition-fast);
          color: var(--text-primary);
          text-align: left;
        }
        .menu-item:hover {
          background: var(--bg-tertiary);
        }
        .menu-item.menu-logout {
          color: #ef4444;
        }
        .menu-item.menu-logout:hover {
          background: rgba(239, 68, 68, 0.1);
        }
        .menu-label {
          font-weight: 600;
          font-size: 0.9rem;
        }

        .tab-viewport {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-height: 0;
          animation: fadeIn var(--transition-normal) forwards;
        }

        /* TOAST NOTIFICATIONS */
        .toast {
          position: fixed;
          top: 6rem;
          right: 2rem;
          padding: 1rem 1.5rem;
          border-radius: var(--radius-md);
          z-index: 1000;
          font-weight: 700;
          box-shadow: var(--shadow-xl);
          animation: slideUp 0.3s ease-out forwards;
        }
        .toast.success {
          background: var(--accent-color);
          color: white;
        }
        .toast.error {
          background: #ef4444;
          color: white;
        }

        /* OVERVIEW DASHBOARD */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }
        .stat-card {
          padding: 1.75rem;
          border-radius: var(--radius-2xl);
          border: 1px solid var(--glass-border);
          background: var(--glass-bg);
          backdrop-filter: blur(16px);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          transition: all var(--transition-normal);
          box-shadow: var(--shadow-md);
          position: relative;
          overflow: hidden;
        }
        .stat-card:hover {
          transform: translateY(-6px);
          box-shadow: var(--shadow-xl);
          border-color: rgba(var(--primary-rgb), 0.3);
        }
        .stat-card::after {
          content: ''; position: absolute; top: 0; right: 0;
          width: 150px; height: 150px;
          background: radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%);
          opacity: 0; transition: opacity var(--transition-normal);
          pointer-events: none;
        }
        .stat-card:hover::after { opacity: 1; }
        .stat-label {
          color: var(--text-secondary);
          font-size: 0.875rem;
          font-weight: 700;        
        }
        /* SETTINGS TAB STYLING */
        .settings-tab {
          width: 100%;
          padding: 0 !important;
        }
        .settings-section {
          background: rgba(37, 99, 235, 0.02);
          border: 1.5px solid var(--border-light);
          border-radius: var(--radius-xl);
          padding: 1.75rem;
          margin-bottom: 1.75rem;
          transition: border-color var(--transition-fast), background-color var(--transition-fast);
        }
        [data-theme="dark"] .settings-section {
          background: rgba(255, 255, 255, 0.01);
          border-color: rgba(255, 255, 255, 0.05);
        }
        .settings-section:hover {
          border-color: rgba(var(--primary-rgb), 0.15);
        }
        .settings-section-title {
          font-family: var(--font-heading);
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--primary-color);
          margin-bottom: 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 0.5rem;
        }
        [data-theme="dark"] .settings-section-title {
          border-color: rgba(255, 255, 255, 0.05);
          color: var(--accent-color);
        }
        .settings-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
        }
        @media (max-width: 768px) {
          .settings-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
        }

        /* SCROLLABLE TABLES STYLING */
        .table-responsive {
          flex: 1;
          overflow: auto;
          min-height: 0;
          -webkit-overflow-scrolling: touch;
          border-radius: var(--radius-xl);
          border: 1px solid var(--border-color);
          background: var(--bg-secondary);
        }
        .admin-table thead th {
          position: sticky;
          top: 0;
          background: var(--bg-secondary);
          z-index: 10;
          box-shadow: 0 1px 0 var(--border-color);
        }
        [data-theme="dark"] .admin-table thead th {
          background: #1e293b;
        }
        [data-theme="dark"] .table-responsive {
          border-color: rgba(255, 255, 255, 0.1);
          background: rgba(15, 23, 42, 0.4);
        }
        .admin-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 850px; /* Force scrollbar inside table-responsive wrapper */
        }
        .stat-val {
          font-size: 2rem;
          font-family: var(--font-heading);
          background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .stat-desc {
          color: var(--text-muted);
          font-size: 0.8rem;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }
        .chart-card {
          padding: 1.75rem;
          border-radius: var(--radius-2xl);
          border: 1px solid var(--glass-border);
          background: var(--glass-bg);
          backdrop-filter: blur(16px);
          box-shadow: var(--shadow-md);
          transition: all var(--transition-normal);
        }
        .chart-card:hover {
          box-shadow: var(--shadow-lg);
          border-color: rgba(var(--primary-rgb), 0.2);
        }
        .chart-card h3 {
          font-size: 1.1rem;
          margin-bottom: 1.5rem;
        }
        .chart-wrapper {
          width: 100%;
          height: 200px;
        }
        .svg-chart {
          width: 100%;
          height: 100%;
        }

        .donut-chart-flex {
          display: flex;
          align-items: center;
          gap: 2.5rem;
          height: 200px;
          justify-content: center;
        }
        .legend-list {
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
          font-size: 0.875rem;
          font-weight: 700;
        }
        .legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          display: inline-block;
          margin-right: 0.5rem;
        }
        .legend-dot.green {
          background: var(--primary-color);
        }
        .legend-dot.orange {
          background: #f97316;
        }
        .legend-dot.red {
          background: #ef4444;
        }

        .recent-activity-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }
        .activity-card {
          padding: 1.75rem;
          border-radius: var(--radius-xl);
          border: 1px solid var(--border-color);
          background: var(--bg-secondary);
          box-shadow: var(--shadow-sm);
          transition: all var(--transition-normal);
        }
        .activity-card:hover {
          box-shadow: var(--shadow-lg);
          border-color: rgba(var(--primary-rgb), 0.2);
        }
        .activity-card h3 {
          font-size: 1.1rem;
          margin-bottom: 1.25rem;
        }
        .mini-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .mini-item {
          padding: 1rem;
          border-radius: var(--radius-md);
          background: var(--bg-primary);
          border: 1px solid var(--border-light);
        }
        .mini-item.row-flex {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .mini-item strong {
          font-size: 0.95rem;
        }
        .mini-item p {
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }
        .mini-item .topic {
          color: var(--primary-color);
        }
        .empty {
          text-align: center;
          color: var(--text-muted);
          padding: 2rem;
        }

        /* TAB SECTIONS */
        .orders-tab, .products-tab, .banners-tab, .faqs-tab, .inquiries-tab, .users-tab, .notifications-tab {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-height: 0;
          padding: 1.5rem !important;
        }
        .settings-tab {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          padding: 1.5rem !important;
        }
        .section-head-btn {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .section-head-btn h3 {
          font-size: 1.25rem;
        }
        .btn-add {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .actions-flex {
          display: flex;
          gap: 0.5rem;
        }
        .actions-flex.vertical {
          flex-direction: column;
        }
        .btn-table {
          padding: 0.5rem 1rem;
          font-size: 0.825rem;
          border-radius: var(--radius-md);
          font-weight: 600;
        }
        .btn-edit {
          background: rgba(var(--primary-rgb), 0.1);
          color: var(--primary-color);
          border: 1px solid var(--primary-color);
        }
        .btn-edit:hover {
          background: var(--primary-color);
          color: white;
        }
        .btn-delete {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid #ef4444;
        }
        .btn-delete:hover {
          background: #ef4444;
          color: white;
        }
        .btn-whatsapp {
          background: rgba(37, 211, 102, 0.1);
          color: #25d366;
          border: 1px solid #25d366;
        }
        .btn-whatsapp:hover {
          background: #25d366;
          color: white;
        }
        .max-cell-width {
          max-width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .message-cell {
          margin: 0;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }
        .empty-td {
          text-align: center;
          padding: 2rem;
          color: var(--text-muted);
        }

        /* ACCESS DENIED BLOCK */
        .access-denied-block {
          text-align: center;
          padding: 4rem;
        }
        .access-denied-block h2 {
          font-size: 1.75rem;
          margin-bottom: 0.75rem;
        }
        .access-denied-block p {
          color: var(--text-secondary);
        }

        /* MODALS */
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          backdrop-filter: blur(4px);
        }
        .modal-card {
          background: var(--bg-secondary);
          border-radius: var(--radius-2xl);
          width: 95%;
          max-width: 680px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: var(--shadow-2xl), 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          animation: scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          border: 1px solid var(--border-color);
          transition: all var(--transition-normal);
        }
        .modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-header h2 {
          font-size: 1.25rem;
        }
        .btn-close {
          background: transparent;
          border: none;
          font-size: 1.5rem;
          color: var(--text-secondary);
          cursor: pointer;
          line-height: 1;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all var(--transition-fast);
        }
        .btn-close:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }
        .modal-body {
          padding: 1.5rem;
        }
        .form-group {
          margin-bottom: 1.25rem;
        }
        .form-label, .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 700;
          font-size: 0.9rem;
          color: var(--text-primary);
        }
        .form-input, .form-select, .form-textarea, .form-group input, .form-group select, .form-group textarea {
          width: 100%;
          padding: 0.875rem 1rem;
          border: 1.5px solid var(--border-color);
          border-radius: var(--radius-md);
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: 0.95rem;
          font-family: var(--font-body);
          transition: all var(--transition-fast);
        }
        .form-input:focus, .form-select:focus, .form-textarea:focus, .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.12);
          background: var(--bg-secondary);
        }
        .form-textarea, .form-group textarea {
          min-height: 120px;
          resize: vertical;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        @media (max-width: 600px) {
          .form-row {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }
        }
        .modal-footer {
          padding: 1.25rem 1.5rem;
          border-top: 1px solid var(--border-color);
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        /* MAIN LOADING OVERLAY */
        .main-loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 1.5rem;
          z-index: 1000;
        }
        .spinner {
          width: 60px;
          height: 60px;
          border: 4px solid var(--border-color);
          border-top-color: var(--primary-color);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        /* PROFILE EDIT PANEL */
        .blur-background {
          filter: blur(6px);
          transition: filter 0.2s ease-out;
        }
        .profile-panel-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100000;
          animation: fadeIn 0.2s ease-out forwards;
          padding: 20px;
          box-sizing: border-box;
        }
        .profile-panel {
          width: 100%;
          max-width: 560px;
          min-width: min(560px, calc(100vw - 32px));
          background: var(--bg-secondary);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-2xl);
          overflow: hidden;
          max-height: 95vh;
          overflow-y: auto;
          animation: scaleIn 0.3s ease-out forwards;
        }
        .profile-panel-header {
          padding: 1.25rem 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-color);
        }
        .profile-panel-header h2 {
          font-size: 1.25rem;
          font-family: var(--font-heading);
          margin-bottom: 0.2rem;
        }
        .profile-panel-header p {
          color: var(--text-secondary);
          font-size: 0.85rem;
        }
        .close-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: var(--bg-tertiary);
          color: var(--text-primary);
          cursor: pointer;
          transition: all var(--transition-fast);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .close-btn:hover {
          background: var(--primary-color);
          color: white;
          transform: rotate(90deg);
        }
        .profile-panel-content {
          padding: 1.5rem;
        }
        .profile-avatar-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }
        .profile-panel-avatar {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 2.2rem;
          font-weight: 800;
          font-family: var(--font-heading);
          box-shadow: var(--shadow-lg);
        }
        .profile-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .profile-form .form-group {
          margin-bottom: 0;
        }
        .profile-actions {
          display: flex;
          gap: 0.875rem;
          margin-top: 0.875rem;
        }
        .profile-actions .btn {
          flex: 1;
          padding: 0.75rem 1rem;
          font-size: 0.9rem;
        }
        .profile-feedback {
          padding: 0.8rem 0.95rem;
          border-radius: var(--radius-lg);
          font-size: 0.9rem;
          font-weight: 600;
          border: 1px solid transparent;
        }
        .profile-feedback.success {
          background: rgba(16, 185, 129, 0.12);
          color: #059669;
          border-color: rgba(16, 185, 129, 0.24);
        }
        .profile-feedback.error {
          background: rgba(239, 68, 68, 0.12);
          color: #dc2626;
          border-color: rgba(239, 68, 68, 0.24);
        }

        /* Validation Error Styles */
        .form-input-error {
          border-color: #ef4444 !important;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
          background: rgba(239, 68, 68, 0.04);
        }
        .form-input-error:focus {
          border-color: #ef4444 !important;
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.2);
        }
        .form-input-error-message {          margin-top: 0.5rem;
          font-size: 0.85rem;
          color: #ef4444;
          font-weight: 500;
        }

        /* ANNOUNCEMENTS (NOTIFICATIONS) TAB STYLING */
        .notif-grid {
          display: grid;
          grid-template-columns: 1fr 1.25fr;
          gap: 2rem;
          align-items: start;
        }
        @media (max-width: 992px) {
          .notif-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
        }
        .notif-sender-panel {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
          padding: 2rem;
          box-shadow: var(--shadow-md);
          backdrop-filter: blur(12px);
          transition: transform var(--transition-fast), box-shadow var(--transition-fast);
        }
        .notif-sender-panel:hover {
          box-shadow: var(--shadow-lg);
          border-color: rgba(var(--primary-rgb), 0.25);
        }
        .notif-sender-panel h3 {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
          background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .notif-logs-panel {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
          padding: 2rem;
          box-shadow: var(--shadow-md);
          backdrop-filter: blur(12px);
          max-height: 600px;
          display: flex;
          flex-direction: column;
        }
        .notif-logs-panel h3 {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          margin-bottom: 1.25rem;
        }
        .logs-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          overflow-y: auto;
          padding-right: 0.5rem;
          flex: 1;
        }
        .log-item {
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 1.25rem;
          position: relative;
          transition: all var(--transition-normal);
        }
        .log-item:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
          border-color: var(--primary-color);
          background: var(--bg-secondary);
        }
        .log-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.25rem;
        }
        .log-header strong {
          font-size: 1rem;
          color: var(--text-primary);
        }
        .btn-delete-log {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 1rem;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all var(--transition-fast);
        }
        .btn-delete-log:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          transform: scale(1.1);
        }
        .log-time {
          font-size: 0.75rem;
          color: var(--text-muted);
          display: block;
          margin-bottom: 0.75rem;
          font-weight: 500;
        }
        .log-item p {
          color: var(--text-secondary);
          font-size: 0.9rem;
          line-height: 1.5;
        }

        /* SETTINGS TAB STYLING */
        .settings-tab {
          max-width: 100%;
          margin: 0 auto;
        }
        .settings-form h3 {
          font-family: var(--font-heading);
          font-size: 1.35rem;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .settings-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          margin-bottom: 1rem;
        }
        @media (max-width: 768px) {
          .settings-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
        }

        /* PREMIUM FORM FIELD THEMES */
        .form-input, .form-select, .modal-select, .form-textarea, .form-group input, .form-group select, .form-group textarea {
          background: var(--bg-primary);
          border: 1.5px solid var(--border-color);
          color: var(--text-primary);
          border-radius: var(--radius-md);
          padding: 0.75rem 1rem;
          transition: all var(--transition-fast);
        }
        [data-theme="dark"] .form-input, 
        [data-theme="dark"] .form-select, 
        [data-theme="dark"] .modal-select,
        [data-theme="dark"] .form-textarea,
        [data-theme="dark"] .form-group input,
        [data-theme="dark"] .form-group select,
        [data-theme="dark"] .form-group textarea {
          background: rgba(30, 41, 59, 0.45);
          border-color: rgba(255, 255, 255, 0.1);
        }
        .form-select, .form-group select, .modal-select {
          appearance: none !important;
          -webkit-appearance: none !important;
          -moz-appearance: none !important;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%232563eb' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e") !important;
          background-repeat: no-repeat !important;
          background-position: right 1rem center !important;
          background-size: 1.1em !important;
          padding-right: 2.75rem !important;
        }
        [data-theme="dark"] .form-select, 
        [data-theme="dark"] .form-group select, 
        [data-theme="dark"] .modal-select {
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2360a5fa' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e") !important;
        }
        .form-input:focus, .form-select:focus, .modal-select:focus, .form-textarea:focus, 
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.15);
          background: var(--bg-secondary);
        }
        [data-theme="dark"] .form-input:focus, 
        [data-theme="dark"] .form-select:focus, 
        [data-theme="dark"] .modal-select:focus,
        [data-theme="dark"] .form-textarea:focus,
        [data-theme="dark"] .form-group input:focus,
        [data-theme="dark"] .form-group select:focus,
        [data-theme="dark"] .form-group textarea:focus {
          background: rgba(30, 41, 59, 0.85);
          border-color: var(--primary-color);
          box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.25);
        }

        /* RESPONSIVE */
        @media (max-width: 1200px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .charts-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 900px) {
          .admin-sidebar {
            width: 180px;
            min-width: 180px;
            padding: 1.25rem 0.75rem;
          }
          .admin-main {
            margin-left: 180px;
          }
          .recent-activity-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 768px) {
          .admin-container {
            flex-direction: column;
          }
          .admin-sidebar {
            position: relative;
            width: 100%;
            min-width: 100%;
            height: auto;
            border-right: none;
            border-bottom: 1px solid var(--border-color);
            padding: 1rem;
            z-index: 10;
          }
          .admin-main {
            margin-left: 0;
            padding: 1rem;
          }
          .sidebar-nav {
            flex-direction: row;
            overflow-x: auto;
          }
          .nav-btn {
            white-space: nowrap;
          }
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .admin-main {
            padding: 1rem;
          }
          .main-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }
          .header-actions {
            width: 100%;
            justify-content: space-between;
          }
          .section-head-btn {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }
        }
        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
          .form-row {
            grid-template-columns: 1fr;
          }
        }
        /* FILTERS BAR */
        .filter-bar {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 0.75rem;
          margin-bottom: 1.25rem;
          background: var(--bg-secondary);
          padding: 1rem;
          border-radius: var(--radius-xl);
          border: 1px solid var(--border-color);
          align-items: end;
          width: 100%;
          box-shadow: var(--shadow-sm);
          position: relative;
          z-index: 30;
        }
        @media (max-width: 768px) {
          .filter-bar {
            grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
            padding: 0.75rem;
            gap: 0.5rem;
          }
        }
        .filter-clear-cross {
          position: absolute;
          right: 2.25rem;
          background: transparent;
          border: none;
          cursor: pointer;
          color: #ef4444;
          font-size: 0.95rem;
          font-weight: 800;
          padding: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          transition: transform var(--transition-fast), color var(--transition-fast);
        }
        .filter-clear-cross:hover {
          color: #dc2626;
          transform: scale(1.15);
        }
        .filter-clear-cross.date-cross {
          right: 0.75rem;
        }
        .filter-toggle-btn {
          box-shadow: var(--shadow-sm);
        }
        .filter-toggle-btn:hover {
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }
        .filter-toggle-btn.active {
          box-shadow: 0 4px 14px rgba(var(--primary-rgb), 0.3);
        }
        .filter-group {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: 0.35rem;
          min-width: 0;
          width: 100%;
        }
        .filter-group label {
          font-weight: 700;
          font-size: 0.8rem;
          color: var(--text-secondary);
          white-space: nowrap;
          margin-bottom: 0;
        }
        .filter-select {
          padding: 0.45rem 2.85rem 0.45rem 0.6rem !important;
          font-size: 0.8rem !important;
          border-radius: 10px !important;
          width: 100%;
          min-width: 0;
          height: auto !important;
          border: 1.5px solid var(--border-color);
          background-color: var(--bg-primary);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .filter-select:hover {
          border-color: var(--primary-color);
          box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.08);
          transform: translateY(-1px);
        }
        .filter-select:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.15), 0 4px 12px rgba(var(--primary-rgb), 0.08);
        }
        .filter-input {
          padding: 0.55rem 0.75rem !important;
          font-size: 0.8rem !important;
          border-radius: 10px !important;
          width: 100%;
          min-width: 0;
          height: 38px !important;
          border: 1.5px solid var(--border-color);
          background-color: var(--bg-primary);
          color: var(--text-primary);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-sizing: border-box;
        }
        .filter-input:hover {
          border-color: var(--primary-color);
        }
        .filter-input:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.12);
        }
        .btn-clear {
          padding: 0.45rem 0.875rem !important;
          font-size: 0.825rem !important;
          border-radius: var(--radius-md) !important;
          font-weight: 700 !important;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          cursor: pointer;
          border: 1.5px solid #ef4444 !important;
          background: rgba(239, 68, 68, 0.05) !important;
          color: #ef4444 !important;
          transition: all var(--transition-fast) !important;
          height: 38px !important;
          box-sizing: border-box;
        }
        .btn-clear:hover {
          background: #ef4444 !important;
          color: white !important;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
        }

        /* PREMIUM GLASS SEARCH & DROPDOWNS */
        .search-bar-glass {
          padding: 11px 44px 11px 48px;
          border-radius: 28px;
          border: 1.5px solid var(--border-color);
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          color: var(--text-primary);
          outline: none;
          font-size: 0.95rem;
          width: 100%;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
        }
        [data-theme="dark"] .search-bar-glass {
          background: rgba(15, 23, 42, 0.45);
          border-color: rgba(255, 255, 255, 0.1);
        }
        .search-bar-glass:hover {
          border-color: var(--primary-color);
          background: rgba(255, 255, 255, 0.65);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.05);
        }
        [data-theme="dark"] .search-bar-glass:hover {
          background: rgba(15, 23, 42, 0.65);
        }
        .search-bar-glass:focus {
          border-color: var(--primary-color);
          background: var(--bg-primary);
          box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.2), 0 8px 20px rgba(var(--primary-rgb), 0.08);
        }
        [data-theme="dark"] .search-bar-glass:focus {
          background: rgba(15, 23, 42, 0.85);
        }

        .search-clear-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }
        .search-clear-btn:hover {
          color: #ef4444 !important;
          background: rgba(239, 68, 68, 0.1) !important;
          transform: scale(1.1);
        }

        .form-select, .modal-select {
          border-radius: 12px !important;
          background-color: var(--bg-primary) !important;
          border: 1.5px solid var(--border-color) !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04) !important;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .form-select:hover, .modal-select:hover {
          border-color: var(--primary-color) !important;
          background-color: var(--bg-secondary) !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.08) !important;
        }
        .form-select:focus, .modal-select:focus {
          outline: none !important;
          border-color: var(--primary-color) !important;
          box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.15), 0 4px 12px rgba(var(--primary-rgb), 0.08) !important;
          background-color: var(--bg-secondary) !important;
        }
      `}</style>

      {/* GLOBAL PREMIUM STYLES FOR CUSTOM SELECT COMPONENT */}
      <style jsx global>{`
        /* Custom Select Container */
        .custom-select-container {
          position: relative;
          width: 100%;
        }

        /* Trigger Button */
        .custom-select-trigger {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          height: 38px;
          padding: 0.45rem 0.85rem;
          font-size: 0.825rem;
          font-weight: 500;
          color: var(--text-primary);
          background: var(--bg-primary);
          border: 1.5px solid var(--border-color);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
          user-select: none;
          box-sizing: border-box;
        }

        [data-theme="dark"] .custom-select-trigger {
          background: rgba(30, 41, 59, 0.45);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .custom-select-trigger:hover {
          border-color: var(--primary-color);
          background: var(--bg-secondary);
          box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.08);
        }

        [data-theme="dark"] .custom-select-trigger:hover {
          background: rgba(30, 41, 59, 0.65);
        }

        .custom-select-trigger.open {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.15), 0 4px 12px rgba(var(--primary-rgb), 0.08);
          background: var(--bg-secondary);
        }

        .custom-select-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Actions area inside trigger */
        .custom-select-actions {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          flex-shrink: 0;
          margin-left: 0.5rem;
        }

        .custom-select-clear {
          color: var(--text-muted);
          cursor: pointer;
          font-size: 0.75rem;
          font-weight: bold;
          padding: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color var(--transition-fast), transform var(--transition-fast);
        }

        .custom-select-clear:hover {
          color: #ef4444;
          transform: scale(1.15);
        }

        .custom-select-arrow {
          color: var(--primary-color);
          display: flex;
          align-items: center;
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .custom-select-trigger.open .custom-select-arrow {
          transform: rotate(180deg);
        }

        /* Options dropdown list container */
        .custom-select-options-list {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          width: 100%;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          box-shadow: var(--shadow-xl), 0 10px 15px -3px rgba(0, 0, 0, 0.05);
          z-index: 2200; /* Higher than sticky headers & tables */
          max-height: 240px;
          overflow-y: auto;
          padding: 4px;
          animation: dropdownIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          box-sizing: border-box;
        }

        [data-theme="dark"] .custom-select-options-list {
          background: #1e293b;
          border-color: rgba(255, 255, 255, 0.1);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
        }

        @keyframes dropdownIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Individual Option Item */
        .custom-select-option {
          padding: 0.55rem 0.75rem;
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--text-primary);
          border-radius: 8px;
          cursor: pointer;
          transition: all var(--transition-fast);
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          box-sizing: border-box;
        }

        .custom-select-option:hover {
          background: rgba(var(--primary-rgb), 0.08);
          color: var(--primary-color);
          transform: translateX(2px);
        }

        [data-theme="dark"] .custom-select-option:hover {
          background: rgba(59, 130, 246, 0.12);
          color: #93c5fd;
        }

        .custom-select-option.selected {
          background: var(--primary-color);
          color: white !important;
        }

        /* Date Picker Calendar Icon Contrast Fix for Night Mode */
        [data-theme="dark"] .filter-input::-webkit-calendar-picker-indicator,
        [data-theme="dark"] .form-input::-webkit-calendar-picker-indicator,
        [data-theme="dark"] input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1) brightness(0.95) !important;
          cursor: pointer !important;
        }
        .filter-input::-webkit-calendar-picker-indicator,
        .form-input::-webkit-calendar-picker-indicator,
        input[type="date"]::-webkit-calendar-picker-indicator {
          cursor: pointer !important;
          transition: transform 0.2s ease !important;
        }
        .filter-input::-webkit-calendar-picker-indicator:hover,
        .form-input::-webkit-calendar-picker-indicator:hover,
        input[type="date"]::-webkit-calendar-picker-indicator:hover {
          transform: scale(1.15) !important;
        }

        /* Search Icon Theme Contrast Fix for Night Mode */
        .search-icon-svg {
          color: var(--primary-color) !important;
          opacity: 0.8 !important;
          transition: all var(--transition-fast) !important;
        }
        .search-container:focus-within .search-icon-svg {
          color: var(--primary-hover) !important;
          opacity: 1 !important;
          transform: scale(1.05) !important;
        }
        [data-theme="dark"] .search-icon-svg {
          color: #60a5fa !important;
          opacity: 0.95 !important;
        }
        [data-theme="dark"] .search-container:focus-within .search-icon-svg {
          color: #93c5fd !important;
          opacity: 1 !important;
        }
      `}</style>
    </div>
    </>
  );
}
