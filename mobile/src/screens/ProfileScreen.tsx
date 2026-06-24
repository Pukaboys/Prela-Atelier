import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Colors, Typography, Spacing, Shadow } from '../constants/theme';
import { useUserStore } from '../store/userStore';
import { useOrderStore } from '../store/orderStore';
import type { RootStackParamList } from '../types';
import { formatPrice } from '../utils/currency';
import { formatDate, formatOrderStatus } from '../utils/formatting';

import CurrencySelector from '../components/CurrencySelector';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const WEBSITE_URL = 'https://www.prela-atelier.com';

const MENU_ITEMS = [
  {
    icon: 'T',
    label: 'Track an Order',
    description: 'Check your order status and timeline',
    action: 'track',
  },
  {
    icon: 'B',
    label: 'Bespoke Enquiries',
    description: 'Start a custom order request',
    action: 'enquiries',
  },
  {
    icon: 'C',
    label: 'Care & Maintenance',
    description: 'How to care for your marble pieces',
    action: 'care',
  },
  {
    icon: 'S',
    label: 'Shipping & Returns',
    description: 'Delivery and returns information',
    action: 'shipping',
  },
  {
    icon: '@',
    label: 'Contact Us',
    description: 'Get in touch with our team',
    action: 'contact',
  },
] as const;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { email, isAuthenticated, clearUser } = useUserStore();
  const { orders, loading, error, fetchOrders, clearOrders } = useOrderStore();
  const [ordersExpanded, setOrdersExpanded] = useState(false);

  const visibleOrders = ordersExpanded ? orders : orders.slice(0, 2);
  const hasHiddenOrders = orders.length > 2;

  const handleSignOut = () => {
    clearOrders();
    clearUser();
  };

  const handleRefreshOrders = () => {
    if (email) {
      void fetchOrders(email).catch(() => {});
    }
  };

  useEffect(() => {
    if (isAuthenticated() && email && orders.length === 0 && !loading) {
      void fetchOrders(email).catch(() => {});
    }
  }, [email]);

  const openWebsitePage = async (path: string) => {
    const url = `${WEBSITE_URL}${path}`;

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to open page', `Please visit ${url} in your browser.`);
    }
  };

  const handleMenuAction = (action: (typeof MENU_ITEMS)[number]['action']) => {
    switch (action) {
      case 'track':
        if (isAuthenticated() && email && orders[0]) {
          navigation.navigate('OrderTracking', {
            orderCode: orders[0].orderCode,
            email,
          });
        } else {
          navigation.navigate('OrderTracking', email ? { email } : undefined);
        }
        break;
      case 'enquiries':
        navigation.navigate('MainTabs', { screen: 'Bespoke' });
        break;
      case 'care':
        void openWebsitePage('/care');
        break;
      case 'shipping':
        void openWebsitePage('/shipping');
        break;
      case 'contact':
        void openWebsitePage('/contact');
        break;
      default:
        break;
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerSuper}>YOUR ACCOUNT</Text>
          <Text style={styles.title}>Profile</Text>
        </View>
        <CurrencySelector />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {isAuthenticated() ? (
          <View style={styles.accountCard}>
            <View style={styles.accountAvatar}>
              <Text style={styles.accountAvatarText}>
                {email?.charAt(0).toUpperCase() ?? '?'}
              </Text>
            </View>
            <View style={styles.accountInfo}>
              <Text style={styles.accountEmail}>{email}</Text>
              <TouchableOpacity onPress={handleSignOut}>
                <Text style={styles.signOutText}>Sign out</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.guestCard}>
            <Text style={styles.guestTitle}>Welcome to Prela Atelier</Text>
            <Text style={styles.guestSub}>
              Sign in to track your orders and manage your enquiries
            </Text>
            <TouchableOpacity
              style={styles.signInBtn}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.signInBtnText}>SIGN IN</Text>
            </TouchableOpacity>
          </View>
        )}

        {isAuthenticated() && (
          <View style={styles.ordersPanel}>
            <View style={styles.ordersHeader}>
              <View>
                <Text style={styles.sectionLabel}>ORDER HISTORY</Text>
                <Text style={styles.ordersTitle}>Your orders</Text>
              </View>
              <TouchableOpacity onPress={handleRefreshOrders} disabled={loading}>
                <Text style={styles.refreshText}>{loading ? 'Loading' : 'Refresh'}</Text>
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.ordersError}>{error}</Text> : null}

            {!loading && orders.length === 0 ? (
              <Text style={styles.ordersEmpty}>No orders found for this email.</Text>
            ) : (
              visibleOrders.map((order) => (
                <TouchableOpacity
                  key={order.id}
                  style={styles.orderRow}
                  onPress={() => navigation.navigate('OrderTracking', {
                    orderCode: order.orderCode,
                    email: email ?? undefined,
                  })}
                  activeOpacity={0.75}
                >
                  <View style={styles.orderRowTop}>
                    <Text style={styles.orderCode}>{order.orderCode}</Text>
                    <View style={styles.orderRight}>
                      <Text style={styles.orderTotal}>{formatPrice(order.total, order.currency)}</Text>
                      <View style={[
                        styles.statusBadge,
                        order.status === 'cancelled' && styles.statusBadgeCancelled,
                        order.status === 'delivered' && styles.statusBadgeDelivered,
                      ]}>
                        <Text style={styles.statusBadgeText}>{formatOrderStatus(order.status)}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.orderRowMeta}>
                    <Text style={styles.orderMetaText}>
                      {formatDate(order.createdAt)} - {order.itemCount} item{order.itemCount === 1 ? '' : 's'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}

            {hasHiddenOrders && (
              <TouchableOpacity
                style={styles.ordersToggle}
                onPress={() => setOrdersExpanded((value) => !value)}
                activeOpacity={0.75}
              >
                <Text style={styles.ordersToggleText}>
                  {ordersExpanded ? 'Show latest two' : `Show ${orders.length - 2} more`}
                </Text>
                <Text style={styles.ordersToggleIcon}>{ordersExpanded ? '^' : 'v'}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.menu}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.action}
              style={[
                styles.menuItem,
                index === MENU_ITEMS.length - 1 && styles.menuItemLast,
              ]}
              onPress={() => handleMenuAction(item.action)}
              activeOpacity={0.7}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuDesc}>{item.description}</Text>
              </View>
              <Text style={styles.menuChevron}>{'>'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.appInfo}>
          <Text style={styles.brandName}>PRELA ATELIER</Text>
          <Text style={styles.brandTagline}>Luxury Marble - Crafted for You</Text>
          <Text style={styles.version}>v1.0.0</Text>
        </View>

        <View style={{ height: insets.bottom + Spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerSuper: {
    fontSize: Typography.xs - 1,
    color: Colors.accent,
    letterSpacing: Typography.trackingWidest * 1.5,
    marginBottom: 2,
  },
  title: {
    fontSize: Typography.xl,
    fontFamily: Typography.fontSerif,
    color: Colors.primary,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.lg,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 4,
    ...Shadow.sm,
  },
  accountAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountAvatarText: {
    fontSize: Typography.xl,
    color: Colors.textInverse,
    fontFamily: Typography.fontSerif,
  },
  accountInfo: {
    flex: 1,
    gap: 3,
  },
  accountEmail: {
    fontSize: Typography.base,
    color: Colors.textPrimary,
    fontFamily: Typography.fontSans,
  },
  signOutText: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
  ordersPanel: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 4,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  ordersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  sectionLabel: {
    fontSize: Typography.xs - 1,
    color: Colors.accent,
    letterSpacing: Typography.trackingWidest,
  },
  ordersTitle: {
    fontSize: Typography.lg,
    fontFamily: Typography.fontSerif,
    color: Colors.primary,
  },
  refreshText: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
  ordersError: {
    fontSize: Typography.sm,
    color: Colors.error,
    lineHeight: Typography.sm * 1.4,
  },
  ordersEmpty: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    lineHeight: Typography.sm * 1.5,
  },
  orderRow: {
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 4,
  },
  orderRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  orderCode: {
    flex: 1,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  orderTotal: {
    fontSize: Typography.base,
    color: Colors.primary,
  },
  orderRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusBadgeDelivered: {
    backgroundColor: Colors.success,
  },
  statusBadgeCancelled: {
    backgroundColor: Colors.error,
  },
  statusBadgeText: {
    fontSize: Typography.xs - 1,
    color: Colors.white,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  orderRowMeta: {
    gap: 2,
  },
  orderMetaText: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  ordersToggle: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  ordersToggleText: {
    fontSize: Typography.sm,
    color: Colors.accent,
  },
  ordersToggleIcon: {
    fontSize: Typography.sm,
    color: Colors.accent,
    fontWeight: '700',
  },
  guestCard: {
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  guestTitle: {
    fontSize: Typography.lg,
    fontFamily: Typography.fontSerif,
    color: Colors.textInverse,
  },
  guestSub: {
    fontSize: Typography.sm,
    color: Colors.surfaceAlt,
    lineHeight: Typography.sm * 1.5,
  },
  signInBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.accent,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
  },
  signInBtnText: {
    fontSize: Typography.xs,
    color: Colors.accent,
    letterSpacing: Typography.trackingWidest,
  },
  menu: {
    backgroundColor: Colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    fontSize: Typography.base,
    color: Colors.accent,
    width: 24,
    textAlign: 'center',
    fontWeight: '700',
  },
  menuContent: {
    flex: 1,
    gap: 2,
  },
  menuLabel: {
    fontSize: Typography.base,
    color: Colors.textPrimary,
    fontFamily: Typography.fontSans,
  },
  menuDesc: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  menuChevron: {
    fontSize: Typography.lg,
    color: Colors.textMuted,
  },
  appInfo: {
    alignItems: 'center',
    gap: 4,
    paddingTop: Spacing.md,
  },
  brandName: {
    fontSize: Typography.md,
    fontFamily: Typography.fontSerif,
    color: Colors.primary,
    letterSpacing: Typography.trackingWidest,
  },
  brandTagline: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  version: {
    fontSize: Typography.xs - 1,
    color: Colors.border,
    marginTop: Spacing.sm,
  },
});
