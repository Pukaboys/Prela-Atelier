import React, { useEffect, useMemo, useState } from 'react';
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
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Colors, Typography, Spacing, Shadow } from '../constants/theme';
import { fetchProductBySlug, trackProductView } from '../services/products';
import { useCurrencyStore } from '../store/currencyStore';
import { useCartStore } from '../store/cartStore';
import { buildCartItemId } from '../utils/cart';
import { formatPrice } from '../utils/currency';
import type { ProductDetail, RootStackParamList } from '../types';

import ImageGallery from '../components/ImageGallery';
import LuxuryButton from '../components/LuxuryButton';
import { SkeletonBox } from '../components/LoadingSkeleton';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'ProductDetail'>;

export default function ProductDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { currency } = useCurrencyStore();
  const addItem = useCartStore((state) => state.addItem);

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchProductBySlug(route.params.slug)
      .then((nextProduct) => {
        if (!cancelled) {
          setProduct(nextProduct);
          setSelectedMaterialId(
            nextProduct.defaultVariation?.materialId ?? nextProduct.variations?.[0]?.materialId ?? null,
          );
          trackProductView(nextProduct.id);
        }
      })
      .catch(() => {
        if (!cancelled) Alert.alert('Error', 'Could not load product');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [route.params.slug]);

  const selectedVariation = useMemo(
    () => product?.variations?.find((variation) => variation.materialId === selectedMaterialId)
      ?? product?.defaultVariation
      ?? null,
    [product, selectedMaterialId],
  );

  const currentMaterial = selectedVariation?.material ?? product?.material ?? null;
  const currentImages = selectedVariation?.images?.length ? selectedVariation.images : (product?.images ?? []);
  const currentImagePath = currentImages[0]?.path ?? product?.imagePath ?? null;
  const currentPriceEur = selectedVariation?.priceEur ?? product?.priceEur ?? 0;

  const handleAddToCart = () => {
    if (!product) return;
    if (product.stock === 0) {
      Alert.alert('Out of Stock', 'This piece is currently unavailable.');
      return;
    }

    setAddingToCart(true);

    addItem({
      cartItemId: buildCartItemId(product.id, selectedVariation?.materialId ?? product.materialId ?? null),
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: currentPriceEur,
      quantity: 1,
      imagePath: currentImagePath,
      materialId: selectedVariation?.materialId ?? product.materialId ?? null,
      materialName: selectedVariation?.materialName ?? currentMaterial?.name ?? null,
    });

    setTimeout(() => {
      setAddingToCart(false);
      Alert.alert('Added to Cart', `${product.name} has been added to your cart.`, [
        { text: 'Continue', style: 'cancel' },
        {
          text: 'View Cart',
          onPress: () => navigation.navigate('MainTabs', { screen: 'Cart' }),
        },
      ]);
    }, 300);
  };

  if (loading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <SkeletonBox height={400} borderRadius={0} />
        <View style={{ padding: Spacing.md, gap: Spacing.sm }}>
          <SkeletonBox height={14} width="40%" />
          <SkeletonBox height={28} width="75%" />
          <SkeletonBox height={20} width="30%" />
          <SkeletonBox height={80} />
        </View>
      </View>
    );
  }

  if (!product) return null;

  const displayPrice = formatPrice(currentPriceEur, currency);
  const inStock = product.stock > 0;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + Spacing.sm }]}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backText}>{'<'}</Text>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        <ImageGallery
          key={selectedVariation?.materialId ?? 'base'}
          images={currentImages}
          mainImagePath={currentImagePath}
        />

        <View style={styles.content}>
          {currentMaterial ? (
            <View style={styles.materialRow}>
              <View
                style={[
                  styles.materialDot,
                  { backgroundColor: currentMaterial.colorHex ?? Colors.border },
                ]}
              />
              <Text style={styles.materialName}>{currentMaterial.name}</Text>
              {currentMaterial.origin ? (
                <Text style={styles.materialOrigin}>- {currentMaterial.origin}</Text>
              ) : null}
            </View>
          ) : null}

          {product.variations && product.variations.length > 1 ? (
            <View style={styles.variationSection}>
              <Text style={styles.sectionLabel}>SELECT MATERIAL</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {product.variations.map((variation) => (
                  <TouchableOpacity
                    key={variation.materialId}
                    style={[
                      styles.variationChip,
                      selectedVariation?.materialId === variation.materialId && styles.variationChipActive,
                    ]}
                    onPress={() => setSelectedMaterialId(variation.materialId)}
                  >
                    <Text
                      style={[
                        styles.variationChipText,
                        selectedVariation?.materialId === variation.materialId && styles.variationChipTextActive,
                      ]}
                    >
                      {variation.materialName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <Text style={styles.name}>{product.name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{displayPrice}</Text>
            {product.badge ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{product.badge}</Text>
              </View>
            ) : null}
          </View>

          {(product.widthCm || product.heightCm) ? (
            <View style={styles.dims}>
              <Text style={styles.dimsLabel}>DIMENSIONS</Text>
              <Text style={styles.dimsValue}>
                {[
                  product.widthCm && `W ${product.widthCm} cm`,
                  product.heightCm && `H ${product.heightCm} cm`,
                  product.weightKg && `${product.weightKg} kg`,
                ]
                  .filter(Boolean)
                  .join(' / ')}
              </Text>
            </View>
          ) : null}

          {product.description ? (
            <View style={styles.descriptionBox}>
              <Text style={styles.descriptionLabel}>ABOUT THIS PIECE</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          ) : null}

          {currentMaterial?.description ? (
            <View style={styles.descriptionBox}>
              <Text style={styles.descriptionLabel}>THE MATERIAL</Text>
              <Text style={styles.description}>{currentMaterial.description}</Text>
            </View>
          ) : null}

          {product.recommendedProducts && product.recommendedProducts.length > 0 ? (
            <View style={styles.recommended}>
              <Text style={styles.recommendedLabel}>YOU MAY ALSO LIKE</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recommendedScroll}>
                {product.recommendedProducts.map((recommendation) => (
                  <TouchableOpacity
                    key={recommendation.id}
                    style={styles.recommendedItem}
                    onPress={() => navigation.push('ProductDetail', { slug: recommendation.slug })}
                  >
                    <Text style={styles.recommendedName} numberOfLines={2}>{recommendation.name}</Text>
                    <Text style={styles.recommendedPrice}>{formatPrice(recommendation.priceEur, currency)}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <View style={{ height: Spacing.xl + insets.bottom + 80 }} />
        </View>
      </ScrollView>

      <View
        style={[
          styles.stickyBar,
          { paddingBottom: insets.bottom + Spacing.sm },
          Shadow.lg,
        ]}
      >
        {!inStock ? (
          <Text style={styles.outOfStockText}>Currently Out of Stock</Text>
        ) : null}
        <LuxuryButton
          label={inStock ? 'ADD TO CART' : 'NOTIFY ME'}
          onPress={handleAddToCart}
          loading={addingToCart}
          disabled={!inStock}
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
  backBtn: {
    position: 'absolute',
    left: Spacing.md,
    zIndex: 10,
    width: 40,
    height: 40,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },
  backText: {
    fontSize: Typography.xl,
    color: Colors.primary,
    lineHeight: 24,
  },
  content: {
    padding: Spacing.md,
    paddingTop: Spacing.lg,
  },
  materialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  materialDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  materialName: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontFamily: Typography.fontSans,
  },
  materialOrigin: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
  },
  variationSection: {
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  sectionLabel: {
    fontSize: Typography.xs - 1,
    color: Colors.accent,
    letterSpacing: Typography.trackingWidest,
  },
  variationChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  variationChipActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent,
  },
  variationChipText: {
    fontSize: Typography.xs,
    color: Colors.textPrimary,
    letterSpacing: Typography.trackingWide,
    textTransform: 'uppercase',
    fontFamily: Typography.fontSans,
  },
  variationChipTextActive: {
    color: Colors.textInverse,
  },
  name: {
    fontSize: Typography['2xl'],
    color: Colors.primary,
    fontFamily: Typography.fontSerif,
    lineHeight: Typography['2xl'] * 1.2,
    marginBottom: Spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  price: {
    fontSize: Typography.xl,
    color: Colors.accent,
    fontFamily: Typography.fontSans,
    fontWeight: '500',
  },
  badge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: Typography.xs - 1,
    color: Colors.textInverse,
    letterSpacing: Typography.trackingWidest,
  },
  dims: {
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.lg,
    gap: 4,
  },
  dimsLabel: {
    fontSize: Typography.xs - 1,
    color: Colors.accent,
    letterSpacing: Typography.trackingWidest,
  },
  dimsValue: {
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    fontFamily: Typography.fontSans,
  },
  descriptionBox: {
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  descriptionLabel: {
    fontSize: Typography.xs - 1,
    color: Colors.accent,
    letterSpacing: Typography.trackingWidest,
  },
  description: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    lineHeight: Typography.base * 1.7,
    fontFamily: Typography.fontSans,
  },
  recommended: {
    marginTop: Spacing.sm,
  },
  recommendedLabel: {
    fontSize: Typography.xs - 1,
    color: Colors.accent,
    letterSpacing: Typography.trackingWidest,
    marginBottom: Spacing.sm,
  },
  recommendedScroll: {
    marginHorizontal: -Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  recommendedItem: {
    width: 140,
    marginRight: Spacing.sm,
    backgroundColor: Colors.surface,
    padding: Spacing.sm,
    gap: 4,
  },
  recommendedName: {
    fontSize: Typography.xs,
    color: Colors.textPrimary,
    fontFamily: Typography.fontSerif,
    lineHeight: Typography.xs * 1.4,
  },
  recommendedPrice: {
    fontSize: Typography.xs,
    color: Colors.accent,
  },
  outOfStockText: {
    textAlign: 'center',
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
  },
  stickyBar: {
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
