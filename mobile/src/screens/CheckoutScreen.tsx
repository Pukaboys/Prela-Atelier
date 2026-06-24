import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Colors, Typography, Spacing, Radius } from '../constants/theme';
import { submitCheckout } from '../services/orders';
import { validatePromoCode } from '../services/promo';
import { useCartStore } from '../store/cartStore';
import { useCurrencyStore } from '../store/currencyStore';
import { formatPrice } from '../utils/currency';
import type { CheckoutFormData, RootStackParamList } from '../types';

import LuxuryButton from '../components/LuxuryButton';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const INITIAL_FORM: CheckoutFormData = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  postcode: '',
  country: '',
  notes: '',
};

function LuxuryInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  multiline,
  required,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  autoCapitalize?: any;
  multiline?: boolean;
  required?: boolean;
}) {
  return (
    <View style={inputStyles.field}>
      <Text style={inputStyles.label}>
        {label}
        {required && <Text style={inputStyles.required}> *</Text>}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={autoCapitalize ?? 'words'}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        style={[inputStyles.input, multiline && inputStyles.inputMulti]}
      />
    </View>
  );
}

const inputStyles = StyleSheet.create({
  field: { gap: 5, marginBottom: Spacing.md },
  label: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    letterSpacing: Typography.trackingWidest,
    textTransform: 'uppercase',
    fontFamily: Typography.fontSans,
  },
  required: { color: Colors.accent },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    fontFamily: Typography.fontSans,
  },
  inputMulti: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: Spacing.sm + 2,
  },
});

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { currency } = useCurrencyStore();
  const { items, appliedPromo, setPromo, clearCart, subtotalEur, totalEur } =
    useCartStore();

  const [form, setForm] = useState<CheckoutFormData>(INITIAL_FORM);
  const [promoInput, setPromoInput] = useState('');
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof CheckoutFormData) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const subtotal = subtotalEur();
  const total = totalEur();
  const discount = subtotal - total;

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setValidatingPromo(true);
    try {
      const result = await validatePromoCode({
        code: promoInput.trim().toUpperCase(),
        subtotal,
        currency,
      });
      if (result.valid && result.code) {
        setPromo({
          code: result.code,
          type: result.type!,
          value: result.value!,
          discount: result.discount!,
        });
        setPromoInput('');
      } else {
        Alert.alert('Invalid Code', result.error ?? 'This promo code is not valid.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleSubmit = async () => {
    const { name, email, address, city, postcode, country } = form;
    if (!name || !email || !address || !city || !postcode || !country) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }
    if (!email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitCheckout({
        ...form,
        items,
        currency,
        promoCode: appliedPromo?.code,
      });
      clearCart();
      navigation.replace('OrderConfirmed', {
        orderCode: result.orderCode,
        total: result.total,
        currency: result.currency,
      });
    } catch (err: any) {
      Alert.alert('Order Failed', err.message ?? 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" />
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Checkout</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Contact</Text>
        <LuxuryInput label="Full Name" value={form.name} onChangeText={set('name')} required />
        <LuxuryInput
          label="Email"
          value={form.email}
          onChangeText={set('email')}
          keyboardType="email-address"
          autoCapitalize="none"
          required
        />
        <LuxuryInput
          label="Phone"
          value={form.phone ?? ''}
          onChangeText={set('phone')}
          keyboardType="phone-pad"
        />

        <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>Shipping Address</Text>
        <LuxuryInput label="Street Address" value={form.address} onChangeText={set('address')} required />
        <LuxuryInput label="City" value={form.city} onChangeText={set('city')} required />
        <LuxuryInput label="Postcode / ZIP" value={form.postcode} onChangeText={set('postcode')} required />
        <LuxuryInput label="Country" value={form.country} onChangeText={set('country')} required />
        <LuxuryInput
          label="Order Notes"
          value={form.notes ?? ''}
          onChangeText={set('notes')}
          placeholder="Any special instructions..."
          multiline
        />

        <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>Promo Code</Text>
        {appliedPromo ? (
          <View style={styles.promoApplied}>
            <Text style={styles.promoAppliedText}>
              Applied {appliedPromo.code} - saving {formatPrice(discount, currency)}
            </Text>
            <TouchableOpacity onPress={() => setPromo(null)}>
              <Text style={styles.promoRemove}>Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.promoRow}>
            <TextInput
              style={styles.promoInput}
              value={promoInput}
              onChangeText={(v) => setPromoInput(v.toUpperCase())}
              placeholder="Enter code"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={styles.promoApplyBtn}
              onPress={handleApplyPromo}
              disabled={validatingPromo}
            >
              <Text style={styles.promoApplyText}>
                {validatingPromo ? '...' : 'APPLY'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          {items.map((item) => (
            <View key={item.cartItemId} style={styles.summaryItem}>
              <View style={styles.summaryItemInfo}>
                <Text style={styles.summaryItemName} numberOfLines={1}>
                  {item.name} x {item.quantity}
                </Text>
                {item.materialName ? (
                  <Text style={styles.summaryItemMeta} numberOfLines={1}>
                    {item.materialName}
                  </Text>
                ) : null}
              </View>
              <Text style={styles.summaryItemPrice}>
                {formatPrice(item.price * item.quantity, currency)}
              </Text>
            </View>
          ))}
          {discount > 0 && (
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryItemName, { color: Colors.success }]}>Discount</Text>
              <Text style={[styles.summaryItemPrice, { color: Colors.success }]}>
                -{formatPrice(discount, currency)}
              </Text>
            </View>
          )}
          <View style={styles.summaryTotal}>
            <Text style={styles.summaryTotalLabel}>Total</Text>
            <Text style={styles.summaryTotalValue}>{formatPrice(total, currency)}</Text>
          </View>
        </View>

        <LuxuryButton
          label="PLACE ORDER"
          onPress={handleSubmit}
          loading={submitting}
          style={{ marginTop: Spacing.lg }}
        />

        <Text style={styles.terms}>
          By placing your order you agree to our Terms & Conditions. Payment
          instructions will be sent via email.
        </Text>

        <View style={{ height: insets.bottom + Spacing.xl }} />
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
    backgroundColor: Colors.background,
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
  sectionTitle: {
    fontSize: Typography.md,
    fontFamily: Typography.fontSerif,
    color: Colors.primary,
    marginBottom: Spacing.md,
    letterSpacing: 0.3,
  },
  promoRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  promoInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  promoApplyBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
  },
  promoApplyText: {
    fontSize: Typography.xs,
    color: Colors.textInverse,
    letterSpacing: Typography.trackingWidest,
  },
  promoApplied: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: Spacing.sm + 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.success,
    marginBottom: Spacing.md,
  },
  promoAppliedText: {
    fontSize: Typography.base,
    color: Colors.success,
  },
  promoRemove: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
  summary: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  summaryTitle: {
    fontSize: Typography.base,
    fontFamily: Typography.fontSerif,
    color: Colors.primary,
    marginBottom: 4,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItemInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  summaryItemName: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  summaryItemMeta: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    letterSpacing: Typography.trackingWide,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  summaryItemPrice: {
    fontSize: Typography.sm,
    color: Colors.textPrimary,
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.sm,
    marginTop: 4,
  },
  summaryTotalLabel: {
    fontSize: Typography.md,
    fontFamily: Typography.fontSerif,
    color: Colors.primary,
  },
  summaryTotalValue: {
    fontSize: Typography.md,
    color: Colors.accent,
    fontWeight: '600',
  },
  terms: {
    marginTop: Spacing.md,
    fontSize: Typography.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: Typography.xs * 1.6,
  },
});
