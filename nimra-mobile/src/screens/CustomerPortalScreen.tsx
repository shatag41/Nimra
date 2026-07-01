import React, { useEffect, useState } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS } from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import { fetchCustomerOrders, requestOrderCancellation } from '../utils/api';
import { OrderRecord } from '../types/cms';

interface CustomerPortalProps {
  isDark: boolean;
  onNavigate: (tab: string) => void;
}

export default function CustomerPortalScreen({ isDark, onNavigate }: CustomerPortalProps) {
  const theme = isDark ? COLORS.dark : COLORS.light;
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchCustomerOrders(user?.ID || '', user?.Username || '');
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('pending')) return '#eab308';
    if (s.includes('processing')) return '#3b82f6';
    if (s.includes('shipped')) return '#a855f7';
    if (s.includes('delivered')) return '#22c55e';
    if (s.includes('cancel')) return '#ef4444';
    return '#64748b';
  };

  const handleRequestCancellation = (order: OrderRecord) => {
    Alert.alert(
      'Request cancellation',
      `Submit this cancellation request for admin approval?\n\nOrder: ${order.orderId}`,
      [
        { text: 'Keep Order', style: 'cancel' },
        {
          text: 'Submit Request',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            const res = await requestOrderCancellation(order);
            setLoading(false);
            if (res.success) {
              Alert.alert('Request submitted', 'Your cancellation request is pending admin approval.');
              loadOrders();
            } else {
              Alert.alert('Unable to submit', res.message);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Header */}
      <View style={[styles.headerCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>Hello, {user?.Name}!</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>Email: {user?.Username}</Text>
        {user?.Mobile ? <Text style={[styles.subtitle, { color: theme.textMuted }]}>Mobile: {user?.Mobile}</Text> : null}
      </View>

      {/* Quick Actions */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
      <View style={styles.grid}>
        <TouchableOpacity style={[styles.gridItem, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => onNavigate('Products')}>
          <Text style={styles.gridEmoji}>💧</Text>
          <Text style={[styles.gridText, { color: theme.text }]}>Browse Products</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.gridItem, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => onNavigate('Track')}>
          <Text style={styles.gridEmoji}>📦</Text>
          <Text style={[styles.gridText, { color: theme.text }]}>Track Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.gridItem, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => onNavigate('Inquiry')}>
          <Text style={styles.gridEmoji}>✉️</Text>
          <Text style={[styles.gridText, { color: theme.text }]}>Support</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.gridItem, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => onNavigate('About')}>
          <Text style={styles.gridEmoji}>ℹ️</Text>
          <Text style={[styles.gridText, { color: theme.text }]}>About Us</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Orders */}
      <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 24 }]}>Your Recent Orders</Text>
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 32 }} />
      ) : orders.length > 0 ? (
        orders.map((order, index) => (
          <View key={index} style={[styles.orderCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.orderHeader}>
              <Text style={[styles.orderId, { color: theme.text }]}>{order.orderId}</Text>
              <Text style={[styles.orderTotal, { color: COLORS.primary }]}>₹{order.total.toFixed(2)}</Text>
            </View>
            <View style={styles.orderDetails}>
              <Text style={[styles.orderDate, { color: theme.textMuted }]}>{new Date(order.createdAt).toLocaleDateString()}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>{order.status}</Text>
              </View>
            </View>
            {order.cancellationStatus === 'Pending' ? (
              <Text style={[styles.pendingCancellationText, { color: theme.textMuted }]}>Cancellation requested. Awaiting admin approval.</Text>
            ) : ['Pending', 'Confirmed'].includes(order.status) ? (
              <TouchableOpacity style={styles.cancelBtn} onPress={() => handleRequestCancellation(order)}>
                <Text style={styles.cancelBtnText}>Request Cancellation</Text>
              </TouchableOpacity>
            ) : ['Processing', 'Dispatched', 'Out for Delivery', 'Delivered'].includes(order.status) ? (
              <View>
                <TouchableOpacity style={[styles.cancelBtn, { opacity: 0.45 }]} disabled>
                  <Text style={styles.cancelBtnText}>Request Cancellation</Text>
                </TouchableOpacity>
                <Text style={[styles.pendingCancellationText, { color: theme.textMuted }]}>This order is already being prepared and can no longer be cancelled.</Text>
              </View>
            ) : null}
          </View>
        ))
      ) : (
        <View style={[styles.emptyState, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>You haven't placed any orders yet.</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => onNavigate('Products')}>
            <Text style={styles.shopBtnText}>Shop Now</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  gridEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  gridText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  orderCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '800',
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderDate: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  pendingCancellationText: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
  },
  cancelBtn: {
    alignSelf: 'flex-start',
    borderColor: '#ef4444',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 12,
  },
  cancelBtnText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '800',
  },
  emptyState: {
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 16,
  },
  shopBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
