import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Typography, Spacing, Radius, Shadow } from '../constants/theme';
import { fetchMaterials } from '../services/products';
import { calculateCustomOrder, submitBespokeEnquiry } from '../services/customOrder';
import { useCurrencyStore } from '../store/currencyStore';
import { formatPrice } from '../utils/currency';
import type { Material, CustomOrderQuote } from '../types';

import MaterialCard from '../components/MaterialCard';
import LuxuryButton from '../components/LuxuryButton';

type Step = 1 | 2 | 3 | 4;

export default function CustomOrderScreen() {
  const insets = useSafeAreaInsets();
  const { currency } = useCurrencyStore();

  const [step, setStep] = useState<Step>(1);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [quote, setQuote] = useState<CustomOrderQuote | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Contact form for step 4
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchMaterials().then(setMaterials).catch(() => {});
  }, []);

  const animateStep = (fn: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      fn();
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    });
  };

  const goNext = () => animateStep(() => setStep((s) => (s < 4 ? ((s + 1) as Step) : s)));
  const goBack = () => animateStep(() => setStep((s) => (s > 1 ? ((s - 1) as Step) : s)));

  const handleCalculate = async () => {
    const w = parseFloat(width);
    const h = parseFloat(height);

    if (!w || !h || w <= 0 || h <= 0) {
      Alert.alert('Invalid Dimensions', 'Please enter valid width and height values.');
      return;
    }
    if (!selectedMaterial) {
      Alert.alert('Select Material', 'Please select a material before calculating.');
      return;
    }

    setCalculating(true);
    try {
      const result = await calculateCustomOrder({
        widthCm: w,
        heightCm: h,
        materialId: selectedMaterial.id,
        currency,
      });
      setQuote(result);
      goNext();
    } catch (err: any) {
      Alert.alert('Calculation Error', err.message ?? 'Could not calculate estimate');
    } finally {
      setCalculating(false);
    }
  };

  const handleSubmit = async () => {
    if (!name || !email) {
      Alert.alert('Required', 'Please enter your name and email.');
      return;
    }
    if (!email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email.');
      return;
    }

    setSubmitting(true);
    try {
      await submitBespokeEnquiry({
        name,
        email,
        phone: phone || undefined,
        widthCm: parseFloat(width),
        heightCm: parseFloat(height),
        materialId: selectedMaterial!.id,
        notes: notes || undefined,
        currency,
        estimatedPrice: quote?.estimatedPrice,
      });
      Alert.alert(
        'Enquiry Submitted',
        'Thank you! Our team will be in touch within 1–2 business days.',
        [{ text: 'Done', onPress: () => setStep(1) }]
      );
      setName(''); setEmail(''); setPhone(''); setNotes('');
      setWidth(''); setHeight(''); setSelectedMaterial(null); setQuote(null);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not submit enquiry');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { num: 1, label: 'Dimensions' },
    { num: 2, label: 'Material' },
    { num: 3, label: 'Estimate' },
    { num: 4, label: 'Enquire' },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" />
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Text style={styles.headerSuper}>BESPOKE MARBLE</Text>
        <Text style={styles.title}>Custom Order</Text>
      </View>

      {/* Step Indicator */}
      <View style={styles.stepper}>
        {steps.map((s, i) => (
          <React.Fragment key={s.num}>
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepDot,
                  step === s.num && styles.stepDotActive,
                  step > s.num && styles.stepDotDone,
                ]}
              >
                {step > s.num ? (
                  <Text style={styles.stepDotCheckmark}>✓</Text>
                ) : (
                  <Text
                    style={[
                      styles.stepDotNum,
                      step === s.num && styles.stepDotNumActive,
                    ]}
                  >
                    {s.num}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  step === s.num && styles.stepLabelActive,
                ]}
              >
                {s.label}
              </Text>
            </View>
            {i < steps.length - 1 && (
              <View
                style={[
                  styles.stepLine,
                  step > s.num && styles.stepLineActive,
                ]}
              />
            )}
          </React.Fragment>
        ))}
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step 1: Dimensions */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepHeading}>Enter Dimensions</Text>
            <Text style={styles.stepDescription}>
              Specify the desired width and height of your bespoke piece in centimetres.
            </Text>

            <View style={styles.dimRow}>
              <View style={styles.dimField}>
                <Text style={styles.dimLabel}>WIDTH (cm)</Text>
                <TextInput
                  style={styles.dimInput}
                  value={width}
                  onChangeText={setWidth}
                  keyboardType="decimal-pad"
                  placeholder="e.g. 60"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
              <View style={styles.dimDivider} />
              <View style={styles.dimField}>
                <Text style={styles.dimLabel}>HEIGHT (cm)</Text>
                <TextInput
                  style={styles.dimInput}
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="decimal-pad"
                  placeholder="e.g. 30"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>

            {width && height && (
              <View style={styles.dimPreview}>
                <Text style={styles.dimPreviewLabel}>AREA</Text>
                <Text style={styles.dimPreviewValue}>
                  {(parseFloat(width) * parseFloat(height) / 10000).toFixed(4)} m²
                </Text>
              </View>
            )}

            <LuxuryButton
              label="NEXT: SELECT MATERIAL"
              onPress={() => {
                if (!parseFloat(width) || !parseFloat(height)) {
                  Alert.alert('Required', 'Please enter both dimensions.');
                  return;
                }
                goNext();
              }}
              style={{ marginTop: Spacing.lg }}
            />
          </View>
        )}

        {/* Step 2: Material */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepHeading}>Select Material</Text>
            <Text style={styles.stepDescription}>
              Choose from our curated selection of premium natural stones.
            </Text>

            <View style={styles.materialsList}>
              {materials.map((m) => (
                <MaterialCard
                  key={m.id}
                  material={m}
                  selected={selectedMaterial?.id === m.id}
                  onPress={() => setSelectedMaterial(m)}
                />
              ))}
            </View>

            <View style={styles.navRow}>
              <LuxuryButton
                label="BACK"
                variant="secondary"
                onPress={goBack}
                fullWidth={false}
                style={{ flex: 1 }}
              />
              <LuxuryButton
                label="CALCULATE"
                onPress={handleCalculate}
                loading={calculating}
                fullWidth={false}
                disabled={!selectedMaterial}
                style={{ flex: 2 }}
              />
            </View>
          </View>
        )}

        {/* Step 3: Estimate */}
        {step === 3 && quote && (
          <View style={styles.stepContent}>
            <Text style={styles.stepHeading}>Your Estimate</Text>
            <Text style={styles.stepDescription}>
              Based on your specifications, here is an indicative price for your bespoke piece.
            </Text>

            <View style={styles.quoteCard}>
              <Text style={styles.quoteLabel}>ESTIMATED PRICE</Text>
              <Text style={styles.quotePrice}>
                {formatPrice(quote.estimatedPrice, currency)}
              </Text>
              <Text style={styles.quoteNote}>
                This is an indicative estimate. Final pricing may vary based on
                complexity and finishing requirements.
              </Text>

              <View style={styles.quoteDivider} />

              <View style={styles.quoteSpecs}>
                <View style={styles.quoteSpecRow}>
                  <Text style={styles.quoteSpecLabel}>Dimensions</Text>
                  <Text style={styles.quoteSpecValue}>
                    {quote.widthCm} × {quote.heightCm} cm
                  </Text>
                </View>
                <View style={styles.quoteSpecRow}>
                  <Text style={styles.quoteSpecLabel}>Material</Text>
                  <Text style={styles.quoteSpecValue}>{quote.materialName}</Text>
                </View>
                {quote.leadTimeWeeks && (
                  <View style={styles.quoteSpecRow}>
                    <Text style={styles.quoteSpecLabel}>Lead Time</Text>
                    <Text style={styles.quoteSpecValue}>{quote.leadTimeWeeks} weeks</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.navRow}>
              <LuxuryButton
                label="BACK"
                variant="secondary"
                onPress={goBack}
                fullWidth={false}
                style={{ flex: 1 }}
              />
              <LuxuryButton
                label="ENQUIRE NOW"
                onPress={goNext}
                fullWidth={false}
                style={{ flex: 2 }}
              />
            </View>
          </View>
        )}

        {/* Step 4: Contact */}
        {step === 4 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepHeading}>Submit Enquiry</Text>
            <Text style={styles.stepDescription}>
              Our team will review your specifications and be in touch within 1–2 business days.
            </Text>

            {[
              { label: 'Full Name *', value: name, set: setName, kb: 'default' as any },
              { label: 'Email Address *', value: email, set: setEmail, kb: 'email-address' as any },
              { label: 'Phone (optional)', value: phone, set: setPhone, kb: 'phone-pad' as any },
            ].map((f) => (
              <View key={f.label} style={styles.field}>
                <Text style={styles.fieldLabel}>{f.label.toUpperCase()}</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={f.value}
                  onChangeText={f.set}
                  keyboardType={f.kb}
                  autoCapitalize={f.kb === 'email-address' || f.kb === 'phone-pad' ? 'none' : 'words'}
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            ))}

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>ADDITIONAL NOTES</Text>
              <TextInput
                style={[styles.fieldInput, styles.fieldInputMulti]}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                placeholder="Describe your vision, finishing preferences, installation requirements..."
                placeholderTextColor={Colors.textMuted}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.navRow}>
              <LuxuryButton
                label="BACK"
                variant="secondary"
                onPress={goBack}
                fullWidth={false}
                style={{ flex: 1 }}
              />
              <LuxuryButton
                label="SUBMIT ENQUIRY"
                onPress={handleSubmit}
                loading={submitting}
                fullWidth={false}
                style={{ flex: 2 }}
              />
            </View>
          </View>
        )}

        <View style={{ height: insets.bottom + Spacing.xl }} />
      </Animated.ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
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

  // Stepper
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent,
  },
  stepDotDone: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  stepDotNum: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  stepDotNumActive: {
    color: Colors.white,
  },
  stepDotCheckmark: {
    fontSize: 11,
    color: Colors.white,
    fontWeight: '700',
  },
  stepLabel: {
    fontSize: 8,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  stepLabelActive: {
    color: Colors.accent,
  },
  stepLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 16,
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: Colors.primary,
  },

  // Content
  content: {
    padding: Spacing.md,
    paddingTop: Spacing.lg,
  },
  stepContent: {
    gap: Spacing.md,
  },
  stepHeading: {
    fontSize: Typography.xl,
    fontFamily: Typography.fontSerif,
    color: Colors.primary,
  },
  stepDescription: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    lineHeight: Typography.base * 1.6,
  },

  // Dimensions
  dimRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
  },
  dimField: {
    flex: 1,
    gap: 5,
  },
  dimDivider: {
    width: 1,
    height: 48,
    backgroundColor: Colors.border,
  },
  dimLabel: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    letterSpacing: Typography.trackingWidest,
  },
  dimInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: Typography.xl,
    color: Colors.primary,
    fontFamily: Typography.fontSerif,
    textAlign: 'center',
  },
  dimPreview: {
    backgroundColor: Colors.surfaceAlt,
    padding: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dimPreviewLabel: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    letterSpacing: Typography.trackingWidest,
  },
  dimPreviewValue: {
    fontSize: Typography.base,
    color: Colors.primary,
    fontFamily: Typography.fontSans,
  },

  // Materials
  materialsList: {
    gap: Spacing.sm,
  },

  // Quote
  quoteCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.sm,
    ...Shadow.md,
  },
  quoteLabel: {
    fontSize: Typography.xs,
    color: Colors.accent,
    letterSpacing: Typography.trackingWidest,
  },
  quotePrice: {
    fontSize: Typography['3xl'],
    fontFamily: Typography.fontSerif,
    color: Colors.primary,
  },
  quoteNote: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    lineHeight: Typography.xs * 1.6,
    fontStyle: 'italic',
  },
  quoteDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.sm,
  },
  quoteSpecs: {
    gap: Spacing.sm,
  },
  quoteSpecRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quoteSpecLabel: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
  },
  quoteSpecValue: {
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    fontWeight: '500',
  },

  // Contact form
  field: {
    gap: 5,
  },
  fieldLabel: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    letterSpacing: Typography.trackingWidest,
  },
  fieldInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  fieldInputMulti: {
    height: 80,
    paddingTop: Spacing.sm + 2,
  },

  // Navigation
  navRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
});
