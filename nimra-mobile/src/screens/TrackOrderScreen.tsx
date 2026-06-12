import React, { useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../styles/theme';
import { OrderRecord } from '../types/cms';
import { formatCurrency } from '../utils/commerce';
import { trackOrder } from '../utils/api';

interface TrackOrderScreenProps {
  isDark: boolean;
  onNavigate: (tab: string, params?: any) => void;
}

const statusSteps: OrderRecord['status'][] = ['Pending', 'Confirmed', 'Processing', 'Out for Delivery', 'Delivered'];

export default function TrackOrderScreen({ isDark, onNavigate }: TrackOrderScreenProps) {
  const theme = isDark ? COLORS.dark : COLORS.light;
  const [orderId, setOrderId] = useState('');
  const [mobile, setMobile] = useState('');
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const submit = async () => {
    if (!orderId.trim() && !mobile.trim()) {
      setMessage('Enter an Order ID or mobile number to search.');
      setOrder(null);
      return;
    }

    setLoading(true);
    setMessage('');
    const result = await trackOrder(orderId.trim(), mobile.trim());
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
      contentContainerStyle={styles.content}
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
              const active = index <= activeIndex;
              return (
                <View key={step} style={styles.progressStep}>
                  <View style={[styles.stepDot, active && styles.stepDotActive]}>
                    <Text style={[styles.stepDotText, active && styles.stepDotTextActive]}>{index + 1}</Text>
                  </View>
                  <Text style={[styles.stepLabel, { color: active ? theme.text : theme.textMuted }]}>{step}</Text>
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
  content: { padding: 16, paddingBottom: 120, gap: 16 },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 13, lineHeight: 20 },
  formCard: { borderWidth: 1, borderRadius: 24, padding: 16, gap: 14 },
  group: { gap: 6 },
  label: { fontSize: 12, fontWeight: '700' },
  input: { minHeight: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  primaryBtn: { minHeight: 50, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: 'white', fontSize: 14, fontWeight: '800' },
  errorBox: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)', borderRadius: 16, padding: 12 },
  errorText: { color: '#dc2626', fontSize: 12, lineHeight: 16, fontWeight: '700' },
  resultCard: { borderWidth: 1, borderRadius: 24, padding: 16, gap: 14 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  metaLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  metaValue: { fontSize: 15, fontWeight: '800' },
  statusPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: COLORS.primaryLight },
  statusPillText: { color: COLORS.primary, fontSize: 11, fontWeight: '800' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6, flexWrap: 'wrap' },
  progressStep: { alignItems: 'center', gap: 6, flexBasis: '18%' },
  stepDot: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  stepDotActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stepDotText: { fontSize: 11, fontWeight: '800', color: '#64748b' },
  stepDotTextActive: { color: 'white' },
  stepLabel: { fontSize: 10, fontWeight: '700', textAlign: 'center', lineHeight: 14 },
  detailGrid: { gap: 10 },
  detailBlock: { gap: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginTop: 4 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  itemText: { fontSize: 13, fontWeight: '700', flex: 1 },
  addressText: { fontSize: 13, lineHeight: 20 },
  secondaryBtn: { minHeight: 48, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  secondaryBtnText: { fontSize: 14, fontWeight: '800' },
});