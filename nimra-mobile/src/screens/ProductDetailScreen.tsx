import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../styles/theme';
import { Product } from '../types/cms';
import { formatCurrency, isOrderable, normalizeCategory } from '../utils/commerce';
import { useCart } from '../context/CartContext';

interface ProductDetailScreenProps {
  product: Product | null;
  isDark: boolean;
  onNavigate: (tab: string, params?: any) => void;
}

export default function ProductDetailScreen({ product, isDark, onNavigate }: ProductDetailScreenProps) {
  const theme = isDark ? COLORS.dark : COLORS.light;
  const cart = useCart();

  if (!product) {
    return (
      <View style={[styles.empty, { backgroundColor: theme.background }]}>
        <Text style={[styles.emptyTitle, { color: theme.text }]}>Select a product to view details.</Text>
        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: COLORS.primary }]} onPress={() => onNavigate('Products')}>
          <Text style={styles.primaryBtnText}>Back to Products</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const orderable = isOrderable(product);
  const quantity = cart.getItemQuantity(String(product.ID || product.Name));

  const handleIncrease = () => {
    if (quantity > 0) {
      cart.increment(String(product.ID || product.Name));
      return;
    }
    cart.addProduct(product, 1);
  };

  const handleDecrease = () => {
    if (quantity <= 0) return;
    cart.decrement(String(product.ID || product.Name));
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Image source={{ uri: product.ImageUrl }} style={styles.image} />
        <View style={styles.metaRow}>
          <Text style={styles.volume}>{product.Volume}</Text>
          <Text style={[styles.category, { color: theme.textMuted }]}>{normalizeCategory(product.Category)}</Text>
        </View>
        <Text style={[styles.title, { color: theme.text }]}>{product.Name}</Text>
        <Text style={[styles.price, { color: theme.text }]}>{formatCurrency(Number(product.Price))}</Text>
        <Text style={[styles.desc, { color: theme.textMuted }]}>{product.Description}</Text>

        {orderable ? (
          <>
            <View style={styles.qtyRow}>
              <TouchableOpacity style={[styles.qtyBtn, { borderColor: theme.border }]} onPress={handleDecrease}>
                <Text style={[styles.qtyBtnText, { color: theme.text }]}>-</Text>
              </TouchableOpacity>
              <View style={[styles.qtyValue, { borderColor: theme.border }]}>
                <Text style={[styles.qtyValueText, { color: theme.text }]}>{quantity}</Text>
              </View>
              <TouchableOpacity style={[styles.qtyBtn, { borderColor: theme.border }]} onPress={handleIncrease}>
                <Text style={[styles.qtyBtnText, { color: theme.text }]}>+</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: COLORS.primary }]} onPress={handleIncrease}>
              <Text style={styles.primaryBtnText}>{quantity > 0 ? 'Add One More' : 'Add to Cart'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.secondaryBtn, { borderColor: theme.border }]} onPress={() => onNavigate('Cart')}>
              <Text style={[styles.secondaryBtnText, { color: theme.text }]}>Go to Cart</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: COLORS.orange }]} onPress={() => onNavigate('Inquiry', { subject: `${product.Name} launch notification` })}>
            <Text style={styles.primaryBtnText}>Notify Me</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 120 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  card: { borderWidth: 1, borderRadius: 24, padding: 16, gap: 14 },
  image: { width: '100%', height: 260, resizeMode: 'contain', backgroundColor: '#f8fafc', borderRadius: 18 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  volume: { color: COLORS.primary, fontSize: 11, fontWeight: '800', backgroundColor: COLORS.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  category: { fontSize: 11, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '800', lineHeight: 30 },
  price: { fontSize: 22, fontWeight: '800' },
  desc: { fontSize: 14, lineHeight: 21 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 8 },
  qtyBtn: { width: 52, height: 52, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 24, fontWeight: '800' },
  qtyValue: { minWidth: 84, height: 52, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  qtyValueText: { fontSize: 18, fontWeight: '800' },
  primaryBtn: { minHeight: 50, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  primaryBtnText: { color: 'white', fontSize: 14, fontWeight: '800' },
  secondaryBtn: { minHeight: 48, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  secondaryBtnText: { fontSize: 14, fontWeight: '800' },
});