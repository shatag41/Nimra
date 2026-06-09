import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList
} from 'react-native';
import { COLORS } from '../styles/theme';
import { Product } from '../types/cms';

interface ProductsScreenProps {
  products: Product[];
  isDark: boolean;
  onNavigate: (tab: string, params?: any) => void;
}

export default function ProductsScreen({ products, isDark, onNavigate }: ProductsScreenProps) {
  const [activeTab, setActiveTab] = useState<'Water' | 'Soda'>('Water');
  const theme = isDark ? COLORS.dark : COLORS.light;

  const filteredProducts = products.filter((p) => p.Category === 'Packaged Water');

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* Category Tabs */}
      <View style={[styles.tabContainer, { borderBottomColor: theme.border }]}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'Water' ? styles.activeTabButton : null]}
          onPress={() => setActiveTab('Water')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'Water' ? COLORS.primary : theme.textMuted }]}>
            Packaged Water
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'Soda' ? styles.activeTabButton : null]}
          onPress={() => setActiveTab('Soda')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'Soda' ? COLORS.primary : theme.textMuted }]}>
            RUSH Soda (Coming Soon)
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'Soda' ? (
        /* Soda Teaser */
        <ScrollView contentContainerStyle={styles.teaserScroll}>
          <View style={[styles.teaserCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.badgeOrange}>
              <Text style={styles.badgeOrangeText}>Teaser</Text>
            </View>
            <Text style={[styles.teaserTitle, { color: theme.text }]}>RUSH Soda Sparkling Range</Text>
            <Text style={[styles.teaserDesc, { color: theme.textMuted }]}>
              We are currently establishing our carbonated filling lines at our Daund plant. Our upcoming **RUSH Soda** range will offer extra-fizzy double-filtered club sodas, ideal for dining, social mixers, and absolute refreshment.
            </Text>
            
            <View style={styles.teaserRow}>
              <View style={[styles.teaserBullet, { backgroundColor: theme.background }]}>
                <Text style={styles.bulletNum}>1</Text>
                <Text style={[styles.bulletTitle, { color: theme.text }]}>Extra Fizz</Text>
              </View>
              <View style={[styles.teaserBullet, { backgroundColor: theme.background }]}>
                <Text style={styles.bulletNum}>2</Text>
                <Text style={[styles.bulletTitle, { color: theme.text }]}>Pure Water Base</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.btn, { backgroundColor: COLORS.orange, marginTop: 10 }]}
              onPress={() => onNavigate('Inquiry', { subject: 'Rush Soda Notification Registration' })}
            >
              <Text style={styles.btnText}>Register for Launch News</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        /* Water Catalog */
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => (item.ID || item.Name).toString()}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={[styles.productCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.imageContainer}>
                <Image source={{ uri: item.ImageUrl }} style={styles.productImage} />
              </View>
              <View style={styles.infoContainer}>
                <View style={styles.metaRow}>
                  <Text style={styles.volumeText}>{item.Volume}</Text>
                  <Text style={[styles.categoryText, { color: theme.textMuted }]}>Packaged Water</Text>
                </View>
                <Text style={[styles.productName, { color: theme.text }]}>{item.Name}</Text>
                <Text style={[styles.productDesc, { color: theme.textMuted }]} numberOfLines={2}>
                  {item.Description}
                </Text>
                <View style={styles.footerRow}>
                  <Text style={[styles.priceText, { color: theme.text }]}>₹{item.Price}</Text>
                  <TouchableOpacity 
                    style={styles.orderBtn}
                    onPress={() => onNavigate('Inquiry', { 
                      product: item.Name, 
                      subject: `Order Inquiry for ${item.Name}` 
                    })}
                  >
                    <Text style={styles.orderBtnText}>Inquire</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
    gap: 16,
    paddingBottom: 80,
  },
  productCard: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  imageContainer: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  productImage: {
    width: '80%',
    height: '80%',
    resizeMode: 'contain',
  },
  infoContainer: {
    flex: 1,
    paddingLeft: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  volumeText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: 'bold',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 50,
  },
  categoryText: {
    fontSize: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
  },
  orderBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 50,
  },
  orderBtnText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },

  /* Teaser */
  teaserScroll: {
    padding: 16,
  },
  teaserCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  badgeOrange: {
    backgroundColor: COLORS.orangeLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 12,
  },
  badgeOrangeText: {
    color: COLORS.orange,
    fontSize: 10,
    fontWeight: 'bold',
  },
  teaserTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  teaserDesc: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  teaserRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  teaserBullet: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  bulletNum: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.orange,
    marginBottom: 4,
  },
  bulletTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 50,
    alignItems: 'center',
    width: '100%',
  },
  btnText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
