import React, { useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../styles/theme';
import { CompanyInfo, OrderSubmission } from '../types/cms';
import { submitOrder } from '../utils/api';
import { formatCurrency } from '../utils/commerce';
import { useCart } from '../context/CartContext';

interface CheckoutScreenProps {
  companyInfo: CompanyInfo;
  isDark: boolean;
  onNavigate: (tab: string, params?: any) => void;
}

const initialForm = {
  name: '',
  mobile: '',
  email: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  instructions: '',
};

export default function CheckoutScreen({ companyInfo, isDark, onNavigate }: CheckoutScreenProps) {
  const theme = isDark ? COLORS.dark : COLORS.light;
  const cart = useCart();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string; orderId?: string }>({ type: null, message: '' });

  const isEmailValid = /^\S+@\S+\.\S+$/.test(form.email.trim());
  const isMobileValid = /^\d{10}$/.test(form.mobile.trim());
  const isPincodeValid = /^\d{6}$/.test(form.pincode.trim());
  const isFormValid = Boolean(
    form.name.trim() &&
    isMobileValid &&
    isEmailValid &&
    form.address.trim() &&
    form.city.trim() &&
    form.state.trim() &&
    isPincodeValid &&
    cart.items.length > 0
  );

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const callNow = () => {
    Linking.openURL(`tel:${companyInfo.Phone || '+918888378411'}`).catch((error) => console.error('Call failed:', error));
  };

  const submit = async () => {
    if (!isFormValid) {
      setStatus({
        type: 'error',
        message: 'Please complete every required field with valid details before placing the order.',
      });
      return;
    }

    setLoading(true);
    setStatus({ type: null, message: '' });

    const payload: OrderSubmission = {
      type: 'order',
      customer: {
        name: form.name.trim(),
        mobile: form.mobile.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        instructions: form.instructions.trim(),
      },
      items: cart.items,
      subtotal: cart.subtotal,
      deliveryCharge: cart.deliveryCharge,
      total: cart.grandTotal,
      paymentMethod: 'Cash on Delivery',
      source: 'Mobile App',
    };

    const result = await submitOrder(payload);

    if (result.success) {
      cart.clearCart();
      setForm(initialForm);
      setStatus({ type: 'success', message: result.message, orderId: result.orderId });
    } else {
      setStatus({ type: 'error', message: result.message });
    }

    setLoading(false);
  };

  if (cart.items.length === 0 && status.type !== 'success') {
    return (
      <View style={[styles.empty, { backgroundColor: theme.background }]}>
        <Text style={[styles.emptyTitle, { color: theme.text }]}>Your cart is empty.</Text>
        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: COLORS.primary }]} onPress={() => onNavigate('Products')}>
          <Text style={styles.primaryBtnText}>Shop Products</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status.type === 'success') {
    return (
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
        <View style={[styles.successCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.successTitle, { color: theme.text }]}>Order placed successfully</Text>
          <Text style={[styles.successText, { color: theme.textMuted }]}>{status.message}</Text>
          {status.orderId && <Text style={[styles.orderId, { color: COLORS.primary }]}>Order ID: {status.orderId}</Text>}
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: COLORS.primary }]} onPress={() => onNavigate('Track', { orderId: status.orderId })}>
            <Text style={styles.primaryBtnText}>Track Order</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.secondaryBtn, { borderColor: theme.border }]} onPress={() => onNavigate('Products')}>
            <Text style={[styles.secondaryBtnText, { color: theme.text }]}>Continue Shopping</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.secondaryBtn, { borderColor: theme.border }]} onPress={callNow}>
            <Text style={[styles.secondaryBtnText, { color: theme.text }]}>Click to Call</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: theme.text }]}>Checkout</Text>
      <Text style={[styles.subtitle, { color: theme.textMuted }]}>Fill in the delivery details and place your order securely.</Text>

      {status.type === 'error' && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{status.message}</Text>
        </View>
      )}

      <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.group}>
          <Text style={[styles.label, { color: theme.text }]}>Name *</Text>
          <TextInput style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]} value={form.name} onChangeText={(value) => update('name', value)} placeholder="Enter your name" placeholderTextColor={theme.textMuted} />
        </View>
        <View style={styles.group}>
          <Text style={[styles.label, { color: theme.text }]}>Mobile Number *</Text>
          <TextInput style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]} value={form.mobile} onChangeText={(value) => update('mobile', value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile number" placeholderTextColor={theme.textMuted} keyboardType="number-pad" maxLength={10} />
        </View>
        <View style={styles.group}>
          <Text style={[styles.label, { color: theme.text }]}>Email *</Text>
          <TextInput style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]} value={form.email} onChangeText={(value) => update('email', value)} placeholder="name@example.com" placeholderTextColor={theme.textMuted} keyboardType="email-address" autoCapitalize="none" />
        </View>
        <View style={styles.group}>
          <Text style={[styles.label, { color: theme.text }]}>Address *</Text>
          <TextInput style={[styles.input, styles.textArea, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]} value={form.address} onChangeText={(value) => update('address', value)} placeholder="Delivery address" placeholderTextColor={theme.textMuted} multiline />
        </View>
        <View style={styles.splitRow}>
          <View style={[styles.group, styles.flex1]}>
            <Text style={[styles.label, { color: theme.text }]}>City *</Text>
            <TextInput style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]} value={form.city} onChangeText={(value) => update('city', value)} placeholder="City" placeholderTextColor={theme.textMuted} />
          </View>
          <View style={[styles.group, styles.flex1]}>
            <Text style={[styles.label, { color: theme.text }]}>State *</Text>
            <TextInput style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]} value={form.state} onChangeText={(value) => update('state', value)} placeholder="State" placeholderTextColor={theme.textMuted} />
          </View>
        </View>
        <View style={styles.group}>
          <Text style={[styles.label, { color: theme.text }]}>Pincode *</Text>
          <TextInput style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]} value={form.pincode} onChangeText={(value) => update('pincode', value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit pincode" placeholderTextColor={theme.textMuted} keyboardType="number-pad" maxLength={6} />
        </View>
        <View style={styles.group}>
          <Text style={[styles.label, { color: theme.text }]}>Special Instructions</Text>
          <TextInput style={[styles.input, styles.textArea, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]} value={form.instructions} onChangeText={(value) => update('instructions', value)} placeholder="Delivery notes, landmark, etc." placeholderTextColor={theme.textMuted} multiline />
        </View>
      </View>

      <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Order Summary</Text>
        {cart.items.map((item) => (
          <View key={item.productId} style={styles.summaryItem}>
            <Text style={[styles.summaryItemText, { color: theme.text }]}>{item.name} x {item.quantity}</Text>
            <Text style={{ color: theme.text }}>{formatCurrency(item.price * item.quantity)}</Text>
          </View>
        ))}
        <View style={styles.summaryRow}><Text style={{ color: theme.textMuted }}>Subtotal</Text><Text style={{ color: theme.text }}>{formatCurrency(cart.subtotal)}</Text></View>
        <View style={styles.summaryRow}><Text style={{ color: theme.textMuted }}>Delivery Charges</Text><Text style={{ color: theme.text }}>{cart.deliveryCharge ? formatCurrency(cart.deliveryCharge) : 'Free'}</Text></View>
        <View style={styles.summaryRow}><Text style={[styles.totalLabel, { color: theme.text }]}>Grand Total</Text><Text style={[styles.totalValue, { color: theme.text }]}>{formatCurrency(cart.grandTotal)}</Text></View>
        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: isFormValid && !loading ? COLORS.primary : '#94a3b8' }]} disabled={loading || !isFormValid} onPress={submit}>
          {loading ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.primaryBtnText}>Place Order</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 120, gap: 16 },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 13, lineHeight: 20 },
  errorBox: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)', borderRadius: 16, padding: 12 },
  errorText: { color: '#dc2626', fontSize: 12, lineHeight: 16, fontWeight: '700' },
  formCard: { borderWidth: 1, borderRadius: 24, padding: 16, gap: 14 },
  group: { gap: 6 },
  splitRow: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },
  label: { fontSize: 12, fontWeight: '700' },
  input: { minHeight: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  textArea: { minHeight: 96, textAlignVertical: 'top' },
  summaryCard: { borderWidth: 1, borderRadius: 24, padding: 16, gap: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  summaryItem: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  summaryItemText: { flex: 1, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: 15, fontWeight: '800' },
  totalValue: { fontSize: 18, fontWeight: '800' },
  primaryBtn: { minHeight: 50, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  primaryBtnText: { color: 'white', fontSize: 14, fontWeight: '800' },
  secondaryBtn: { minHeight: 48, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  secondaryBtnText: { fontSize: 14, fontWeight: '800' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 },
  emptyTitle: { fontSize: 22, fontWeight: '800' },
  successCard: { borderWidth: 1, borderRadius: 24, padding: 20, gap: 12, alignItems: 'center' },
  successTitle: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  successText: { fontSize: 13, lineHeight: 20, textAlign: 'center' },
  orderId: { fontSize: 16, fontWeight: '800' },
});