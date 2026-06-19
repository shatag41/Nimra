import React, { useState } from 'react';
import { FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../styles/theme';
import { ds, radius, space, typography, useResponsive } from '../styles/designSystem';
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
  const responsive = useResponsive();

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
        key={`products-${responsive.columns}`}
        data={filteredProducts}
        numColumns={responsive.columns}
        columnWrapperStyle={responsive.columns > 1 ? styles.columnWrapper : undefined}
        keyExtractor={(item) => String(item.ID || item.Name)}
        contentContainerStyle={[
          styles.listContainer,
          {
            padding: responsive.pagePadding,
            paddingBottom: responsive.bottomInset,
            maxWidth: responsive.maxContentWidth,
          },
        ]}
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
  tabButton: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTabButton: { borderBottomColor: COLORS.primary },
  tabText: { ...typography.smallStrong },
  listContainer: { width: '100%', alignSelf: 'center', gap: space[4] },
  columnWrapper: { gap: space[4] },
  emptyText: { textAlign: 'center', marginTop: space[10], fontWeight: '600' },
  productCard: { ...ds.card, flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', elevation: 1 },
  imageContainer: { width: 96, aspectRatio: 1, borderRadius: radius.md, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  productImage: { width: '84%', height: '84%', resizeMode: 'contain' },
  infoContainer: { flex: 1, paddingLeft: space[3], gap: space[2], minWidth: 0 },
  metaRow: { ...ds.rowBetween },
  volumeText: { color: COLORS.primary, ...typography.micro, backgroundColor: COLORS.primaryLight, paddingHorizontal: space[2], paddingVertical: 2, borderRadius: radius.pill },
  categoryText: { ...typography.micro, flex: 1, textAlign: 'right' },
  productName: { ...typography.bodyStrong },
  productDesc: { ...typography.small, marginBottom: space[1] },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space[3], flexWrap: 'wrap' },
  priceText: { fontSize: 16, lineHeight: 22, fontWeight: '800' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  detailBtn: { ...ds.secondaryButton, minHeight: 36, paddingVertical: space[2], paddingHorizontal: space[3] },
  detailBtnText: { ...typography.smallStrong },
  orderBtn: { ...ds.button, minHeight: 36, backgroundColor: COLORS.primary, paddingVertical: space[2], paddingHorizontal: space[4] },
  notifyBtn: { backgroundColor: COLORS.orange },
  orderBtnText: { color: 'white', ...typography.smallStrong },
});
