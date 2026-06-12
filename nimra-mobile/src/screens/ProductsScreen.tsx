import React, { useState } from 'react';
import { FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../styles/theme';
import { Product } from '../types/cms';
import { formatCurrency, isOrderable, normalizeCategory } from '../utils/commerce';

interface ProductsScreenProps {
  products: Product[];
  isDark: boolean;
  onNavigate: (tab: string, params?: any) => void;
  onAddToCart?: (product: Product) => void;
  onRefresh?: () => Promise<void>;
}

export default function ProductsScreen({ products, isDark, onNavigate, onAddToCart, onRefresh }: ProductsScreenProps) {
  const [activeTab, setActiveTab] = useState<'Water' | 'Bulk' | 'Soda'>('Water');
  const [refreshing, setRefreshing] = useState(false);
  const theme = isDark ? COLORS.dark : COLORS.light;

  const filteredProducts = products.filter((product) => {
    const category = normalizeCategory(product.Category);
    if (activeTab === 'Bulk') return category === 'Bulk Water';
    if (activeTab === 'Soda') return category === 'Upcoming RUSH Soda';
    return category === 'Packaged Drinking Water' || category === 'Mineral Water';
  });

  const refresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.tabContainer, { borderBottomColor: theme.border }]}>
        {(['Water', 'Bulk', 'Soda'] as const).map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tabButton, activeTab === tab && styles.activeTabButton]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, { color: activeTab === tab ? COLORS.primary : theme.textMuted }]}>
              {tab === 'Soda' ? 'RUSH Soda' : tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => String(item.ID || item.Name)}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={COLORS.primary} />}
        ListEmptyComponent={<Text style={[styles.emptyText, { color: theme.textMuted }]}>Products added in Google Sheets will appear here.</Text>}
        renderItem={({ item }) => {
          const orderable = isOrderable(item);
          return (
            <View style={[styles.productCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.imageContainer}>
                <Image source={{ uri: item.ImageUrl }} style={styles.productImage} />
              </View>
              <View style={styles.infoContainer}>
                <View style={styles.metaRow}>
                  <Text style={styles.volumeText}>{item.Volume}</Text>
                  <Text style={[styles.categoryText, { color: theme.textMuted }]}>{normalizeCategory(item.Category)}</Text>
                </View>
                <Text style={[styles.productName, { color: theme.text }]}>{item.Name}</Text>
                <Text style={[styles.productDesc, { color: theme.textMuted }]} numberOfLines={2}>{item.Description}</Text>
                <View style={styles.footerRow}>
                  <Text style={[styles.priceText, { color: theme.text }]}>{formatCurrency(Number(item.Price))}</Text>
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.detailBtn, { borderColor: theme.border }]}
                      onPress={() => onNavigate('ProductDetail', { product: item })}
                    >
                      <Text style={[styles.detailBtnText, { color: theme.text }]}>Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.orderBtn, !orderable && styles.notifyBtn]}
                      onPress={() => orderable ? onAddToCart?.(item) : onNavigate('Inquiry', { subject: 'RUSH Soda launch notification' })}
                    >
                      <Text style={styles.orderBtnText}>{orderable ? 'Add' : 'Notify'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabContainer: { flexDirection: 'row', borderBottomWidth: 1 },
  tabButton: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTabButton: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: 'bold' },
  listContainer: { padding: 16, gap: 16, paddingBottom: 120 },
  emptyText: { textAlign: 'center', marginTop: 40, fontWeight: '600' },
  productCard: { flexDirection: 'row', borderRadius: 8, borderWidth: 1, padding: 12, alignItems: 'center', elevation: 1 },
  imageContainer: { width: 90, height: 90, borderRadius: 8, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  productImage: { width: '84%', height: '84%', resizeMode: 'contain' },
  infoContainer: { flex: 1, paddingLeft: 12 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, gap: 8 },
  volumeText: { color: COLORS.primary, fontSize: 10, fontWeight: 'bold', backgroundColor: COLORS.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 50 },
  categoryText: { fontSize: 10, flex: 1, textAlign: 'right' },
  productName: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  productDesc: { fontSize: 11, lineHeight: 15, marginBottom: 8 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceText: { fontSize: 16, fontWeight: '800' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailBtn: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 50, borderWidth: 1, backgroundColor: 'transparent' },
  detailBtnText: { fontSize: 11, fontWeight: 'bold' },
  orderBtn: { backgroundColor: COLORS.primary, paddingVertical: 7, paddingHorizontal: 16, borderRadius: 50 },
  notifyBtn: { backgroundColor: COLORS.orange },
  orderBtnText: { color: 'white', fontSize: 11, fontWeight: 'bold' },
});
