import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from './src/styles/theme';
import { fetchCMSData } from './src/utils/api';
import { CMSData, Product } from './src/types/cms';
import { CartProvider, useCart } from './src/context/CartContext';
import Toast from 'react-native-toast-message';

// Import Screens
import HomeScreen from './src/screens/HomeScreen';
import ProductsScreen from './src/screens/ProductsScreen';
import InquiryScreen from './src/screens/InquiryScreen';
import AboutScreen from './src/screens/AboutScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import CartScreen from './src/screens/CartScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import TrackOrderScreen from './src/screens/TrackOrderScreen';
import AdminPortalScreen from './src/screens/AdminPortalScreen';
import CustomerPortalScreen from './src/screens/CustomerPortalScreen';

// Auth
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

type ScreenName = 'Home' | 'Products' | 'ProductDetail' | 'Cart' | 'Checkout' | 'Track' | 'Inquiry' | 'About' | 'AdminPortal' | 'CustomerPortal';

function AppShell() {
  const cart = useCart();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [currentTab, setCurrentTab] = useState<ScreenName>('Home');
  const [showLanding, setShowLanding] = useState(false);
  const [cmsData, setCmsData] = useState<CMSData>({
    banners: [],
    products: [],
    faqs: [],
    companyInfo: {},
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [prefillParams, setPrefillParams] = useState<{ product?: string; subject?: string; orderId?: string } | null>(null);
  
  const { user, logout } = useAuth();

  const loadData = async (silent = false) => {
    if (silent) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await fetchCMSData();
      setCmsData(data);
    } catch (err) {
      console.warn('Failed to load live data, keeping offline mock CMS.', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleNavigate = (tab: string, params?: any) => {
    if (params) {
      setPrefillParams(params);
      if (params.product) {
        setSelectedProduct(params.product);
      }
    }
    setCurrentTab(tab as ScreenName);
  };

  // Enforce role-based initial tab with landing delay
  useEffect(() => {
    setShowLanding(true);
    const timer = setTimeout(() => {
      setShowLanding(false);
      if (user && user.Role === 'Admin') {
        setCurrentTab('AdminPortal');
      } else if (user && user.Role === 'Customer') {
        setCurrentTab('CustomerPortal');
      } else {
        setCurrentTab('Home');
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [user]);

  const handleCall = () => {
    const phone = cmsData.companyInfo.Phone || '+918888378411';
    Linking.openURL(`tel:${phone}`).catch((err) => console.error("Call failed:", err));
  };

  const handleWhatsApp = () => {
    const wpNum = cmsData.companyInfo.WhatsAppNumber || '918888378411';
    const text = "Hi NIMRA, I'd like to check packaged drinking water prices.";
    Linking.openURL(`https://wa.me/${wpNum}?text=${encodeURIComponent(text)}`).catch((err) => 
      console.error("WhatsApp failed:", err)
    );
  };

  const handleOrderWhatsApp = () => {
    const wpNum = cmsData.companyInfo.WhatsAppNumber || '918888378411';
    const text = cart.items.length
      ? `Hi NIMRA, I want to place this order:\n${cart.items.map((item) => `- ${item.name} x ${item.quantity}`).join('\n')}\nTotal: Rs ${Math.round(cart.grandTotal)}`
      : "Hi NIMRA, I'd like to place an order.";
    Linking.openURL(`https://wa.me/${wpNum}?text=${encodeURIComponent(text)}`).catch((err) =>
      console.error('WhatsApp failed:', err)
    );
  };

  const theme = isDark ? COLORS.dark : COLORS.light;

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: COLORS.light.background }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading NIMRA CMS...</Text>
      </View>
    );
  }

  // Active Screen Rendering
  const renderScreen = () => {
    switch (currentTab) {
      case 'Home':
        return (
          <HomeScreen
            banners={cmsData.banners}
            faqs={cmsData.faqs}
            companyInfo={cmsData.companyInfo}
            isDark={isDark}
            onNavigate={handleNavigate}
          />
        );
      case 'Products':
        return (
          <ProductsScreen
            products={cmsData.products}
            isDark={isDark}
            onNavigate={handleNavigate}
            onAddToCart={cart.addProduct}
            onRefresh={() => loadData(true)}
          />
        );
      case 'ProductDetail':
        return (
          <ProductDetailScreen
            product={selectedProduct}
            isDark={isDark}
            onNavigate={handleNavigate}
          />
        );
      case 'Cart':
        return (
          <CartScreen
            companyInfo={cmsData.companyInfo}
            isDark={isDark}
            onNavigate={handleNavigate}
            onOpenWhatsApp={handleOrderWhatsApp}
          />
        );
      case 'Checkout':
        return (
          <CheckoutScreen
            companyInfo={cmsData.companyInfo}
            isDark={isDark}
            onNavigate={handleNavigate}
          />
        );
      case 'Track':
        return (
          <TrackOrderScreen
            isDark={isDark}
            initialOrderId={prefillParams?.orderId}
            onNavigate={handleNavigate}
          />
        );
      case 'Inquiry':
        return (
          <InquiryScreen
            isDark={isDark}
            prefillParams={prefillParams}
            onClearPrefill={() => setPrefillParams(null)}
          />
        );
      case 'About':
        return (
          <AboutScreen
            companyInfo={cmsData.companyInfo}
            isDark={isDark}
          />
        );
      case 'AdminPortal':
        return (
          <AdminPortalScreen
            isDark={isDark}
            companyInfo={cmsData.companyInfo}
            onRefresh={() => loadData(true)}
            onNavigate={handleNavigate}
          />
        );
      case 'CustomerPortal':
        return (
          <CustomerPortalScreen
            isDark={isDark}
            onNavigate={handleNavigate}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.card }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.card} />
      
      {/* HEADER BAR */}
      <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.card }]}>
        <View style={styles.logoBox}>
          <Text style={[styles.logoText, { color: theme.text }]}>NIMRA</Text>
        </View>
        <View style={styles.headerRight}>
          {/* Quick Call */}
          <TouchableOpacity style={[styles.headerBtn, { backgroundColor: COLORS.primaryLight }]} onPress={handleCall}>
            <Text style={styles.headerBtnEmoji}>📞</Text>
          </TouchableOpacity>

          {/* Quick WhatsApp */}
          <TouchableOpacity style={[styles.headerBtn, { backgroundColor: '#e8fced' }]} onPress={handleWhatsApp}>
            <Text style={styles.headerBtnEmoji}>💬</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.headerBtn, { backgroundColor: '#e0f2fe' }]} onPress={() => handleNavigate('Track')}>
            <Text style={styles.headerBtnEmoji}>📦</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.headerBtn, { backgroundColor: '#fff7ed', position: 'relative' }]} onPress={() => handleNavigate('Cart')}>
            <Text style={styles.headerBtnEmoji}>🛒</Text>
            {cart.totalItems > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cart.totalItems}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Theme Switch */}
          <TouchableOpacity 
            style={[styles.headerBtn, { backgroundColor: isDark ? '#374151' : '#f1f5f9' }]}
            onPress={() => setIsDark(!isDark)}
          >
            <Text style={styles.headerBtnEmoji}>{isDark ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>

          {/* Admin Lock / Logout Button */}
          {user?.Role === 'Admin' && currentTab !== 'AdminPortal' ? (
            <TouchableOpacity 
              style={[styles.headerBtn, { backgroundColor: '#fee2e2' }]} 
              onPress={() => handleNavigate('AdminPortal')}
            >
              <Text style={styles.headerBtnEmoji}>🔑</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.headerBtn, { backgroundColor: '#fee2e2' }]} 
              onPress={logout}
            >
              <Text style={styles.headerBtnEmoji}>🚪</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* SCREEN CONTAINER */}
      <View style={{ flex: 1 }}>
        {showLanding ? (
          <View style={[styles.loadingContainer, { backgroundColor: theme.card }]}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.text, marginBottom: 8 }}>
              Welcome, {user?.Name || 'Guest'}!
            </Text>
            <Text style={{ fontSize: 16, color: theme.textMuted, marginBottom: 24 }}>
              Preparing your workspace...
            </Text>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          renderScreen()
        )}
      </View>

      {/* FLOATING ACTION PANELS */}
      {currentTab !== 'Inquiry' && (
        <View style={styles.fabContainer}>
          <TouchableOpacity style={[styles.fab, styles.fabCall]} onPress={handleCall}>
            <Text style={styles.fabText}>📞 Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.fab, styles.fabWp]} onPress={handleWhatsApp}>
            <Text style={styles.fabText}>💬 WhatsApp</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* BOTTOM NAVIGATION BAR (Hide for Admin Portal) */}
      {currentTab !== 'AdminPortal' && (
        <View style={[styles.tabBar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          {(!user || user.Role !== 'Customer') && (
            <TouchableOpacity 
              style={styles.tabItem}
              onPress={() => handleNavigate('Home')}
            >
              <Text style={[styles.tabIcon, { color: currentTab === 'Home' ? COLORS.primary : theme.textMuted }]}>🏠</Text>
              <Text style={[styles.tabLabel, { color: currentTab === 'Home' ? COLORS.primary : theme.textMuted }]}>Home</Text>
            </TouchableOpacity>
          )}

          {user?.Role === 'Customer' && (
            <TouchableOpacity 
              style={styles.tabItem}
              onPress={() => handleNavigate('CustomerPortal')}
            >
              <Text style={[styles.tabIcon, { color: currentTab === 'CustomerPortal' ? COLORS.primary : theme.textMuted }]}>👤</Text>
              <Text style={[styles.tabLabel, { color: currentTab === 'CustomerPortal' ? COLORS.primary : theme.textMuted }]}>Portal</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.tabItem}
            onPress={() => handleNavigate('Products')}
          >
            <Text style={[styles.tabIcon, { color: currentTab === 'Products' ? COLORS.primary : theme.textMuted }]}>💧</Text>
            <Text style={[styles.tabLabel, { color: currentTab === 'Products' ? COLORS.primary : theme.textMuted }]}>Products</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.tabItem}
            onPress={() => handleNavigate('Inquiry')}
          >
            <Text style={[styles.tabIcon, { color: currentTab === 'Inquiry' ? COLORS.primary : theme.textMuted }]}>✉️</Text>
            <Text style={[styles.tabLabel, { color: currentTab === 'Inquiry' ? COLORS.primary : theme.textMuted }]}>Inquiry</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.tabItem}
            onPress={() => handleNavigate('About')}
          >
            <Text style={[styles.tabIcon, { color: currentTab === 'About' ? COLORS.primary : theme.textMuted }]}>ℹ️</Text>
            <Text style={[styles.tabLabel, { color: currentTab === 'About' ? COLORS.primary : theme.textMuted }]}>About</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: COLORS.light.background }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="AppShell" component={AppShell} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <RootNavigator />
        </CartProvider>
      </AuthProvider>
      <Toast />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  logoBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'sans-serif-medium',
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnEmoji: {
    fontSize: 14,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.orange,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '800',
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    flex: 1,
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: 'bold',
  },

  /* Floating Action Buttons */
  fabContainer: {
    position: 'absolute',
    bottom: 76,
    right: 16,
    gap: 8,
    zIndex: 99,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  fabCall: {
    backgroundColor: COLORS.primary,
  },
  fabWp: {
    backgroundColor: '#25d366',
  },
  fabText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
