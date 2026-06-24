import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Colors, Typography, Spacing, Radius, Shadow } from '../constants/theme';
import { useCartStore } from '../store/cartStore';
import { buildCartItemId } from '../utils/cart';
import { formatPrice } from '../utils/currency';
import type {
  ProductCardData,
  ProductMaterialVariation,
  Currency,
  RootStackParamList,
} from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.md * 3) / 2;

interface Props {
  product: ProductCardData;
  currency: Currency;
  onPress: () => void;
}

const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  NEW: { bg: Colors.primary, text: Colors.textInverse },
  LIMITED: { bg: Colors.accent, text: Colors.white },
  BESTSELLER: { bg: Colors.surfaceAlt, text: Colors.primary },
};

type Nav = NativeStackNavigationProp<RootStackParamList>;

function getDefaultVariation(product: ProductCardData) {
  return (
    product.defaultVariation ??
    product.variations?.find((variation) => variation.isDefault) ??
    product.variations?.[0] ??
    null
  );
}

export default function ProductCard({ product, currency, onPress }: Props) {
  const navigation = useNavigation<Nav>();
  const addItem = useCartStore((state) => state.addItem);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(
    product.defaultVariation?.materialId ?? product.variations?.[0]?.materialId ?? null,
  );

  const badge = product.badge;
  const badgeStyle = badge ? BADGE_COLORS[badge] : null;
  const defaultVariation = useMemo(() => getDefaultVariation(product), [product]);
  const availableVariations = product.variations ?? [];
  const hasMultipleVariations = availableVariations.length > 1;
  const displayVariation = defaultVariation;
  const displayImagePath = displayVariation?.images[0]?.path ?? product.imagePath;
  const displayMaterialName = displayVariation?.materialName ?? product.materialName ?? null;
  const displayPriceEur = displayVariation?.priceEur ?? product.priceEur;

  const selectedVariation = useMemo(
    () =>
      availableVariations.find((variation) => variation.materialId === selectedMaterialId) ??
      defaultVariation,
    [availableVariations, defaultVariation, selectedMaterialId],
  );

  const addSelectedVariationToCart = (variation?: ProductMaterialVariation | null) => {
    const chosenVariation = variation ?? selectedVariation ?? defaultVariation;
    const imagePath = chosenVariation?.images[0]?.path ?? product.imagePath;
    const materialId = chosenVariation?.materialId ?? product.materialId ?? null;
    const materialName =
      chosenVariation?.materialName ?? chosenVariation?.material?.name ?? product.materialName ?? null;
    const price = chosenVariation?.priceEur ?? product.priceEur;

    addItem({
      cartItemId: buildCartItemId(product.id, materialId),
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price,
      quantity: 1,
      imagePath,
      materialId,
      materialName,
    });

    setIsPickerOpen(false);
    Alert.alert('Added to Cart', `${product.name} is now in your cart.`, [
      { text: 'Continue', style: 'cancel' },
      {
        text: 'View Cart',
        onPress: () => navigation.navigate('MainTabs', { screen: 'Cart' }),
      },
    ]);
  };

  const handleQuickAdd = () => {
    if (product.stock === 0) {
      Alert.alert('Sold Out', 'This piece is currently unavailable.');
      return;
    }

    if (hasMultipleVariations) {
      setSelectedMaterialId(defaultVariation?.materialId ?? availableVariations[0]?.materialId ?? null);
      setIsPickerOpen(true);
      return;
    }

    addSelectedVariationToCart(defaultVariation);
  };

  return (
    <>
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardTapArea}
          onPress={onPress}
          activeOpacity={0.9}
        >
          <View style={styles.imageWrapper}>
            {displayImagePath ? (
              <Image
                source={{ uri: displayImagePath }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.placeholderText}>*</Text>
              </View>
            )}
            {badgeStyle && badge && (
              <View style={[styles.badge, { backgroundColor: badgeStyle.bg }]}>
                <Text style={[styles.badgeText, { color: badgeStyle.text }]}>
                  {badge}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.info}>
            {displayMaterialName ? (
              <Text style={styles.material}>{displayMaterialName}</Text>
            ) : null}
            <Text style={styles.name} numberOfLines={2}>
              {product.name}
            </Text>
            <Text style={styles.price}>{formatPrice(displayPriceEur, currency)}</Text>
            {product.stock === 0 ? (
              <Text style={styles.soldOut}>Sold Out</Text>
            ) : hasMultipleVariations ? (
              <Text style={styles.variationHint}>
                {availableVariations.length} material options
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.quickAddButton,
            product.stock === 0 && styles.quickAddButtonDisabled,
          ]}
          onPress={handleQuickAdd}
          disabled={product.stock === 0}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.quickAddButtonText,
              product.stock === 0 && styles.quickAddButtonTextDisabled,
            ]}
          >
            {product.stock === 0
              ? 'UNAVAILABLE'
              : hasMultipleVariations
                ? 'CHOOSE MATERIAL'
                : 'ADD TO CART'}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={isPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPickerOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setIsPickerOpen(false)}>
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleWrap}>
                <Text style={styles.modalEyebrow}>Select Stone</Text>
                <Text style={styles.modalTitle}>{product.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setIsPickerOpen(false)}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalList}
              contentContainerStyle={styles.modalListContent}
              showsVerticalScrollIndicator={false}
            >
              {availableVariations.map((variation) => {
                const previewImage = variation.images[0]?.path ?? product.imagePath;
                const isSelected = selectedVariation?.materialId === variation.materialId;

                return (
                  <TouchableOpacity
                    key={variation.materialId}
                    style={[
                      styles.variationOption,
                      isSelected && styles.variationOptionActive,
                    ]}
                    onPress={() => setSelectedMaterialId(variation.materialId)}
                    activeOpacity={0.9}
                  >
                    {previewImage ? (
                      <Image
                        source={{ uri: previewImage }}
                        style={styles.variationImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.variationImage, styles.variationImagePlaceholder]}>
                        <Text style={styles.placeholderText}>*</Text>
                      </View>
                    )}

                    <View style={styles.variationInfo}>
                      <Text style={styles.variationName}>{variation.materialName}</Text>
                      {variation.material?.origin ? (
                        <Text style={styles.variationOrigin}>{variation.material.origin}</Text>
                      ) : null}
                      <Text style={styles.variationPrice}>
                        {formatPrice(variation.priceEur, currency)}
                      </Text>
                    </View>

                    <View style={[styles.selectionDot, isSelected && styles.selectionDotActive]} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.secondaryAction}
                onPress={() => {
                  setIsPickerOpen(false);
                  onPress();
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryActionText}>VIEW DETAILS</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryAction}
                onPress={() => addSelectedVariationToCart()}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryActionText}>ADD TO CART</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    ...Shadow.sm,
    marginBottom: Spacing.md,
  },
  cardTapArea: {
    flex: 1,
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 0.85,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 32,
    color: Colors.border,
  },
  badge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  badgeText: {
    fontSize: Typography.xs,
    letterSpacing: Typography.trackingWidest,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  info: {
    padding: Spacing.sm + 2,
    gap: 3,
  },
  material: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    letterSpacing: Typography.trackingWide,
    textTransform: 'uppercase',
    fontFamily: Typography.fontSans,
  },
  name: {
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    fontFamily: Typography.fontSerif,
    lineHeight: Typography.sm * Typography.lineHeightTight * 1.1,
  },
  price: {
    fontSize: Typography.sm,
    color: Colors.accent,
    fontFamily: Typography.fontSans,
    fontWeight: '500',
    marginTop: 2,
  },
  soldOut: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  variationHint: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  quickAddButton: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  quickAddButtonDisabled: {
    backgroundColor: Colors.surfaceAlt,
  },
  quickAddButtonText: {
    textAlign: 'center',
    fontSize: Typography.xs,
    color: Colors.primary,
    letterSpacing: Typography.trackingWidest,
    fontFamily: Typography.fontSans,
  },
  quickAddButtonTextDisabled: {
    color: Colors.textMuted,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    padding: Spacing.md,
  },
  modalCard: {
    maxHeight: '82%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    ...Shadow.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  modalTitleWrap: {
    flex: 1,
    gap: 4,
  },
  modalEyebrow: {
    fontSize: Typography.xs,
    color: Colors.accent,
    letterSpacing: Typography.trackingWidest,
    textTransform: 'uppercase',
  },
  modalTitle: {
    fontSize: Typography.lg,
    color: Colors.primary,
    fontFamily: Typography.fontSerif,
  },
  closeText: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    letterSpacing: Typography.trackingWide,
    textTransform: 'uppercase',
  },
  modalList: {
    maxHeight: 360,
  },
  modalListContent: {
    gap: Spacing.sm,
  },
  variationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.background,
  },
  variationOptionActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.surface,
  },
  variationImage: {
    width: 56,
    height: 56,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceAlt,
  },
  variationImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  variationInfo: {
    flex: 1,
    gap: 2,
  },
  variationName: {
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    fontFamily: Typography.fontSans,
  },
  variationOrigin: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  variationPrice: {
    fontSize: Typography.sm,
    color: Colors.accent,
    fontWeight: '500',
  },
  selectionDot: {
    width: 16,
    height: 16,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  selectionDotActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  secondaryAction: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
  },
  secondaryActionText: {
    fontSize: Typography.xs,
    color: Colors.primary,
    letterSpacing: Typography.trackingWidest,
  },
  primaryAction: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
  },
  primaryActionText: {
    fontSize: Typography.xs,
    color: Colors.textInverse,
    letterSpacing: Typography.trackingWidest,
  },
});
