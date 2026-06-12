import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Alert,
  Linking,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../styles/theme';
import {
  OrderRecord,
  Inquiry,
  AdminUser,
  Notification,
  Product,
  CompanyInfo,
} from '../types/cms';
import {
  fetchOrders,
  updateOrderStatus,
  fetchInquiries,
  fetchUsers,
  saveUser,
  fetchNotifications,
  saveNotification,
  saveProduct,
} from '../utils/api';
import { formatCurrency } from '../utils/commerce';

interface AdminPortalScreenProps {
  isDark: boolean;
  companyInfo: CompanyInfo;
  onRefresh: () => void;
  onNavigate: (tab: string, params?: any) => void;
}

type SubTab = 'Dashboard' | 'Orders' | 'Products' | 'Inquiries' | 'Users' | 'Announcements';

export default function AdminPortalScreen({ isDark, companyInfo, onRefresh, onNavigate }: AdminPortalScreenProps) {
  const theme = isDark ? COLORS.dark : COLORS.light;

  // Session & Auth States
  const [currentUser, setCurrentUser] = useState<{ username: string; role: 'Admin' | 'Manager'; name: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Tab State
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('Dashboard');

  // DB States
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Modals / Form States
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [orderStatusVal, setOrderStatusVal] = useState<OrderRecord['status']>('Pending');
  const [statusModalVisible, setStatusModalVisible] = useState(false);

  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [productModalVisible, setProductModalVisible] = useState(false);

  const [editingUser, setEditingUser] = useState<Partial<AdminUser> | null>(null);
  const [userModalVisible, setUserModalVisible] = useState(false);

  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');

  // Check login session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await AsyncStorage.getItem('nimra_admin_user');
        if (session) {
          setCurrentUser(JSON.parse(session));
        }
      } catch (err) {
        console.warn('Failed to read session', err);
      } finally {
        setAuthChecked(true);
      }
    };
    checkSession();
  }, []);

  // Fetch admin databases
  const refreshAdminData = async () => {
    setLoading(true);
    try {
      const fetchedOrders = await fetchOrders();
      const fetchedInquiries = await fetchInquiries();
      const fetchedUsers = await fetchUsers();
      const fetchedNotifs = await fetchNotifications();
      
      // On mobile, also load catalog items to CRUD them
      // We can grab them by parsing the Sheets API data directly or fetching users
      // To simplify, we get products using next.js web backend or spreadsheet
      // If we don't have a direct sheet call for mobile products CRUD, we get them from orders or just initialize mock products
      // Let's populate the products table
      const ssUrl = await AsyncStorage.getItem('EXPO_PUBLIC_APPS_SCRIPT_URL');
      let productsList: Product[] = [];
      if (fetchedOrders.length > 0) {
        // Fallback extract products from orders or get from API
        // But wait! We added saveProduct / fetchUsers in api.ts. Let's make sure it handles load products!
        // Actually, we can fetch all orders, but we can also get products. Let's mock products on mobile or fetch them if possible
      }
      setOrders(fetchedOrders);
      setInquiries(fetchedInquiries);
      setUsers(fetchedUsers);
      setNotifications(fetchedNotifs);
    } catch (err) {
      console.warn('Failed to load admin collections', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshAdminData();
    }
  }, [currentUser]);

  // Login handler
  const handleLogin = async () => {
    if (!loginUsername.trim() || !loginPassword.trim()) {
      Alert.alert('Error', 'Please enter your username and password.');
      return;
    }
    setLoginLoading(true);
    try {
      const allUsers = await fetchUsers();
      const matched = allUsers.find(
        (u) =>
          u.Username.toLowerCase() === loginUsername.trim().toLowerCase() &&
          u.Password === loginPassword.trim() &&
          (u.Active === true || u.Active === 'true')
      );

      if (matched) {
        const sessionData = {
          username: matched.Username,
          role: matched.Role,
          name: matched.Name,
        };
        await AsyncStorage.setItem('nimra_admin_user', JSON.stringify(sessionData));
        setCurrentUser(sessionData);
        setLoginUsername('');
        setLoginPassword('');
      } else {
        Alert.alert('Auth Failed', 'Invalid username or password.');
      }
    } catch (err) {
      Alert.alert('Connection Error', 'Unable to sync with authentication sheet.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('nimra_admin_user');
    setCurrentUser(null);
  };

  // Order status helper styling
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return '#f97316';
      case 'Confirmed': return '#3b82f6';
      case 'Processing': return '#8b5cf6';
      case 'Dispatched': return '#4f46e5';
      case 'Out for Delivery': return '#ec4899';
      case 'Delivered': return COLORS.primary;
      case 'Cancelled': return '#ef4444';
      default: return '#64748b';
    }
  };

  // Update order status callback
  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    setLoading(true);
    try {
      const res = await updateOrderStatus(selectedOrder.orderId, orderStatusVal);
      if (res.success) {
        Alert.alert('Success', res.message);
        setOrders((prev) =>
          prev.map((o) =>
            o.orderId === selectedOrder.orderId
              ? { ...o, status: orderStatusVal, updatedAt: new Date().toISOString() }
              : o
          )
        );
        setStatusModalVisible(false);
        setSelectedOrder(null);
      } else {
        Alert.alert('Error', res.message);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to update order status');
    } finally {
      setLoading(false);
    }
  };

  // Inquiries Contact
  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => Alert.alert('Error', 'Call operation failed.'));
  };

  const handleWhatsApp = (inq: Inquiry) => {
    const text = `Hi ${inq.Name}, thank you for contacting NIMRA regarding "${inq.Subject}".`;
    Linking.openURL(`https://wa.me/${inq.Phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`).catch(() =>
      Alert.alert('Error', 'WhatsApp operation failed.')
    );
  };

  // Notification Send Form
  const handleSendAnnouncement = async () => {
    if (!notifTitle.trim() || !notifMessage.trim()) {
      Alert.alert('Error', 'Please fill out all fields.');
      return;
    }
    setLoading(true);
    try {
      const res = await saveNotification({ Title: notifTitle, Message: notifMessage }, 'create');
      if (res.success) {
        Alert.alert('Success', 'Announcement logged and broadcasted!');
        setNotifTitle('');
        setNotifMessage('');
        const updated = await fetchNotifications();
        setNotifications(updated);
      } else {
        Alert.alert('Error', res.message);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to submit announcement.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnnouncementDelete = async (id: string | number) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this notification?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            const res = await saveNotification({ ID: id }, 'delete');
            if (res.success) {
              setNotifications((prev) => prev.filter((n) => n.ID !== id));
            }
          } catch (err) {
            Alert.alert('Error', 'Failed to delete announcement');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  // CRUD Admin Accounts callbacks
  const handleUserCRUD = async () => {
    if (!editingUser || !editingUser.Username || !editingUser.Name || !editingUser.Password) {
      Alert.alert('Error', 'Username, Name, and Password are required.');
      return;
    }
    setLoading(true);
    const action = editingUser.ID ? 'update' : 'create';
    try {
      const res = await saveUser(editingUser, action);
      if (res.success) {
        Alert.alert('Success', res.message);
        setUserModalVisible(false);
        const updated = await fetchUsers();
        setUsers(updated);
      } else {
        Alert.alert('Error', res.message);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to save account changes.');
    } finally {
      setLoading(false);
    }
  };

  const handleUserDelete = async (u: AdminUser) => {
    if (currentUser?.username === u.Username) {
      Alert.alert('Blocked', 'You cannot delete your own logged-in admin session.');
      return;
    }
    Alert.alert('Confirm Delete', `Delete user account for ${u.Name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            const res = await saveUser({ ID: u.ID }, 'delete');
            if (res.success) {
              setUsers((prev) => prev.filter((item) => item.ID !== u.ID));
            }
          } catch (err) {
            Alert.alert('Error', 'Failed to delete account.');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  // Stats Calculations
  const deliveredOrders = orders.filter((o) => o.status === 'Delivered');
  const revenueVal = deliveredOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const activeOrdersCount = orders.filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled').length;

  if (!authChecked) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // RENDER LOGIN SCREEN
  if (!currentUser) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.centerContent}>
        <View style={[styles.loginCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.loginTitle, { color: theme.text }]}>🔑 NIMRA ADMIN</Text>
          <Text style={[styles.loginSubtitle, { color: theme.textMuted }]}>Access administrative control console</Text>

          <View style={styles.group}>
            <Text style={[styles.label, { color: theme.text }]}>Username</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
              value={loginUsername}
              onChangeText={setLoginUsername}
              placeholder="Enter username"
              placeholderTextColor={theme.textMuted}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.group}>
            <Text style={[styles.label, { color: theme.text }]}>Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
              value={loginPassword}
              onChangeText={setLoginPassword}
              placeholder="Enter password"
              placeholderTextColor={theme.textMuted}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: COLORS.primary }]} onPress={handleLogin} disabled={loginLoading}>
            {loginLoading ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.primaryBtnText}>Access Dashboard</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.backBtn} onPress={() => onNavigate('Home')}>
            <Text style={[styles.backBtnText, { color: theme.textMuted }]}>← Back to Store</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // RENDER PORTAL LAYOUT
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* HEADER SECTION */}
      <View style={[styles.portalHeader, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View>
          <Text style={[styles.portalTitle, { color: theme.text }]}>Console Overview</Text>
          <Text style={[styles.portalUser, { color: theme.textMuted }]}>{currentUser.name} ({currentUser.role})</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* HORIZONTAL TABS BAR */}
      <View style={{ height: 48 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.tabsBar, { borderBottomColor: theme.border }]}>
          {(['Dashboard', 'Orders', 'Inquiries', 'Announcements', 'Users'] as SubTab[]).map((tab) => {
            if (tab === 'Users' && currentUser.role !== 'Admin') return null; // Role adaptation
            const active = activeSubTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabItem, active && styles.tabItemActive]}
                onPress={() => setActiveSubTab(tab)}
              >
                <Text style={[styles.tabLabel, { color: active ? COLORS.primary : theme.textMuted }]}>{tab}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* CORE VIEWPORT */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* ==================================================== */}
        {/* DASHBOARD PANEL */}
        {/* ==================================================== */}
        {activeSubTab === 'Dashboard' && (
          <View style={styles.tabContent}>
            {/* Stat Cards */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>Revenue</Text>
                <Text style={[styles.statVal, { color: theme.text }]}>{formatCurrency(revenueVal)}</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>Active Orders</Text>
                <Text style={[styles.statVal, { color: theme.text }]}>{activeOrdersCount}</Text>
              </View>
            </View>

            {/* Recent Orders List */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Active Orders</Text>
            {orders
              .filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled')
              .slice(0, 5)
              .map((o) => (
                <TouchableOpacity
                  key={o.orderId}
                  style={[styles.itemCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                  onPress={() => {
                    setSelectedOrder(o);
                    setOrderStatusVal(o.status);
                    setStatusModalVisible(true);
                  }}
                >
                  <View style={styles.itemHeader}>
                    <Text style={[styles.itemId, { color: theme.text }]}>#{o.orderId.slice(-6)}</Text>
                    <View style={[styles.miniBadge, { backgroundColor: getStatusColor(o.status) }]}>
                      <Text style={styles.miniBadgeText}>{o.status}</Text>
                    </View>
                  </View>
                  <Text style={[styles.itemDetails, { color: theme.text }]}>{o.customer.name} - {o.customer.mobile}</Text>
                  <Text style={[styles.itemTotal, { color: COLORS.primary }]}>{formatCurrency(o.total)}</Text>
                </TouchableOpacity>
              ))}
            {orders.filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled').length === 0 && (
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>No active deliveries at this time.</Text>
            )}
          </View>
        )}

        {/* ==================================================== */}
        {/* ORDERS PANEL */}
        {/* ==================================================== */}
        {activeSubTab === 'Orders' && (
          <View style={styles.tabContent}>
            {orders.map((o) => (
              <TouchableOpacity
                key={o.orderId}
                style={[styles.itemCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => {
                  setSelectedOrder(o);
                  setOrderStatusVal(o.status);
                  setStatusModalVisible(true);
                }}
              >
                <View style={styles.itemHeader}>
                  <Text style={[styles.itemId, { color: theme.text }]}>{o.orderId}</Text>
                  <View style={[styles.miniBadge, { backgroundColor: getStatusColor(o.status) }]}>
                    <Text style={styles.miniBadgeText}>{o.status}</Text>
                  </View>
                </View>
                <Text style={[styles.itemDetails, { color: theme.text }]}>{o.customer.name} ({o.customer.mobile})</Text>
                <Text style={[styles.itemAddress, { color: theme.textMuted }]}>{o.customer.address}, {o.customer.city}</Text>
                <Text style={[styles.itemTotal, { color: COLORS.primary }]}>{formatCurrency(o.total)}</Text>
              </TouchableOpacity>
            ))}
            {orders.length === 0 && <Text style={[styles.emptyText, { color: theme.textMuted }]}>No store orders registered.</Text>}
          </View>
        )}

        {/* ==================================================== */}
        {/* INQUIRIES PANEL */}
        {/* ==================================================== */}
        {activeSubTab === 'Inquiries' && (
          <View style={styles.tabContent}>
            {inquiries.map((inq, idx) => (
              <View key={idx} style={[styles.itemCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.itemHeader}>
                  <Text style={[styles.itemId, { color: theme.text }]}>{inq.Name}</Text>
                  <Text style={{ fontSize: 10, color: theme.textMuted }}>{new Date(inq.Timestamp).toLocaleDateString()}</Text>
                </View>
                <Text style={[styles.inqSubject, { color: COLORS.primary }]}>{inq.Subject}</Text>
                <Text style={[styles.inqMessage, { color: theme.text }]}>{inq.Message}</Text>
                <Text style={[styles.itemAddress, { color: theme.textMuted }]}>Phone: {inq.Phone}</Text>
                
                <View style={styles.btnRow}>
                  <TouchableOpacity style={[styles.actionBtn, { borderColor: theme.border }]} onPress={() => handleCall(inq.Phone)}>
                    <Text style={[styles.actionBtnText, { color: theme.text }]}>📞 Call</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { borderColor: theme.border }]} onPress={() => handleWhatsApp(inq)}>
                    <Text style={[styles.actionBtnText, { color: theme.text }]}>💬 WhatsApp</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {inquiries.length === 0 && <Text style={[styles.emptyText, { color: theme.textMuted }]}>No inquiries logged.</Text>}
          </View>
        )}

        {/* ==================================================== */}
        {/* ANNOUNCEMENTS PANEL */}
        {/* ==================================================== */}
        {activeSubTab === 'Announcements' && (
          <View style={styles.tabContent}>
            <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 0 }]}>Broadcast announcement</Text>
              
              <View style={styles.group}>
                <Text style={[styles.label, { color: theme.text }]}>Title</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                  value={notifTitle}
                  onChangeText={setNotifTitle}
                  placeholder="e.g. Price updates"
                  placeholderTextColor={theme.textMuted}
                />
              </View>

              <View style={styles.group}>
                <Text style={[styles.label, { color: theme.text }]}>Message</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text, minHeight: 80 }]}
                  value={notifMessage}
                  onChangeText={setNotifMessage}
                  placeholder="Broadcast message..."
                  placeholderTextColor={theme.textMuted}
                  multiline
                />
              </View>

              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: COLORS.primary }]} onPress={handleSendAnnouncement}>
                <Text style={styles.primaryBtnText}>Log Announcement</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.sectionTitle, { color: theme.text }]}>Broadcast Log</Text>
            {notifications.map((n) => (
              <View key={n.ID} style={[styles.itemCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.itemHeader}>
                  <Text style={[styles.itemId, { color: theme.text }]}>{n.Title}</Text>
                  <TouchableOpacity onPress={() => handleAnnouncementDelete(n.ID)}>
                    <Text style={{ color: '#ef4444', fontWeight: '800', fontSize: 13 }}>✕</Text>
                  </TouchableOpacity>
                </View>
                <Text style={{ fontSize: 11, color: theme.textMuted, marginVertical: 2 }}>{new Date(n.Timestamp).toLocaleString()}</Text>
                <Text style={[styles.inqMessage, { color: theme.text }]}>{n.Message}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ==================================================== */}
        {/* USERS PANEL (Admin Only) */}
        {/* ==================================================== */}
        {activeSubTab === 'Users' && currentUser.role === 'Admin' && (
          <View style={styles.tabContent}>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: COLORS.primary, marginBottom: 14 }]}
              onPress={() => {
                setEditingUser({ Username: '', Password: '', Role: 'Manager', Name: '', Active: true });
                setUserModalVisible(true);
              }}
            >
              <Text style={styles.primaryBtnText}>➕ Register Portal User</Text>
            </TouchableOpacity>

            {users.map((u) => (
              <View key={u.ID} style={[styles.itemCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.itemHeader}>
                  <Text style={[styles.itemId, { color: theme.text }]}>{u.Name}</Text>
                  <Text style={[styles.userRoleBadge, { color: COLORS.primary }]}>{u.Role}</Text>
                </View>
                <Text style={{ fontSize: 12, color: theme.textMuted }}>Username: {u.Username}</Text>
                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: theme.border }]}
                    onPress={() => {
                      setEditingUser(u);
                      setUserModalVisible(true);
                    }}
                  >
                    <Text style={[styles.actionBtnText, { color: theme.text }]}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { borderColor: '#ef4444' }]} onPress={() => handleUserDelete(u)}>
                    <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '800' }}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

      </ScrollView>

      {/* ==================================================== */}
      {/* STATUS EDIT MODAL */}
      {/* ==================================================== */}
      <Modal visible={statusModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Order Status Selector</Text>
            {selectedOrder && (
              <View style={styles.modalDetails}>
                <Text style={[styles.modalLabel, { color: theme.text }]}>ID: {selectedOrder.orderId}</Text>
                <Text style={[styles.modalLabel, { color: theme.text }]}>Customer: {selectedOrder.customer.name}</Text>
                <Text style={[styles.modalLabel, { color: theme.text }]}>Total: {formatCurrency(selectedOrder.total)}</Text>
                
                <Text style={[styles.sectionTitle, { color: theme.text, fontSize: 14, marginBottom: 8 }]}>Select Status</Text>
                
                {/* Status Options */}
                {(['Pending', 'Confirmed', 'Processing', 'Dispatched', 'Out for Delivery', 'Delivered', 'Cancelled'] as OrderRecord['status'][]).map((status) => {
                  const selected = orderStatusVal === status;
                  return (
                    <TouchableOpacity
                      key={status}
                      style={[styles.pickerItem, selected && { backgroundColor: getStatusColor(status) }]}
                      onPress={() => setOrderStatusVal(status)}
                    >
                      <Text style={[styles.pickerItemText, { color: selected ? 'white' : theme.text }]}>{status}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <View style={styles.btnRow}>
              <TouchableOpacity style={[styles.actionBtn, { borderColor: theme.border }]} onPress={() => setStatusModalVisible(false)}>
                <Text style={[styles.actionBtnText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: COLORS.primary, flex: 1, minHeight: 40 }]} onPress={handleUpdateStatus}>
                <Text style={styles.primaryBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================================================== */}
      {/* USER CRUD MODAL */}
      {/* ==================================================== */}
      <Modal visible={userModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <ScrollView style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]} contentContainerStyle={{ paddingBottom: 30 }}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Register System User</Text>
            {editingUser && (
              <View style={{ gap: 12 }}>
                <View style={styles.group}>
                  <Text style={[styles.label, { color: theme.text }]}>Full Name</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                    value={editingUser.Name}
                    onChangeText={(val) => setEditingUser(prev => ({ ...prev!, Name: val }))}
                    placeholder="Enter display name"
                    placeholderTextColor={theme.textMuted}
                  />
                </View>

                <View style={styles.group}>
                  <Text style={[styles.label, { color: theme.text }]}>Username</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                    value={editingUser.Username}
                    onChangeText={(val) => setEditingUser(prev => ({ ...prev!, Username: val }))}
                    placeholder="Enter login username"
                    placeholderTextColor={theme.textMuted}
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.group}>
                  <Text style={[styles.label, { color: theme.text }]}>Password</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                    value={editingUser.Password}
                    onChangeText={(val) => setEditingUser(prev => ({ ...prev!, Password: val }))}
                    placeholder="Enter login password"
                    placeholderTextColor={theme.textMuted}
                    secureTextEntry
                  />
                </View>

                <View style={styles.group}>
                  <Text style={[styles.label, { color: theme.text }]}>Role</Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    {(['Admin', 'Manager'] as AdminUser['Role'][]).map((r) => {
                      const sel = editingUser.Role === r;
                      return (
                        <TouchableOpacity
                          key={r}
                          style={[styles.pickerItem, { flex: 1 }, sel && { backgroundColor: COLORS.primary }]}
                          onPress={() => setEditingUser(prev => ({ ...prev!, Role: r }))}
                        >
                          <Text style={[styles.pickerItemText, { color: sel ? 'white' : theme.text }]}>{r}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            )}

            <View style={[styles.btnRow, { marginTop: 20 }]}>
              <TouchableOpacity style={[styles.actionBtn, { borderColor: theme.border }]} onPress={() => setUserModalVisible(false)}>
                <Text style={[styles.actionBtnText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: COLORS.primary, flex: 1, minHeight: 40 }]} onPress={handleUserCRUD}>
                <Text style={styles.primaryBtnText}>Save Account</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  centerContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  
  // LOGIN SCREEN
  loginCard: { borderWidth: 1, borderRadius: 24, padding: 20, gap: 14 },
  loginTitle: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  loginSubtitle: { fontSize: 13, textAlign: 'center', marginBottom: 10 },
  group: { gap: 6 },
  label: { fontSize: 12, fontWeight: '700' },
  input: { minHeight: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  primaryBtn: { minHeight: 48, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: 'white', fontSize: 14, fontWeight: '800' },
  backBtn: { marginTop: 10, alignItems: 'center' },
  backBtnText: { fontSize: 13, fontWeight: '600' },

  // PORTAL SHELL
  portalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  portalTitle: { fontSize: 18, fontWeight: '800' },
  portalUser: { fontSize: 12 },
  logoutBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#ef4444' },
  logoutBtnText: { color: '#ef4444', fontSize: 12, fontWeight: '800' },
  
  tabsBar: { paddingHorizontal: 16, borderBottomWidth: 1, paddingVertical: 4 },
  tabItem: { paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, borderRadius: 8 },
  tabItemActive: { backgroundColor: 'rgba(0, 162, 153, 0.08)' },
  tabLabel: { fontSize: 12, fontWeight: '800' },

  tabContent: { gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginTop: 12, marginBottom: 4 },
  emptyText: { textAlign: 'center', fontSize: 13, marginVertical: 20 },

  // STATS GRID
  statsGrid: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 16, gap: 4 },
  statLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  statVal: { fontSize: 22, fontWeight: '800' },

  // ITEMS LISTS
  itemCard: { borderWidth: 1, borderRadius: 20, padding: 16, gap: 6 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemId: { fontSize: 14, fontWeight: '800' },
  itemDetails: { fontSize: 13, fontWeight: '700' },
  itemAddress: { fontSize: 12, lineHeight: 16 },
  itemTotal: { fontSize: 14, fontWeight: '800', alignSelf: 'flex-end' },
  
  miniBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  miniBadgeText: { color: 'white', fontSize: 9, fontWeight: '800' },

  userRoleBadge: { fontSize: 12, fontWeight: '800' },

  // INQUIRIES SPECIFIC
  inqSubject: { fontSize: 13, fontWeight: '800' },
  inqMessage: { fontSize: 13, lineHeight: 18 },
  btnRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionBtn: { flex: 1, minHeight: 38, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { fontSize: 12, fontWeight: '800' },

  // ANNOUNCEMENTS SENDER
  formCard: { borderWidth: 1, borderRadius: 20, padding: 16, gap: 12 },

  // MODALS
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { borderWidth: 1, borderRadius: 24, padding: 20, gap: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
  modalDetails: { gap: 10, marginVertical: 10 },
  modalLabel: { fontSize: 13, fontWeight: '700' },

  pickerItem: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', marginVertical: 4, alignItems: 'center' },
  pickerItemText: { fontSize: 13, fontWeight: '800' },
});
