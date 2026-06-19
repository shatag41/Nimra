import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../styles/theme';
import { ds, radius, space, typography, useResponsive } from '../styles/designSystem';
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
  const responsive = useResponsive();
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
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={[styles.content, { padding: responsive.pagePadding, paddingBottom: responsive.bottomInset, maxWidth: responsive.isLaptop ? 860 : responsive.maxContentWidth }]}>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Image source={{ uri: product.ImageUrl }} style={[styles.image, { height: responsive.isTablet ? 360 : 260 }]} />
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
  content: { width: '100%', alignSelf: 'center' },
  empty: { ...ds.empty },
  emptyTitle: { ...typography.h3, textAlign: 'center' },
  card: { ...ds.cardLarge },
  image: { width: '100%', resizeMode: 'contain', backgroundColor: '#f8fafc', borderRadius: radius.lg },
  metaRow: { ...ds.rowBetween, flexWrap: 'wrap' },
  volume: { color: COLORS.primary, ...typography.micro, backgroundColor: COLORS.primaryLight, paddingHorizontal: space[3], paddingVertical: space[1], borderRadius: radius.pill },
  category: { ...typography.smallStrong },
  title: { ...typography.h1 },
  price: { ...typography.h2 },
  desc: { ...typography.body },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[3], marginTop: space[2] },
  qtyBtn: { width: 52, height: 52, borderRadius: radius.lg, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 24, fontWeight: '800' },
  qtyValue: { minWidth: 84, height: 52, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  qtyValueText: { fontSize: 18, fontWeight: '800' },
  primaryBtn: { ...ds.button, minHeight: 50, marginTop: space[1] },
  primaryBtnText: { ...ds.buttonText },
  secondaryBtn: { ...ds.secondaryButton },
  secondaryBtnText: { ...typography.bodyStrong, textAlign: 'center' },
});
