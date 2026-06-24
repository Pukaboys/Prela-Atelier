import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius } from '../constants/theme';

interface SkeletonProps {
  width?: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonBox({ width = '100%', height, borderRadius = Radius.sm, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width: width as any, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <View style={styles.card}>
      <SkeletonBox height={180} borderRadius={0} />
      <View style={styles.info}>
        <SkeletonBox height={10} width="50%" />
        <SkeletonBox height={14} width="80%" style={{ marginTop: 4 }} />
        <SkeletonBox height={12} width="35%" style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.border,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    marginBottom: 16,
  },
  info: {
    padding: 10,
    gap: 4,
  },
});
