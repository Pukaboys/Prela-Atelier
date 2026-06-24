import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Colors, Typography, Spacing } from '../constants/theme';
import { fetchProducts, fetchMaterials } from '../services/products';
import { useCurrencyStore } from '../store/currencyStore';
import type { ProductCardData, Material, RootStackParamList } from '../types';

import ProductCard from '../components/ProductCard';
import CurrencySelector from '../components/CurrencySelector';
import { ProductCardSkeleton } from '../components/LoadingSkeleton';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function CollectionsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { currency } = useCurrencyStore();

  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [prods, mats] = await Promise.all([
        fetchProducts({ materialSlug: selectedMaterial ?? undefined }),
        materials.length === 0 ? fetchMaterials() : Promise.resolve(materials),
      ]);
      setProducts(prods);
      if (materials.length === 0) setMaterials(mats);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedMaterial]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Collections</Text>
        <CurrencySelector />
      </View>

      {/* Material Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filters}
      >
        <TouchableOpacity
          style={[styles.chip, selectedMaterial === null && styles.chipActive]}
          onPress={() => setSelectedMaterial(null)}
        >
          <Text
            style={[styles.chipText, selectedMaterial === null && styles.chipTextActive]}
          >
            All
          </Text>
        </TouchableOpacity>
        {materials.map((m) => (
          <TouchableOpacity
            key={m.id}
            style={[styles.chip, selectedMaterial === m.slug && styles.chipActive]}
            onPress={() =>
              setSelectedMaterial(selectedMaterial === m.slug ? null : m.slug)
            }
          >
            <View
              style={[styles.chipDot, { backgroundColor: m.colorHex ?? Colors.border }]}
            />
            <Text
              style={[
                styles.chipText,
                selectedMaterial === m.slug && styles.chipTextActive,
              ]}
            >
              {m.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.grid}>
          {[0, 1, 2, 3, 4, 5].map((k) => (
            <View key={k} style={styles.gridItem}>
              <ProductCardSkeleton />
            </View>
          ))}
        </View>
      ) : products.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No pieces found</Text>
          <Text style={styles.emptySub}>Try selecting a different material</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          numColumns={2}
          keyExtractor={(item) => String(item.id)}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.accent}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <ProductCard
                product={item}
                currency={currency}
                onPress={() =>
                  navigation.navigate('ProductDetail', { slug: item.slug })
                }
              />
            </View>
          )}
          ListFooterComponent={<View style={{ height: Spacing.xl + insets.bottom }} />}
        />
      )}
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
    letterSpacing: 0.5,
  },
  filtersContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    flexGrow: 0,
    height: 58,
    maxHeight: 58,
  },
  filters: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm - 2,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    fontFamily: Typography.fontSans,
  },
  chipTextActive: {
    color: Colors.textInverse,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  gridItem: {
    flex: 1,
    minWidth: '45%',
    maxWidth: '50%',
  },
  row: {
    gap: Spacing.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    fontSize: Typography.lg,
    fontFamily: Typography.fontSerif,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptySub: {
    fontSize: Typography.base,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
