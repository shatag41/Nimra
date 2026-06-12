import React from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../styles/theme';
import { CompanyInfo } from '../types/cms';
import { formatCurrency, FREE_DELIVERY_MINIMUM } from '../utils/commerce';
import { useCart } from '../context/CartContext';

interface CartScreenProps {
  companyInfo: CompanyInfo;
  isDark: boolean;
  onNavigate: (tab: string, params?: any) => void;
  onOpenWhatsApp: () => void;
}

export default function CartScreen({ companyInfo, isDark, onNavigate, onOpenWhatsApp }: CartScreenProps) {
  const theme = isDark ? COLORS.dark : COLORS.light;
  const cart = useCart();

  const callNow = () => {
    Linking.openURL(`tel:${companyInfo.Phone || '+918888378411'}`).catch((error) => console.error('Call failed:', error));
  };

  if (cart.items.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: theme.background }]}>
        <Text style={[styles.emptyTitle, { color: theme.text }]}>Your cart is empty.</Text>
        <Text style={[styles.emptyText, { color: theme.textMuted }]}>Add products from the listing or product detail screen to start checkout.</Text>
        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: COLORS.primary }]} onPress={() => onNavigate('Products')}>
          <Text style={styles.primaryBtnText}>Browse Products</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <View style={styles.topActions}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.primary }]} onPress={() => onNavigate('Checkout')}>
          <Text style={styles.actionText}>Proceed to Checkout</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#e8fced' }]} onPress={onOpenWhatsApp}>
          <Text style={[styles.actionText, { color: '#065f46' }]}>WhatsApp Order</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#eef2ff' }]} onPress={callNow}>
          <Text style={[styles.actionText, { color: '#3730a3' }]}>Call Now</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Cart Items</Text>
        {cart.items.map((item) => (
          <View key={item.productId} style={[styles.itemRow, { borderBottomColor: theme.border }]}>
            <Image source={{ uri: item.imageUrl }} style={styles.image} />
            <View style={styles.itemBody}>
              <Text style={[styles.itemName, { color: theme.text }]}>{item.name}</Text>
              <Text style={[styles.itemMeta, { color: theme.textMuted }]}>{item.category} / {item.volume}</Text>
              <Text style={[styles.itemPrice, { color: theme.text }]}>{formatCurrency(item.price * item.quantity)}</Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity style={[styles.qtyBtn, { borderColor: theme.border }]} onPress={() => cart.decrement(item.productId)}>
                  <Text style={[styles.qtyBtnText, { color: theme.text }]}>-</Text>
                </TouchableOpacity>
                <Text style={[styles.qtyValue, { color: theme.text }]}>{item.quantity}</Text>
                <TouchableOpacity style={[styles.qtyBtn, { borderColor: theme.border }]} onPress={() => cart.increment(item.productId)}>
                  <Text style={[styles.qtyBtnText, { color: theme.text }]}>+</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.removeBtn} onPress={() => cart.removeItem(item.productId)}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Order Summary</Text>
        <View style={styles.summaryRow}><Text style={{ color: theme.textMuted }}>Subtotal</Text><Text style={{ color: theme.text }}>{formatCurrency(cart.subtotal)}</Text></View>
        <View style={styles.summaryRow}><Text style={{ color: theme.textMuted }}>Delivery Charges</Text><Text style={{ color: theme.text }}>{cart.deliveryCharge ? formatCurrency(cart.deliveryCharge) : 'Free'}</Text></View>
        <View style={styles.summaryRow}><Text style={[styles.summaryTotalLabel, { color: theme.text }]}>Grand Total</Text><Text style={[styles.summaryTotalValue, { color: theme.text }]}>{formatCurrency(cart.grandTotal)}</Text></View>
        {cart.subtotal > 0 && cart.subtotal < FREE_DELIVERY_MINIMUM && (
          <Text style={[styles.note, { color: theme.textMuted }]}>Add {formatCurrency(FREE_DELIVERY_MINIMUM - cart.subtotal)} more for free delivery.</Text>
        )}
        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: COLORS.primary, marginTop: 12 }]} onPress={() => onNavigate('Checkout')}>
          <Text style={styles.primaryBtnText}>Go to Checkout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 120, gap: 16 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 },
  emptyTitle: { fontSize: 22, fontWeight: '800' },
  emptyText: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  primaryBtn: { minHeight: 48, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  primaryBtnText: { color: 'white', fontSize: 14, fontWeight: '800' },
  topActions: { gap: 10 },
  actionBtn: { minHeight: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  actionText: { color: 'white', fontSize: 14, fontWeight: '800' },
  sectionCard: { borderWidth: 1, borderRadius: 24, padding: 16, gap: 12 },
  summaryCard: { borderWidth: 1, borderRadius: 24, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  itemRow: { flexDirection: 'row', gap: 12, paddingBottom: 12, borderBottomWidth: 1 },
  image: { width: 84, height: 84, borderRadius: 16, backgroundColor: '#f8fafc', resizeMode: 'contain' },
  itemBody: { flex: 1, gap: 6 },
  itemName: { fontSize: 15, fontWeight: '800' },
  itemMeta: { fontSize: 12 },
  itemPrice: { fontSize: 14, fontWeight: '800' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  qtyBtn: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 18, fontWeight: '800' },
  qtyValue: { minWidth: 20, textAlign: 'center', fontSize: 14, fontWeight: '800' },
  removeBtn: { marginLeft: 'auto' },
  removeText: { color: '#dc2626', fontSize: 12, fontWeight: '800' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryTotalLabel: { fontSize: 15, fontWeight: '800' },
  summaryTotalValue: { fontSize: 18, fontWeight: '800' },
  note: { fontSize: 12, lineHeight: 18 },
});