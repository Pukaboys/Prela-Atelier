import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../constants/theme';
import type { Material } from '../types';

interface Props {
  material: Material;
  selected?: boolean;
  onPress?: () => void;
  compact?: boolean;
}

export default function MaterialCard({ material, selected, onPress, compact }: Props) {
  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.compact, selected && styles.selected]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.colorSwatch, { backgroundColor: material.colorHex ?? Colors.border }]} />
      {!compact && material.imagePath && (
        <Image source={{ uri: material.imagePath }} style={styles.image} resizeMode="cover" />
      )}
      <View style={styles.info}>
        <Text style={styles.name}>{material.name}</Text>
        {!compact && material.origin && (
          <Text style={styles.origin}>{material.origin}</Text>
        )}
      </View>
      {selected && <Text style={styles.check}>✓</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    padding: Spacing.sm + 2,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    ...Shadow.sm,
  },
  compact: {
    paddingVertical: Spacing.sm,
  },
  selected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.surfaceAlt,
  },
  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  image: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: Typography.base,
    color: Colors.textPrimary,
    fontFamily: Typography.fontSerif,
  },
  origin: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  check: {
    fontSize: Typography.md,
    color: Colors.accent,
    fontWeight: '700',
  },
});
