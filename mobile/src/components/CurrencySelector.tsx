import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../constants/theme';
import { useCurrencyStore } from '../store/currencyStore';
import { CURRENCY_OPTIONS } from '../utils/currency';

export default function CurrencySelector() {
  const [open, setOpen] = useState(false);
  const { currency, setCurrency } = useCurrencyStore();
  const selected = CURRENCY_OPTIONS.find((option) => option.value === currency)!;

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.flag}>{selected.flag}</Text>
        <Text style={styles.code}>{selected.value}</Text>
        <Text style={styles.chevron}>{'\u25be'}</Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Select Currency</Text>
            {CURRENCY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.option,
                  option.value === currency && styles.optionActive,
                ]}
                onPress={() => {
                  setCurrency(option.value);
                  setOpen(false);
                }}
              >
                <Text style={styles.optionFlag}>{option.flag}</Text>
                <Text style={styles.optionLabel}>{option.label}</Text>
                <Text style={styles.optionCode}>{option.value}</Text>
                {option.value === currency && (
                  <Text style={styles.check}>{'\u2713'}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceAlt,
  },
  flag: {
    fontSize: 14,
  },
  code: {
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    fontFamily: Typography.fontSans,
    letterSpacing: 0.5,
  },
  chevron: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: Spacing.lg,
    ...Shadow.lg,
  },
  sheetTitle: {
    fontSize: Typography.md,
    fontFamily: Typography.fontSerif,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    letterSpacing: 0.5,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  optionActive: {
    backgroundColor: Colors.surfaceAlt,
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: 0,
  },
  optionFlag: {
    fontSize: 20,
    width: 28,
  },
  optionLabel: {
    flex: 1,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    fontFamily: Typography.fontSans,
  },
  optionCode: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  check: {
    fontSize: Typography.base,
    color: Colors.accent,
    fontWeight: '700',
    marginLeft: Spacing.sm,
  },
});
