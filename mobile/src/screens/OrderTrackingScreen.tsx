import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { Colors, Typography, Spacing, Radius } from '../constants/theme';
import { trackOrder } from '../services/orders';
import { formatDate, formatOrderStatus } from '../utils/formatting';
import { useCurrencyStore } from '../store/currencyStore';
import { useUserStore } from '../store/userStore';
import { formatPrice } from '../utils/currency';
import type { OrderTrackResult, RootStackParamList } from '../types';

import OrderTimeline from '../components/OrderTimeline';
import LuxuryButton from '../components/LuxuryButton';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type TrackingRoute = RouteProp<RootStackParamList, 'OrderTracking'>;

export default function OrderTrackingScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<TrackingRoute>();
  const { currency } = useCurrencyStore();
  const { email: signedInEmail, isAuthenticated } = useUserStore();
  const initialOrderCode = route.params?.orderCode ?? '';
  const initialEmail = route.params?.email ?? signedInEmail ?? '';

  const [orderCode, setOrderCode] = useState(initialOrderCode);
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OrderTrackResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasAutoTrackParams = Boolean(initialOrderCode && initialEmail);

  const loadOrder = async (code: string, customerEmail: string) => {
    if (!code.trim() || !customerEmail.trim()) {
      setError('Please enter both your order code and email address.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await trackOrder(code.trim().toUpperCase(), customerEmail.trim().toLowerCase());
      setResult(data);
    } catch (err: any) {
      setError(err.message ?? 'Order not found. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async () => {
    await loadOrder(orderCode, email);
  };

  useEffect(() => {
    if (hasAutoTrackParams) {
      void loadOrder(initialOrderCode, initialEmail);
    }
  }, [hasAutoTrackParams, initialOrderCode, initialEmail]);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" />
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Track Order</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!result ? (
          <>
            <Text style={styles.intro}>
              {hasAutoTrackParams
                ? 'Loading your order status.'
                : isAuthenticated()
                  ? 'Choose an order from your profile, or enter an order reference to track another order.'
                  : 'Enter your order reference and the email address used at checkout.'}
            </Text>

            {!hasAutoTrackParams && (
              <>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>ORDER REFERENCE</Text>
                  <TextInput
                    style={styles.input}
                    value={orderCode}
                    onChangeText={(v) => setOrderCode(v.toUpperCase())}
                    placeholder="e.g. PA-2024-001"
                    placeholderTextColor={Colors.textMuted}
                    autoCapitalize="characters"
                  />
                </View>

                {!isAuthenticated() && (
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="your@email.com"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                )}
              </>
            )}

            {error && <Text style={styles.errorText}>{error}</Text>}

            {!hasAutoTrackParams && (
              <LuxuryButton
                label="TRACK ORDER"
                onPress={handleTrack}
                loading={loading}
                style={{ marginTop: Spacing.sm }}
              />
            )}
          </>
        ) : (
          <>
            {!hasAutoTrackParams && (
            <TouchableOpacity
              style={styles.newSearchBtn}
              onPress={() => { setResult(null); setOrderCode(''); setEmail(signedInEmail ?? ''); }}
            >
              <Text style={styles.newSearchText}>← Search again</Text>
            </TouchableOpacity>
            )}

            {/* Order header */}
            <View style={styles.orderHeader}>
              <Text style={styles.orderCodeDisplay}>{result.orderCode}</Text>
              <View style={[styles.statusBadge, result.status === 'cancelled' && styles.statusBadgeCancelled]}>
                <Text style={styles.statusBadgeText}>
                  {formatOrderStatus(result.status)}
                </Text>
              </View>
            </View>

            <View style={styles.orderMeta}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>PLACED</Text>
                <Text style={styles.metaValue}>{formatDate(result.createdAt)}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>TOTAL</Text>
                <Text style={styles.metaValue}>{formatPrice(result.total, result.currency)}</Text>
              </View>
            </View>

            {/* Timeline */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>STATUS TIMELINE</Text>
              <OrderTimeline
                currentStatus={result.status}
                history={result.statusHistory}
              />
            </View>

            {/* Items */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>ITEMS</Text>
              {result.items.map((item, i) => (
                <View key={i} style={styles.orderItem}>
                  <Text style={styles.orderItemName}>
                    {item.name} × {item.quantity}
                  </Text>
                  <Text style={styles.orderItemPrice}>
                    {formatPrice(item.price, result.currency)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Shipping */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>SHIPPING TO</Text>
              <Text style={styles.shippingAddress}>{result.shippingAddress}</Text>
            </View>

            <View style={{ height: insets.bottom + Spacing.xl }} />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  back: {
    fontSize: Typography.xl,
    color: Colors.primary,
    width: 28,
  },
  title: {
    fontSize: Typography.xl,
    fontFamily: Typography.fontSerif,
    color: Colors.primary,
  },
  content: {
    padding: Spacing.md,
    paddingTop: Spacing.lg,
  },
  intro: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    lineHeight: Typography.base * 1.6,
    marginBottom: Spacing.lg,
  },
  field: {
    gap: 5,
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    letterSpacing: Typography.trackingWidest,
    fontFamily: Typography.fontSans,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.sm,
    marginBottom: Spacing.sm,
    lineHeight: Typography.sm * 1.5,
  },

  // Result
  newSearchBtn: {
    marginBottom: Spacing.md,
  },
  newSearchText: {
    fontSize: Typography.sm,
    color: Colors.accent,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  orderCodeDisplay: {
    fontSize: Typography.lg,
    fontFamily: Typography.fontSerif,
    color: Colors.primary,
    letterSpacing: 1,
  },
  statusBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  statusBadgeCancelled: {
    backgroundColor: Colors.error,
  },
  statusBadgeText: {
    fontSize: Typography.xs - 1,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  orderMeta: {
    flexDirection: 'row',
    gap: Spacing.xl,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.md,
  },
  metaItem: { gap: 3 },
  metaLabel: {
    fontSize: Typography.xs - 1,
    color: Colors.textMuted,
    letterSpacing: Typography.trackingWidest,
  },
  metaValue: {
    fontSize: Typography.base,
    color: Colors.textPrimary,
    fontFamily: Typography.fontSans,
  },
  section: {
    marginBottom: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  sectionLabel: {
    fontSize: Typography.xs - 1,
    color: Colors.accent,
    letterSpacing: Typography.trackingWidest,
    marginBottom: Spacing.sm,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  orderItemName: {
    flex: 1,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginRight: Spacing.sm,
  },
  orderItemPrice: {
    fontSize: Typography.sm,
    color: Colors.textPrimary,
  },
  shippingAddress: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    lineHeight: Typography.base * 1.5,
  },
});
