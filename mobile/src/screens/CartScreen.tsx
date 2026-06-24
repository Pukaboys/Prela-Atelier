import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Colors, Typography, Spacing, Shadow } from '../constants/theme';
import { useCartStore } from '../store/cartStore';
import { useCurrencyStore } from '../store/currencyStore';
import { formatPrice } from '../utils/currency';
import type { RootStackParamList } from '../types';

import CartItemRow from '../components/CartItemRow';
import LuxuryButton from '../components/LuxuryButton';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { currency } = useCurrencyStore();
  const { items, appliedPromo, clearCart, subtotalEur, totalEur } =
    useCartStore();

  const subtotal = subtotalEur();
  const total = totalEur();
  const discountEur = subtotal - total;

  if (items.length === 0) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <Text style={styles.title}>Your Cart</Text>
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>*</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySub}>
            Discover our collection of fine marble pieces
          </Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Collections' })}
          >
            <Text style={styles.shopBtnText}>EXPLORE COLLECTION</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.title}>Your Cart</Text>
        <TouchableOpacity
          onPress={() =>
            Alert.alert('Clear Cart', 'Remove all items from your cart?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', style: 'destructive', onPress: clearCart },
            ])
          }
        >
          <Text style={styles.clearText}>Clear all</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {items.map((item) => (
          <CartItemRow key={item.cartItemId} item={item} currency={currency} />
        ))}

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatPrice(subtotal, currency)}</Text>
          </View>

          {appliedPromo && discountEur > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, styles.promoLabel]}>
                Promo ({appliedPromo.code})
              </Text>
              <Text style={[styles.summaryValue, styles.promoValue]}>
                -{formatPrice(discountEur, currency)}
              </Text>
            </View>
          )}

          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(total, currency)}</Text>
          </View>

          <Text style={styles.vatNote}>
            All prices include applicable taxes / Shipping calculated at checkout
          </Text>
        </View>

        <View style={{ height: 120 + insets.bottom }} />
      </ScrollView>

      <View
        style={[
          styles.checkoutBar,
          { paddingBottom: insets.bottom + Spacing.sm },
          Shadow.lg,
        ]}
      >
        <LuxuryButton
          label="PROCEED TO CHECKOUT"
          onPress={() => navigation.navigate('Checkout')}
        />
      </View>
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
  title: {
    fontSize: Typography.xl,
    fontFamily: Typography.fontSerif,
    color: Colors.primary,
  },
  clearText: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
  list: {
    paddingHorizontal: Spacing.md,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyIcon: {
    fontSize: 52,
    color: Colors.border,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.xl,
    fontFamily: Typography.fontSerif,
    color: Colors.textPrimary,
  },
  emptySub: {
    fontSize: Typography.base,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: Typography.base * 1.5,
  },
  shopBtn: {
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  shopBtnText: {
    fontSize: Typography.xs,
    color: Colors.primary,
    letterSpacing: Typography.trackingWidest,
  },
  summary: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  promoLabel: {
    color: Colors.success,
  },
  promoValue: {
    color: Colors.success,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.sm,
    marginTop: Spacing.sm,
  },
  totalLabel: {
    fontSize: Typography.md,
    fontFamily: Typography.fontSerif,
    color: Colors.primary,
  },
  totalValue: {
    fontSize: Typography.md,
    color: Colors.accent,
    fontWeight: '600',
  },
  vatNote: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    lineHeight: Typography.xs * 1.5,
  },
  checkoutBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
});
