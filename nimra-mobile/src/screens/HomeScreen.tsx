import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent
} from 'react-native';
import { COLORS } from '../styles/theme';
import { Banner, FAQ, CompanyInfo } from '../types/cms';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HomeScreenProps {
  banners: Banner[];
  faqs: FAQ[];
  companyInfo: CompanyInfo;
  isDark: boolean;
  onNavigate: (tab: string, params?: any) => void;
}

export default function HomeScreen({ banners, faqs, companyInfo, isDark, onNavigate }: HomeScreenProps) {
  const [activeBanner, setActiveBanner] = useState(0);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const theme = isDark ? COLORS.dark : COLORS.light;
  
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    if (roundIndex !== activeBanner) {
      setActiveBanner(roundIndex);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* 1. HERO CAROUSEL */}
      <View style={styles.carouselContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {banners.map((banner, index) => (
            <View key={banner.ID || index} style={styles.slide}>
              <Image source={{ uri: banner.ImageUrl }} style={styles.slideImage} />
              <View style={styles.overlay}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Premium Hydration</Text>
                </View>
                <Text style={styles.slideTitle}>{banner.Title}</Text>
                <Text style={styles.slideSubtitle}>{banner.Subtitle}</Text>
                
                <TouchableOpacity 
                  style={styles.slideButton}
                  onPress={() => onNavigate('Products')}
                >
                  <Text style={styles.slideButtonText}>{banner.ButtonText}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
        
        {/* Indicators */}
        <View style={styles.indicators}>
          {banners.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                activeBanner === index ? styles.activeIndicator : null
              ]}
            />
          ))}
        </View>
      </View>

      {/* 2. BRAND STORY */}
      <View style={styles.section}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.badgePrimary}>
            <Text style={styles.badgePrimaryText}>About NIMRA</Text>
          </View>
          <Text style={[styles.cardHeading, { color: theme.text }]}>Sourced to Refresh. Purified to Protect.</Text>
          <Text style={[styles.cardDesc, { color: theme.textMuted }]}>
            {companyInfo.AboutStory || "At NIMRA, we believe pure drinking water is the cornerstone of robust health. MERGING advanced purification technologies with mineral balancing to ensure safety."}
          </Text>
          
          <View style={styles.row}>
            <View style={styles.iconBullet}>
              <Text style={styles.bulletTitle}>ISI Certified</Text>
              <Text style={[styles.bulletDesc, { color: theme.textMuted }]}>Bureau of Indian Standards IS 14543</Text>
            </View>
            <View style={styles.iconBullet}>
              <Text style={styles.bulletTitle}>Mineral Rich</Text>
              <Text style={[styles.bulletDesc, { color: theme.textMuted }]}>With Potassium and Magnesium</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.btn, { backgroundColor: COLORS.primary }]}
            onPress={() => onNavigate('About')}
          >
            <Text style={styles.btnText}>Read More About Us</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. RUSH SODA "COMING SOON" */}
      <View style={styles.section}>
        <View style={styles.rushCard}>
          <View style={styles.badgeOrange}>
            <Text style={styles.badgeOrangeText}>Coming Soon</Text>
          </View>
          <Text style={styles.rushTitle}>Feel the Fizz of RUSH Soda</Text>
          <Text style={styles.rushDesc}>
            Prepare your taste buds for the ultimate sparkling experience. RUSH Soda is our upcoming line of premium carbonated club sodas and carbonated beverages, produced with dual-carbon filtration.
          </Text>
          <View style={styles.rushPillRow}>
            <View style={styles.rushPill}><Text style={styles.rushPillText}>Extra Sparkling</Text></View>
            <View style={styles.rushPill}><Text style={styles.rushPillText}>Crisp Taste</Text></View>
          </View>
          <TouchableOpacity 
            style={styles.rushBtn}
            onPress={() => onNavigate('Inquiry', { subject: 'Rush Soda Notification Registration' })}
          >
            <Text style={styles.rushBtnText}>Notify Me on Release</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. FAQs ACCORDION */}
      <View style={[styles.section, { marginBottom: 80 }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Frequently Asked Questions</Text>
        <View style={styles.faqList}>
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <View 
                key={faq.ID || index} 
                style={[styles.faqItem, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <TouchableOpacity 
                  style={styles.faqHeader}
                  onPress={() => setActiveFaq(isOpen ? null : index)}
                >
                  <Text style={[styles.faqQuestion, { color: theme.text }]}>{faq.Question}</Text>
                  <Text style={[styles.faqArrow, { color: COLORS.primary }]}>
                    {isOpen ? '▲' : '▼'}
                  </Text>
                </TouchableOpacity>
                {isOpen && (
                  <View style={[styles.faqBody, { borderTopColor: theme.border }]}>
                    <Text style={[styles.faqAnswer, { color: theme.textMuted }]}>{faq.Answer}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  carouselContainer: {
    height: 320,
    position: 'relative',
  },
  slide: {
    width: SCREEN_WIDTH,
    height: 320,
    position: 'relative',
  },
  slideImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: 24,
  },
  badge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 50,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  slideTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'sans-serif-condensed',
    marginBottom: 8,
  },
  slideSubtitle: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  slideButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 50,
    alignSelf: 'flex-start',
  },
  slideButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },
  indicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  activeIndicator: {
    backgroundColor: COLORS.primary,
    width: 20,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  badgePrimary: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 50,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  badgePrimaryText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardHeading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  iconBullet: {
    flex: 1,
  },
  bulletTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  bulletDesc: {
    fontSize: 11,
    lineHeight: 14,
  },
  btn: {
    paddingVertical: 12,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },

  /* Rush Soda styling */
  rushCard: {
    backgroundColor: '#0c0f16',
    borderWidth: 1,
    borderColor: '#3a2010',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 3,
  },
  badgeOrange: {
    backgroundColor: COLORS.orangeLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 50,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  badgeOrangeText: {
    color: COLORS.orange,
    fontSize: 11,
    fontWeight: 'bold',
  },
  rushTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  rushDesc: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  rushPillRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  rushPill: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 50,
  },
  rushPillText: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '600',
  },
  rushBtn: {
    backgroundColor: COLORS.orange,
    paddingVertical: 12,
    borderRadius: 50,
    alignItems: 'center',
  },
  rushBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },

  /* FAQs */
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  faqList: {
    gap: 10,
  },
  faqItem: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  faqHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  faqQuestion: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  faqArrow: {
    fontSize: 10,
  },
  faqBody: {
    borderTopWidth: 1,
    padding: 16,
  },
  faqAnswer: {
    fontSize: 12,
    lineHeight: 18,
  },
});
