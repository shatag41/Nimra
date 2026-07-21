import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
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
  CancellationRequest,
} from '@/types/cms';
import {
  fetchOrders,
  updateOrderStatus,
  fetchInquiries,
  fetchUsers,
  saveUser,
  fetchAdminUpdates,
  fetchCustomerNotificationLog,
  saveNotification,
  fetchCMSData,
  clearAdminDataCache,
  clearCMSDataCache,
  saveProduct,
  saveBanner,
  saveFAQ,
  saveCompanyInfo,
  fetchCancellationRequests,
  reviewCancellationRequest,
  markInquiryReviewed,
} from '@/utils/api';
import { clearBrowserSession, useAuth } from '@/frontend/customer/contexts/AuthContext';
import { useNotification } from '@/frontend/customer/contexts/NotificationContext';
import { getUploadImageUrl } from '@/utils/uploadImage';
import { isAdminRole, normalizeRole } from '../utils/accessControl';

export interface CurrentUser {
  id?: string | number;
  username: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  permissions?: string;
  name: string;
  email?: string;
  phone?: string;
}

export const useAdminData = (initialCMSData: CMSData) => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { notify } = useNotification();

  // Auth state
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nimra_admin_active_tab');
      if (saved) return saved as any;
    }
    return 'dashboard';
  });

  // Persist activeTab to localStorage
  useEffect(() => {
    localStorage.setItem('nimra_admin_active_tab', activeTab);
  }, [activeTab]);

  // DB States
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [adminUpdates, setAdminUpdates] = useState<Notification[]>([]);
  const [cancellationRequests, setCancellationRequests] = useState<CancellationRequest[]>([]);
  const [products, setProducts] = useState<Product[]>(initialCMSData.products || []);
  const [banners, setBanners] = useState<Banner[]>(initialCMSData.banners || []);
  const [faqs, setFaqs] = useState<FAQ[]>(initialCMSData.faqs || []);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(initialCMSData.companyInfo || {} as CompanyInfo);

  // Loading and Notification UI
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  // Alerts
  const showAlert = (text: string, type: 'success' | 'error' = 'success') => {
    if (type === 'success') {
      notify.success('Success', text);
    } else {
      notify.error('Error', text);
    }
  };

  // Check auth on mount
  useEffect(() => {
    if (authLoading) return;

    if (isAuthenticated && user && isAdminRole(user.Role)) {
      const adminSession: CurrentUser = {
        id: user.ID,
        username: user.Username,
        role: normalizeRole(user.Role) as 'ADMIN' | 'SUPER_ADMIN',
        permissions: (user as typeof user & { Permissions?: string }).Permissions,
        name: user.Name,
        email: user.Username,
        phone: user.Mobile || '',
      };
      setCurrentUser(adminSession);
      setAuthChecked(true);
      return;
    }

    clearBrowserSession();
    setCurrentUser(null);
    setAuthChecked(false);
    router.replace('/');
  }, [authLoading, isAuthenticated, router, user]);

  // Load all dashboard databases
  
  // SWR fetching
  const fetcher = async () => {
    const results = await Promise.allSettled([
        fetchOrders(),
        fetchInquiries(),
        fetchUsers(),
        fetchCustomerNotificationLog(),
        fetchAdminUpdates(),
        fetchCancellationRequests(),
        fetchCMSData(),
    ]);

    const valueOr = <T,>(index: number, fallback: T): T => {
      const result = results[index];
      if (result.status === 'fulfilled') return result.value as T;
      console.warn(`Admin data request ${index + 1} failed; retaining the last available data.`, result.reason);
      return fallback;
    };

    const fetchedCMSData = valueOr(6, {
      products,
      banners,
      faqs,
      companyInfo,
    });

    return {
        fetchedOrders: valueOr(0, orders),
        fetchedInquiries: valueOr(1, inquiries),
        fetchedUsers: valueOr(2, users),
        fetchedNotifs: valueOr(3, notifications),
        fetchedAdminUpdates: valueOr(4, adminUpdates),
        fetchedCancellationRequests: valueOr(5, cancellationRequests),
        fetchedProducts: fetchedCMSData.products,
        fetchedBanners: fetchedCMSData.banners,
        fetchedFaqs: fetchedCMSData.faqs,
    };
  };

  const { data: swrData, error: swrError, mutate: refreshDataSWR } = useSWR(authChecked ? 'adminData' : null, fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
    dedupingInterval: 15000,
    keepPreviousData: true,
  });

  useEffect(() => {
    if (swrData) {
      setOrders(swrData.fetchedOrders);
      setInquiries(swrData.fetchedInquiries);
      setUsers(swrData.fetchedUsers);
      setNotifications(swrData.fetchedNotifs);
      setAdminUpdates(swrData.fetchedAdminUpdates);
      setCancellationRequests(swrData.fetchedCancellationRequests);
      setProducts(swrData.fetchedProducts);
      setBanners(swrData.fetchedBanners);
      setFaqs(swrData.fetchedFaqs);
      setLoading(false);
    }
    if (swrError) {
      console.error('Failed to load admin databases', swrError);
      showAlert('Error updating real-time databases. Local fallback remains active.', 'error');
      setLoading(false);
    }
  }, [swrData, swrError]);

  const refreshData = async () => {
    setLoading(true);
    clearAdminDataCache();
    clearCMSDataCache();
    await refreshDataSWR();
  };


  // Refresh logic is now handled by SWR

  const performLogout = () => {
    logout();
  };

  // Update order status callback
  const handleUpdateStatusSubmit = async (orderId: string, status: string) => {
    setSaveLoading(true);
    try {
      const res = await updateOrderStatus(orderId, status);
      if (res.success) {
        showAlert(res.message);
        setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, status: status as any, updatedAt: new Date().toISOString() } : o));
        return true;
      } else {
        showAlert(res.message, 'error');
        return false;
      }
    } catch (err) {
      showAlert('Failed to connect to backend api.', 'error');
      return false;
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancellationReview = async (
    requestId: string,
    decision: 'Approved' | 'Rejected',
    adminRemarks: string
  ) => {
    if (!adminRemarks.trim()) {
      showAlert('Admin remarks are required for the cancellation audit trail.', 'error');
      return false;
    }
    setSaveLoading(true);
    try {
      const res = await reviewCancellationRequest(requestId, decision, currentUser?.name || 'Admin', adminRemarks);
      if (res.success) {
        showAlert(decision === 'Approved' ? 'Request approved. Order cancelled successfully.' : 'Cancellation request rejected.');
        const [updatedOrders, updatedRequests] = await Promise.all([fetchOrders(), fetchCancellationRequests()]);
        setOrders(updatedOrders);
        setCancellationRequests(updatedRequests);
        return true;
      }
      showAlert(res.message, 'error');
      return false;
    } catch (err) {
      showAlert('Failed to review cancellation request.', 'error');
      return false;
    } finally {
      setSaveLoading(false);
    }
  };

  const handleInquiryReview = async (inquiry: Inquiry) => {
    const inquiryId = inquiry['Inquiry ID'] || inquiry.InquiryID || inquiry.ID;
    if (!inquiryId) {
      showAlert('Cannot mark inquiry reviewed because its ID is missing.', 'error');
      return false;
    }

    setSaveLoading(true);
    try {
      const res = await markInquiryReviewed(inquiryId, currentUser?.name || 'Admin');
      if (res.success) {
        showAlert(res.message || 'Inquiry marked as reviewed.');
        setInquiries(prev => prev.map(item => {
          const itemId = item['Inquiry ID'] || item.InquiryID || item.ID;
          return String(itemId) === String(inquiryId)
            ? { ...item, Status: 'Reviewed', 'Reviewed At': new Date().toISOString(), 'Reviewed By': currentUser?.name || 'Admin' }
            : item;
        }));
        return true;
      }
      showAlert(res.message, 'error');
      return false;
    } catch (err) {
      showAlert('Failed to update inquiry.', 'error');
      return false;
    } finally {
      setSaveLoading(false);
    }
  };

  // CRUD Product callbacks
  const handleProductSubmit = async (editingProduct: Partial<Product>) => {
    setSaveLoading(true);
    const action = editingProduct.ID ? 'update' : 'create';
    // Capture the old image path before overwriting, for cleanup on update
    const oldProduct = editingProduct.ID
      ? products.find((p) => String(p.ID) === String(editingProduct.ID))
      : undefined;
    const oldImagePath = oldProduct?.ImageUrl || '';
    // Apps Script writes the complete Products row. Always send the merged
    // record so ImageUrl replacement and every neighboring column stay aligned.
    const productForSave: Partial<Product> = action === 'update' && oldProduct
      ? { ...oldProduct, ...editingProduct, ImageUrl: editingProduct.ImageUrl || oldProduct.ImageUrl }
      : editingProduct;
    try {
      const res = await saveProduct(productForSave, action, oldImagePath);
      if (res.success) {
        showAlert(res.message);
        const savedProduct: Product = {
          ...(oldProduct || {}),
          ...editingProduct,
          ID: res.ID || editingProduct.ID || oldProduct?.ID || Date.now(),
          ImageUrl: getUploadImageUrl(editingProduct.ImageUrl) || editingProduct.ImageUrl || oldProduct?.ImageUrl || '',
          Active: editingProduct.Active !== undefined ? editingProduct.Active : oldProduct?.Active ?? true,
        } as Product;
        setProducts(prev => {
          if (action === 'update') {
            return prev.map(product =>
              String(product.ID) === String(savedProduct.ID)
                ? { ...product, ...savedProduct }
                : product
            );
          }
          return [savedProduct, ...prev];
        });
        return true;
      } else {
        showAlert(res.message, 'error');
        return false;
      }
    } catch (err) {
      showAlert('Failed to save product changes', 'error');
      return false;
    } finally {
      setSaveLoading(false);
    }
  };

  const handleProductDelete = async (id: string | number) => {
    if (!confirm('Are you sure you want to delete this product?')) return false;
    setSaveLoading(true);
    // Capture the old image path for cleanup after deletion
    const existingProduct = products.find((p) => String(p.ID) === String(id));
    const oldImagePath = existingProduct?.ImageUrl || '';
    try {
      const res = await saveProduct({ ID: id }, 'delete', oldImagePath);
      if (res.success) {
        showAlert(res.message);
        setProducts(prev => prev.filter(p => p.ID !== id));
        return true;
      } else {
        showAlert(res.message, 'error');
        return false;
      }
    } catch (err) {
      showAlert('Failed to delete product', 'error');
      return false;
    } finally {
      setSaveLoading(false);
    }
  };

  // CRUD Banner callbacks
  const handleBannerSubmit = async (editingBanner: Partial<Banner>) => {
    setSaveLoading(true);
    const action = editingBanner.ID ? 'update' : 'create';
    // Capture the old image path before overwriting, for cleanup on update
    const oldBanner = editingBanner.ID
      ? banners.find((b) => String(b.ID) === String(editingBanner.ID))
      : undefined;
    const oldImagePath = oldBanner?.ImageUrl || '';
    try {
      const res = await saveBanner(editingBanner, action, oldImagePath);
      if (res.success) {
        showAlert(res.message);
        const savedBanner: Banner = {
          ...(oldBanner || {}),
          ...editingBanner,
          ID: res.ID || editingBanner.ID || oldBanner?.ID || Date.now(),
          ImageUrl: getUploadImageUrl(editingBanner.ImageUrl) || editingBanner.ImageUrl || oldBanner?.ImageUrl || '',
          Active: editingBanner.Active !== undefined ? editingBanner.Active : oldBanner?.Active ?? true,
        } as Banner;
        setBanners(prev => action === 'update'
          ? prev.map(item => String(item.ID) === String(savedBanner.ID) ? savedBanner : item)
          : [savedBanner, ...prev]);
        return true;
      } else {
        showAlert(res.message, 'error');
        return false;
      }
    } catch (err) {
      showAlert('Failed to save banner changes', 'error');
      return false;
    } finally {
      setSaveLoading(false);
    }
  };

  const handleBannerDelete = async (id: string | number) => {
    if (!confirm('Are you sure you want to delete this banner?')) return false;
    setSaveLoading(true);
    // Capture the old image path for cleanup after deletion
    const existingBanner = banners.find((b) => String(b.ID) === String(id));
    const oldImagePath = existingBanner?.ImageUrl || '';
    try {
      const res = await saveBanner({ ID: id }, 'delete', oldImagePath);
      if (res.success) {
        showAlert(res.message);
        setBanners(prev => prev.filter(b => b.ID !== id));
        return true;
      } else {
        showAlert(res.message, 'error');
        return false;
      }
    } catch (err) {
      showAlert('Failed to delete banner', 'error');
      return false;
    } finally {
      setSaveLoading(false);
    }
  };

  // CRUD FAQ callbacks
  const handleFAQSubmit = async (editingFAQ: Partial<FAQ>) => {
    setSaveLoading(true);
    const action = editingFAQ.ID ? 'update' : 'create';
    try {
      const res = await saveFAQ(editingFAQ, action);
      if (res.success) {
        showAlert(res.message);
        const oldFAQ = faqs.find(item => String(item.ID) === String(editingFAQ.ID));
        const savedFAQ = {
          ...(oldFAQ || {}),
          ...editingFAQ,
          ID: res.ID || editingFAQ.ID || Date.now(),
          Active: editingFAQ.Active !== undefined ? editingFAQ.Active : oldFAQ?.Active ?? true,
        } as FAQ;
        setFaqs(prev => action === 'update'
          ? prev.map(item => String(item.ID) === String(savedFAQ.ID) ? savedFAQ : item)
          : [savedFAQ, ...prev]);
        return true;
      } else {
        showAlert(res.message, 'error');
        return false;
      }
    } catch (err) {
      showAlert('Failed to save FAQ changes', 'error');
      return false;
    } finally {
      setSaveLoading(false);
    }
  };

  const handleFAQDelete = async (id: string | number) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return false;
    setSaveLoading(true);
    try {
      const res = await saveFAQ({ ID: id }, 'delete');
      if (res.success) {
        showAlert(res.message);
        setFaqs(prev => prev.filter(item => String(item.ID) !== String(id)));
        return true;
      } else {
        showAlert(res.message, 'error');
        return false;
      }
    } catch (err) {
      showAlert('Failed to delete FAQ', 'error');
      return false;
    } finally {
      setSaveLoading(false);
    }
  };

  // CRUD User callbacks
  const handleUserSubmit = async (editingUser: Partial<AdminUser>) => {
    setSaveLoading(true);
    const action = editingUser.ID ? 'update' : 'create';
    try {
      const res = await saveUser(editingUser, action);
      if (res.success) {
        showAlert(res.message);
        setUsers(await fetchUsers());
        return true;
      } else {
        showAlert(res.message, 'error');
        return false;
      }
    } catch (err) {
      showAlert('Failed to save user account', 'error');
      return false;
    } finally {
      setSaveLoading(false);
    }
  };

  const handleUserDelete = async (id: string | number) => {
    if (currentUser?.username === users.find(u => u.ID === id)?.Username) {
      showAlert("You cannot delete your own logged-in user account!", 'error');
      return false;
    }
    if (!confirm('Are you sure you want to delete this admin account?')) return false;
    setSaveLoading(true);
    try {
      const res = await saveUser({ ID: id }, 'delete');
      if (res.success) {
        showAlert(res.message);
        setUsers(await fetchUsers());
        return true;
      } else {
        showAlert(res.message, 'error');
        return false;
      }
    } catch (err) {
      showAlert('Failed to delete user account', 'error');
      return false;
    } finally {
      setSaveLoading(false);
    }
  };

  // Notification Broadcast Submit
  const handleSendNotif = async (title: string, message: string, extra?: Partial<Notification>) => {
    setSaveLoading(true);
    try {
      const res = await saveNotification({ Title: title, Message: message, ...extra }, 'create');
      if (res.success) {
        showAlert('Notification logged and broadcasted successfully!');
        const fetchedNotifs = await fetchCustomerNotificationLog();
        setNotifications(fetchedNotifs);
        return true;
      } else {
        showAlert(res.message, 'error');
        return false;
      }
    } catch (err) {
      showAlert('Failed to broadcast notification', 'error');
      return false;
    } finally {
      setSaveLoading(false);
    }
  };

  const handleNotifDelete = async (id: string | number) => {
    if (id === undefined || id === null || String(id).trim() === '') {
      showAlert('Cannot delete notification because its ID is missing.', 'error');
      return false;
    }

    if (!confirm('Are you sure you want to delete this notification log?')) return false;
    setSaveLoading(true);
    try {
      const res = await saveNotification({ ID: id }, 'delete');
      if (res.success) {
        showAlert(res.message);
        setNotifications(prev => prev.filter(n => String(n.ID) !== String(id)));
        return true;
      } else {
        showAlert(res.message, 'error');
        return false;
      }
    } catch (err) {
      showAlert('Failed to delete notification', 'error');
      return false;
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
        return true;
      } else {
        showAlert(res.message, 'error');
        return false;
      }
    } catch (err) {
      showAlert('Failed to update settings', 'error');
      return false;
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

  return {
    currentUser,
    setCurrentUser,
    authChecked,
    activeTab,
    setActiveTab,
    orders,
    setOrders,
    inquiries,
    users,
    notifications,
    adminUpdates,
    cancellationRequests,
    products,
    banners,
    faqs,
    companyInfo,
    loading,
    saveLoading,
    showAlert,
    refreshData,
    performLogout,
    handleUpdateStatusSubmit,
    handleCancellationReview,
    handleInquiryReview,
    handleProductSubmit,
    handleProductDelete,
    handleBannerSubmit,
    handleBannerDelete,
    handleFAQSubmit,
    handleFAQDelete,
    handleUserSubmit,
    handleUserDelete,
    handleSendNotif,
    handleNotifDelete,
    handleSettingsSubmit,
    handleSettingsFieldChange,
  };
};

export type AdminDataHook = ReturnType<typeof useAdminData>;
