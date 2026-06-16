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

interface AdminPortalClientProps {
  initialCMSData: CMSData;
}

type TabType = 'dashboard' | 'orders' | 'products' | 'banners' | 'faqs' | 'inquiries' | 'users' | 'notifications' | 'settings';

export default function AdminPortalClient({ initialCMSData }: AdminPortalClientProps) {
  const router = useRouter();
  
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
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [globalSearch, setGlobalSearch] = useState('');

  // DB States
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
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
    localStorage.removeItem('nimra_admin_user');
    Cookies.remove('nimra_user', { path: '/' });
    router.replace('/login');
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
  
  // Sort orders by newest first (created descending or orderId descending)
  const sortedOrders = [...orders].sort((a, b) => {
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    if (dateA !== dateB) return dateB - dateA;
    return (b.orderId || '').localeCompare(a.orderId || '');
  });

  const filteredOrders = sortedOrders.filter(o => 
    String(o.orderId || '').toLowerCase().includes(searchLower) ||
    String(o.customer?.name || '').toLowerCase().includes(searchLower) ||
    String(o.customer?.mobile || '').toLowerCase().includes(searchLower) ||
    String(o.status || '').toLowerCase().includes(searchLower)
  );

  const filteredProducts = products.filter(p => 
    String(p.Name || '').toLowerCase().includes(searchLower) || 
    String(p.Category || '').toLowerCase().includes(searchLower) ||
    String(p.Description || '').toLowerCase().includes(searchLower)
  );

  const filteredBanners = banners.filter(b => 
    String(b.Title || '').toLowerCase().includes(searchLower) || 
    String(b.Subtitle || '').toLowerCase().includes(searchLower)
  );

  const filteredFaqs = faqs.filter(f => 
    String(f.Question || '').toLowerCase().includes(searchLower) || 
    String(f.Answer || '').toLowerCase().includes(searchLower)
  );

  const filteredInquiries = inquiries.filter(i => 
    String(i.Name || '').toLowerCase().includes(searchLower) || 
    String(i.Subject || '').toLowerCase().includes(searchLower) || 
    String(i.Message || '').toLowerCase().includes(searchLower) ||
    String(i.Email || '').toLowerCase().includes(searchLower) ||
    String(i.Phone || '').toLowerCase().includes(searchLower)
  );

  const filteredUsers = users.filter(u => 
    String(u.Name || '').toLowerCase().includes(searchLower) || 
    String(u.Username || '').toLowerCase().includes(searchLower) || 
    String(u.Role || '').toLowerCase().includes(searchLower)
  );

  const filteredNotifications = notifications.filter(n => 
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
            {activeTab !== 'dashboard' && activeTab !== 'notifications' && (
              <div className="search-container" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: '12px', color: 'var(--text-secondary)' }}>🔍</span>
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  style={{
                    padding: '8px 12px 8px 36px',
                    borderRadius: '20px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--glass-bg)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontSize: '0.9rem',
                    minWidth: '240px'
                  }}
                />
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
                      {/* Simple Responsive SVG Line Chart */}
                      <svg viewBox="0 0 500 200" className="svg-chart">
                        {/* Grid lines */}
                        <line x1="40" y1="20" x2="480" y2="20" stroke="var(--border-color)" strokeDasharray="4 4" />
                        <line x1="40" y1="70" x2="480" y2="70" stroke="var(--border-color)" strokeDasharray="4 4" />
                        <line x1="40" y1="120" x2="480" y2="120" stroke="var(--border-color)" strokeDasharray="4 4" />
                        <line x1="40" y1="170" x2="480" y2="170" stroke="var(--border-color)" />
                        
                        {/* Area Gradient */}
                        <path
                          d="M 40 170 L 113 150 L 186 160 L 260 90 L 333 130 L 406 50 L 480 120 L 480 170 Z"
                          fill="url(#chartAreaGrad)"
                        />
                        
                        {/* Line */}
                        <path
                          d="M 40 170 L 113 150 L 186 160 L 260 90 L 333 130 L 406 50 L 480 120"
                          fill="none"
                          stroke="var(--primary-color)"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                        
                        {/* Points */}
                        <circle cx="40" cy="170" r="4" fill="var(--primary-color)" />
                        <circle cx="113" cy="150" r="4" fill="var(--primary-color)" />
                        <circle cx="186" cy="160" r="4" fill="var(--primary-color)" />
                        <circle cx="260" cy="90" r="4" fill="var(--primary-color)" />
                        <circle cx="333" cy="130" r="4" fill="var(--primary-color)" />
                        <circle cx="406" cy="50" r="4" fill="var(--primary-color)" />
                        <circle cx="480" cy="120" r="4" fill="var(--primary-color)" />

                        {/* Labels */}
                        <text x="40" y="190" textAnchor="middle" fontSize="9" fill="var(--text-secondary)">Jun 01</text>
                        <text x="186" y="190" textAnchor="middle" fontSize="9" fill="var(--text-secondary)">Jun 05</text>
                        <text x="333" y="190" textAnchor="middle" fontSize="9" fill="var(--text-secondary)">Jun 10</text>
                        <text x="480" y="190" textAnchor="middle" fontSize="9" fill="var(--text-secondary)">Jun 12</text>

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
                      <svg viewBox="0 0 160 160" width="140" height="140">
                        {/* Simple Donut SVG */}
                        <circle cx="80" cy="80" r="60" fill="transparent" stroke="var(--border-color)" strokeWidth="15" />
                        {/* Delivered portion (approx 40%) */}
                        <circle cx="80" cy="80" r="60" fill="transparent" stroke="var(--primary-color)" strokeWidth="15" 
                                strokeDasharray="150 376" strokeDashoffset="0" />
                        {/* Pending/Processing portion (approx 40%) */}
                        <circle cx="80" cy="80" r="60" fill="transparent" stroke="#f97316" strokeWidth="15" 
                                strokeDasharray="120 376" strokeDashoffset="-150" />
                        {/* Cancelled portion (approx 20%) */}
                        <circle cx="80" cy="80" r="60" fill="transparent" stroke="#ef4444" strokeWidth="15" 
                                strokeDasharray="106 376" strokeDashoffset="-270" />
                      </svg>
                      <div className="legend-list">
                        <div><span className="legend-dot green"></span> Delivered ({orders.filter(o => o.status === 'Delivered').length})</div>
                        <div><span className="legend-dot orange"></span> In Progress ({orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length})</div>
                        <div><span className="legend-dot red"></span> Cancelled ({orders.filter(o => o.status === 'Cancelled').length})</div>
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

                <div className="table-responsive" style={{ marginTop: '1rem' }}>
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

                <div className="table-responsive" style={{ marginTop: '1rem' }}>
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

                <div className="table-responsive" style={{ marginTop: '1rem' }}>
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
                        setEditingUser({ Username: '', Password: '', Role: 'Manager', Name: '', Active: true });
                        setUserFormOpen(true);
                      }}>
                        ➕ Create User
                      </button>
                    </div>

                    <div className="table-responsive" style={{ marginTop: '1rem' }}>
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
              <div className="settings-tab card glass">
                {currentUser.role !== 'Admin' ? (
                  <div className="access-denied-block">
                    <h2>🚫 Administrative Privileges Required</h2>
                    <p>Only full administrators can view, register, or edit core company settings.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSettingsSubmit} className="settings-form">
                    <h3>NIMRA Beverages Store Brand & Contact Information</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                      These settings sync instantly across all checkout panels, headers, maps, and social buttons on both Customer Web and Customer Mobile applications.
                    </p>

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

                    <div className="form-group" style={{ marginTop: '1.25rem' }}>
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

                    <div className="form-group" style={{ marginTop: '1.25rem' }}>
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

                    <button type="submit" className="btn btn-primary" style={{ marginTop: '1.5rem' }} disabled={saveLoading}>
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
                <select
                  value={orderStatusVal}
                  onChange={(e) => setOrderStatusVal(e.target.value)}
                  className="modal-select"
                >
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Processing">Processing</option>
                  <option value="Dispatched">Dispatched</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
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

              <div className="form-row">
                <div className="form-group">
                  <label>Product Category</label>
                  <select
                    value={editingProduct.Category || 'Packaged Water'}
                    onChange={(e) => setEditingProduct(prev => ({ ...prev, Category: e.target.value }))}
                  >
                    <option value="Packaged Water">Packaged Water</option>
                    <option value="Mineral Water">Mineral Water</option>
                    <option value="Bulk Water">Bulk Water</option>
                    <option value="Upcoming RUSH Soda">Upcoming RUSH Soda</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Catalog Status</label>
                  <select
                    value={editingProduct.Active !== false ? 'true' : 'false'}
                    onChange={(e) => setEditingProduct(prev => ({ ...prev, Active: e.target.value === 'true' }))}
                  >
                    <option value="true">Active & Visible</option>
                    <option value="false">Hidden / Inactive</option>
                  </select>
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

              <div className="form-row">
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
                  <select
                    value={editingBanner.Active !== false ? 'true' : 'false'}
                    onChange={(e) => setEditingBanner(prev => ({ ...prev, Active: e.target.value === 'true' }))}
                  >
                    <option value="true">Active (Visible)</option>
                    <option value="false">Inactive (Hidden)</option>
                  </select>
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

              <div className="form-group">
                <label>FAQ Registry Status</label>
                <select
                  value={editingFAQ.Active !== false ? 'true' : 'false'}
                  onChange={(e) => setEditingFAQ(prev => ({ ...prev, Active: e.target.value === 'true' }))}
                >
                  <option value="true">Active & Published</option>
                  <option value="false">Draft / Inactive</option>
                </select>
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

              <div className="form-row">
                <div className="form-group">
                  <label>Access Role Authority</label>
                  <select
                    value={editingUser.Role || 'Manager'}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, Role: e.target.value as any }))}
                  >
                    <option value="Admin">Admin (Full Control)</option>
                    <option value="Manager">Manager (Staff Access)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Account Status</label>
                  <select
                    value={editingUser.Active !== false ? 'true' : 'false'}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, Active: e.target.value === 'true' }))}
                  >
                    <option value="true">Enabled (Access Allowed)</option>
                    <option value="false">Disabled (Suspended)</option>
                  </select>
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
      {/* ==================================================== */}
      <style jsx>{`
        .admin-container {
          display: flex;
          min-height: 90vh;
          background-color: var(--bg-primary);
          color: var(--text-primary);
        }

        /* SIDEBAR STYLING */
        .admin-sidebar {
          width: 260px;
          min-width: 260px;
          background: linear-gradient(180deg, var(--bg-secondary), var(--bg-tertiary));
          border-right: 1px solid var(--border-color);
          padding: 1.5rem 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          z-index: 100;
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          overflow-y: auto;
          scrollbar-width: none; /* Firefox */
        }
        
        .admin-sidebar::-webkit-scrollbar {
          display: none; /* Chrome, Safari and Opera */
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding-bottom: 1.25rem;
          border-bottom: 1px solid var(--border-color);
        }
        .brand-text {
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 1.35rem;
          background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .sidebar-user {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 1rem;
          border-radius: var(--radius-lg);
          background: rgba(var(--primary-rgb), 0.06);
          border: 1px solid var(--border-color);
        }
        .user-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1.25rem;
          box-shadow: var(--shadow-sm);
        }
        .user-details {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .user-name {
          font-size: 0.95rem;
          font-weight: 700;
        }
        .user-role {
          font-size: 0.7rem;
          padding: 0.125rem 0.5rem;
          width: fit-content;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
        }
        .nav-btn {
          background: transparent;
          border: none;
          text-align: left;
          padding: 0.875rem 1rem;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all var(--transition-normal);
          display: flex;
          align-items: center;
          gap: 0.75rem;
          position: relative;
          overflow: hidden;
        }
        .nav-btn:hover {
          color: var(--primary-color);
          background: rgba(var(--primary-rgb), 0.08);
          transform: translateX(4px);
        }
        .nav-btn.active {
          color: white;
          background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
          box-shadow: 0 4px 14px rgba(var(--primary-rgb), 0.3);
          transform: translateX(4px);
        }

        /* MAIN SECTION STYLING */
        .admin-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 2rem;
          margin-left: 260px;
          overflow-y: auto;
          position: relative;
        }

        .main-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2rem;
          border-radius: var(--radius-xl);
          border: 1px solid var(--glass-border);
          background: var(--glass-bg);
          backdrop-filter: blur(16px);
          margin-bottom: 2rem;
          box-shadow: var(--shadow-md);
          position: relative;
          z-index: 100;
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
          border-radius: var(--radius-xl);
          border: 1px solid var(--border-color);
          background: var(--bg-secondary);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          transition: all var(--transition-normal);
          box-shadow: var(--shadow-sm);
        }
        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-xl);
          border-color: rgba(var(--primary-rgb), 0.3);
        }
        .stat-label {
          color: var(--text-secondary);
          font-size: 0.875rem;
          font-weight: 700;
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
          border-radius: var(--radius-xl);
          border: 1px solid var(--border-color);
          background: var(--bg-secondary);
          box-shadow: var(--shadow-sm);
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
        .orders-tab, .products-tab, .banners-tab, .faqs-tab, .inquiries-tab, .users-tab, .notifications-tab, .settings-tab {
          width: 100%;
          padding: 2rem;
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
        .modal-content {
          background: var(--bg-secondary);
          border-radius: var(--radius-xl);
          width: 100%;
          max-width: 520px;
          box-shadow: var(--shadow-2xl);
          animation: scaleIn 0.2s ease-out forwards;
          border: 1px solid var(--border-color);
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
        .form-input-error-message {
          margin-top: 0.5rem;
          font-size: 0.85rem;
          color: #ef4444;
          font-weight: 500;
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
            width: 220px;
            min-width: 220px;
            padding: 1.25rem 1rem;
          }
          .admin-main {
            margin-left: 220px;
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
      `}</style>
    </div>
    </>
  );
}
