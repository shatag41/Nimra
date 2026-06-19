import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../styles/theme';
import { ds, radius, space, typography, useResponsive } from '../styles/designSystem';
import { OrderRecord } from '../types/cms';
import { formatCurrency } from '../utils/commerce';
import { trackOrder } from '../utils/api';
import { useAuth } from '../context/AuthContext';

interface TrackOrderScreenProps {
  isDark: boolean;
  initialOrderId?: string;
  onNavigate: (tab: string, params?: any) => void;
}

const statusSteps: OrderRecord['status'][] = ['Pending', 'Confirmed', 'Processing', 'Dispatched', 'Out for Delivery', 'Delivered', 'Cancelled'];

export default function TrackOrderScreen({ isDark, initialOrderId, onNavigate }: TrackOrderScreenProps) {
  const theme = isDark ? COLORS.dark : COLORS.light;
  const responsive = useResponsive();
  const { user } = useAuth();
  const [orderId, setOrderId] = useState(initialOrderId || '');
  const [mobile, setMobile] = useState(user?.Mobile || '');
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (initialOrderId) setOrderId(initialOrderId);
  }, [initialOrderId]);

  useEffect(() => {
    if (user?.Mobile && !mobile) setMobile(user.Mobile);
  }, [mobile, user?.Mobile]);

  const submit = async () => {
    if (!orderId.trim() && !mobile.trim()) {
      setMessage('Enter an Order ID or mobile number to search.');
      setOrder(null);
      return;
    }

    setLoading(true);
    setMessage('');
    const result = await trackOrder(orderId.trim(), user ? '' : mobile.trim(), {
      userId: user?.ID,
      email: user?.Username,
      mobile: user?.Mobile,
    });
    setLoading(false);

    if (result.success && result.order) {
      setOrder(result.order);
      setMessage('');
    } else {
      setOrder(null);
      setMessage(result.message || 'Order not found.');
    }
  };

  const refresh = async () => {
    if (!orderId.trim() && !mobile.trim()) return;
    setRefreshing(true);
    await submit();
    setRefreshing(false);
  };

  const activeIndex = order ? statusSteps.indexOf(order.status) : -1;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={[styles.content, { padding: responsive.pagePadding, paddingBottom: responsive.bottomInset, maxWidth: responsive.maxContentWidth }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={COLORS.primary} />}
    >
      <Text style={[styles.title, { color: theme.text }]}>Track Your Order</Text>
      <Text style={[styles.subtitle, { color: theme.textMuted }]}>Search by Order ID or mobile number to fetch the latest status from the Orders sheet.</Text>

      <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.group}>
          <Text style={[styles.label, { color: theme.text }]}>Order ID</Text>
          <TextInput style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]} value={orderId} onChangeText={setOrderId} placeholder="NIMRA-..." placeholderTextColor={theme.textMuted} autoCapitalize="characters" />
        </View>
        <View style={styles.group}>
          <Text style={[styles.label, { color: theme.text }]}>Mobile Number</Text>
          <TextInput style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]} value={mobile} onChangeText={(value) => setMobile(value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile number" placeholderTextColor={theme.textMuted} keyboardType="number-pad" maxLength={10} />
        </View>
        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: COLORS.primary }]} onPress={submit} disabled={loading}>
          {loading ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.primaryBtnText}>Track Order</Text>}
        </TouchableOpacity>
      </View>

      {message ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{message}</Text>
        </View>
      ) : null}

      {order && (
        <View style={[styles.resultCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.resultHeader}>
            <View>
              <Text style={[styles.metaLabel, { color: theme.textMuted }]}>Order ID</Text>
              <Text style={[styles.metaValue, { color: theme.text }]}>{order.orderId}</Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>{order.status}</Text>
            </View>
          </View>

          <View style={styles.progressRow}>
            {statusSteps.map((step, index) => {
              const isCancelled = order.status === 'Cancelled';
              const isStepCancelled = step === 'Cancelled';
              let active = index <= activeIndex;
              if (isCancelled && !isStepCancelled && step !== 'Pending' && step !== 'Confirmed' && step !== 'Processing') {
                active = false;
              }
              const showRed = isStepCancelled && isCancelled;
              
              return (
                <View key={step} style={[styles.progressStep, { width: responsive.isTablet ? '13%' : '22%' }]}>
                  <View style={[
                    styles.stepDot, 
                    active && styles.stepDotActive,
                    showRed && { backgroundColor: '#ef4444', borderColor: '#ef4444' }
                  ]}>
                    <Text style={[
                      styles.stepDotText, 
                      active && styles.stepDotTextActive,
                      showRed && { color: 'white' }
                    ]}>
                      {showRed ? '✕' : index + 1}
                    </Text>
                  </View>
                  <Text style={[
                    styles.stepLabel, 
                    { color: active ? theme.text : theme.textMuted },
                    showRed && { color: '#ef4444', fontWeight: '800' }
                  ]}>
                    {step}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={styles.detailGrid}>
            <View style={styles.detailBlock}><Text style={[styles.metaLabel, { color: theme.textMuted }]}>Customer</Text><Text style={[styles.metaValue, { color: theme.text }]}>{order.customer.name}</Text></View>
            <View style={styles.detailBlock}><Text style={[styles.metaLabel, { color: theme.textMuted }]}>Mobile</Text><Text style={[styles.metaValue, { color: theme.text }]}>{order.customer.mobile}</Text></View>
            <View style={styles.detailBlock}><Text style={[styles.metaLabel, { color: theme.textMuted }]}>Total</Text><Text style={[styles.metaValue, { color: theme.text }]}>{formatCurrency(order.total)}</Text></View>
          </View>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>Items</Text>
          {order.items.map((item) => (
            <View key={item.productId} style={styles.itemRow}>
              <Text style={[styles.itemText, { color: theme.text }]}>{item.name} x {item.quantity}</Text>
              <Text style={[styles.itemText, { color: theme.text }]}>{formatCurrency(item.price * item.quantity)}</Text>
            </View>
          ))}

          <Text style={[styles.sectionTitle, { color: theme.text }]}>Delivery Address</Text>
          <Text style={[styles.addressText, { color: theme.textMuted }]}>
            {order.customer.address}, {order.customer.city}, {order.customer.state} - {order.customer.pincode}
          </Text>

          <TouchableOpacity style={[styles.secondaryBtn, { borderColor: theme.border }]} onPress={() => onNavigate('Products')}>
            <Text style={[styles.secondaryBtnText, { color: theme.text }]}>Order More Products</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { width: '100%', alignSelf: 'center', gap: space[4] },
  title: { ...typography.display },
  subtitle: { ...typography.body },
  formCard: { ...ds.cardLarge },
  group: { ...ds.group },
  label: { ...ds.label },
  input: { ...ds.input },
  primaryBtn: { ...ds.button, minHeight: 50 },
  primaryBtnText: { ...ds.buttonText },
  errorBox: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)', borderRadius: radius.lg, padding: space[3] },
  errorText: { color: '#dc2626', ...typography.smallStrong },
  resultCard: { ...ds.cardLarge },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space[3], flexWrap: 'wrap' },
  metaLabel: { ...typography.micro, textTransform: 'uppercase' },
  metaValue: { fontSize: 15, lineHeight: 21, fontWeight: '800' },
  statusPill: { ...ds.pill, paddingVertical: space[2], backgroundColor: COLORS.primaryLight },
  statusPillText: { color: COLORS.primary, ...typography.micro },
  progressRow: { flexDirection: 'row', justifyContent: 'flex-start', gap: space[2], flexWrap: 'wrap', marginVertical: space[2] },
  progressStep: { alignItems: 'center', gap: space[2], marginVertical: space[2], minWidth: 64 },
  stepDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  stepDotActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stepDotText: { fontSize: 10, fontWeight: '800', color: '#64748b' },
  stepDotTextActive: { color: 'white' },
  stepLabel: { fontSize: 9, fontWeight: '700', textAlign: 'center', lineHeight: 12 },
  detailGrid: { gap: space[3] },
  detailBlock: { gap: 2 },
  sectionTitle: { ...typography.h3, marginTop: space[1] },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', gap: space[3] },
  itemText: { ...typography.smallStrong, flex: 1 },
  addressText: { ...typography.body },
  secondaryBtn: { ...ds.secondaryButton, marginTop: space[1] },
  secondaryBtnText: { ...typography.bodyStrong, textAlign: 'center' },
});
