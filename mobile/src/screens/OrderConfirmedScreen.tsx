import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Colors, Typography, Spacing } from '../constants/theme';
import { formatPrice } from '../utils/currency';
import type { RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'OrderConfirmed'>;

export default function OrderConfirmedScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { orderCode, total, currency } = route.params;

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.content}>
        <Animated.View style={[styles.checkCircle, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.checkMark}>OK</Text>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, alignItems: 'center', gap: Spacing.sm }}>
          <Text style={styles.eyebrow}>ORDER CONFIRMED</Text>
          <Text style={styles.heading}>Thank You</Text>
          <Text style={styles.sub}>
            Your order has been received and will be confirmed shortly.
            Please check your email for payment instructions.
          </Text>

          <View style={styles.orderBox}>
            <Text style={styles.orderLabel}>Order Reference</Text>
            <Text style={styles.orderCode}>{orderCode}</Text>
            <Text style={styles.orderTotal}>{formatPrice(total, currency)}</Text>
          </View>

          <Text style={styles.note}>
            A confirmation email has been sent with your invoice and bank transfer details.
          </Text>
        </Animated.View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.trackBtn}
          onPress={() => navigation.navigate('OrderTracking')}
        >
          <Text style={styles.trackBtnText}>TRACK YOUR ORDER</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
        >
          <Text style={styles.homeBtnText}>Return to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  checkMark: {
    fontSize: Typography.lg,
    color: Colors.accent,
    fontFamily: Typography.fontSans,
    fontWeight: '700',
    letterSpacing: Typography.trackingWide,
  },
  eyebrow: {
    fontSize: Typography.xs,
    color: Colors.accent,
    letterSpacing: Typography.trackingWidest * 1.5,
    textAlign: 'center',
  },
  heading: {
    fontSize: Typography['3xl'],
    fontFamily: Typography.fontSerif,
    color: Colors.primary,
    textAlign: 'center',
  },
  sub: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.base * 1.7,
    maxWidth: 320,
  },
  orderBox: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginTop: Spacing.md,
    width: '100%',
  },
  orderLabel: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    letterSpacing: Typography.trackingWidest,
    textTransform: 'uppercase',
  },
  orderCode: {
    fontSize: Typography.xl,
    fontFamily: Typography.fontSerif,
    color: Colors.primary,
    letterSpacing: 2,
  },
  orderTotal: {
    fontSize: Typography.md,
    color: Colors.accent,
    fontWeight: '500',
  },
  note: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: Typography.sm * 1.6,
    marginTop: Spacing.sm,
    maxWidth: 280,
  },
  actions: {
    padding: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  trackBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  trackBtnText: {
    fontSize: Typography.sm,
    color: Colors.textInverse,
    letterSpacing: Typography.trackingWidest,
  },
  homeBtn: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  homeBtnText: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
});
