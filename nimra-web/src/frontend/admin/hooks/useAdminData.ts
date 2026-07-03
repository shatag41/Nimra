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
  fetchProducts,
  saveProduct,
  fetchBanners,
  saveBanner,
  fetchFAQs,
  saveFAQ,
  saveCompanyInfo,
  fetchCancellationRequests,
  reviewCancellationRequest,
  markInquiryReviewed,
} from '@/utils/api';
import { clearBrowserSession, useAuth } from '@/frontend/customer/contexts/AuthContext';
import { toast } from 'sonner';
import { getUploadImageUrl } from '@/utils/uploadImage';

export interface CurrentUser {
  id?: string | number;
  username: string;
  role: 'Admin' | 'Manager';
  name: string;
  email?: string;
  phone?: string;
}

export const useAdminData = (initialCMSData: CMSData) => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();

  // Auth state
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'products' | 'banners' | 'faqs' | 'inquiries' | 'users' | 'notifications' | 'settings'>(() => {
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
      toast.success(text);
    } else {
      toast.error(text);
    }
  };

  // Check auth on mount
  useEffect(() => {
    if (authLoading) return;

    if (isAuthenticated && user?.Role === 'Admin') {
      const adminSession: CurrentUser = {
        id: user.ID,
        username: user.Username,
        role: 'Admin',
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
    const [
        fetchedOrders,
        fetchedInquiries,
        fetchedUsers,
        fetchedNotifs,
        fetchedAdminUpdates,
        fetchedCancellationRequests,
        fetchedProducts,
        fetchedBanners,
        fetchedFaqs,
    ] = await Promise.all([
        fetchOrders(),
        fetchInquiries(),
        fetchUsers(),
        fetchCustomerNotificationLog(),
        fetchAdminUpdates(),
        fetchCancellationRequests(),
        fetchProducts(),
        fetchBanners(),
        fetchFAQs(),
    ]);
    return {
        fetchedOrders,
        fetchedInquiries,
        fetchedUsers,
        fetchedNotifs,
        fetchedAdminUpdates,
        fetchedCancellationRequests,
        fetchedProducts,
        fetchedBanners,
        fetchedFaqs,
    };
  };

  const { data: swrData, error: swrError, mutate: refreshDataSWR } = useSWR(authChecked ? 'adminData' : null, fetcher, { refreshInterval: 30000, revalidateOnFocus: true });

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
    const productForSave: Partial<Product> = action === 'update' && oldProduct
      ? ([
          'Name',
          'Category',
          'Volume',
          'Price',
          'Description',
          'ImageUrl',
          'Specifications',
          'StockStatus',
          'DiscountPercent',
          'ComboPack',
          'Active',
        ] as (keyof Product)[]).reduce<Partial<Product>>((changes, field) => {
          if (!Object.prototype.hasOwnProperty.call(editingProduct, field)) return changes;
          const nextValue = editingProduct[field];
          if (field === 'ImageUrl' && !nextValue && oldProduct.ImageUrl) return changes;
          if (String(nextValue ?? '') !== String(oldProduct[field] ?? '')) {
            return { ...changes, [field]: nextValue };
          }
          return changes;
        }, { ID: editingProduct.ID })
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
        const updatedBanners = await fetchBanners();
        setBanners(updatedBanners);
        router.refresh();
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
        const updatedFaqs = await fetchFAQs();
        setFaqs(updatedFaqs);
        router.refresh();
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
        const updatedFaqs = await fetchFAQs();
        setFaqs(updatedFaqs);
        router.refresh();
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
        if (action === 'create') {
          setUsers(prev => [...prev, { ...editingUser, ID: res.ID, Active: true } as AdminUser]);
        } else {
          setUsers(prev => prev.map(u => u.ID === editingUser.ID ? editingUser as AdminUser : u));
        }
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
        setUsers(prev => prev.filter(u => u.ID !== id));
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
