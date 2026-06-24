import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../constants/theme';
import { formatPrice } from '../utils/currency';
import { useCartStore } from '../store/cartStore';
import type { CartItem, Currency } from '../types';

interface Props {
  item: CartItem;
  currency: Currency;
}

export default function CartItemRow({ item, currency }: Props) {
  const { removeItem, updateQuantity } = useCartStore();

  return (
    <View style={styles.row}>
      <View style={styles.imageWrapper}>
        {item.imagePath ? (
          <Image source={{ uri: item.imagePath }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imageFallback}>
            <Text style={styles.imageFallbackText}>*</Text>
          </View>
        )}
      </View>

      <View style={styles.details}>
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
        {item.materialName ? (
          <Text style={styles.material}>{item.materialName}</Text>
        ) : null}
        <Text style={styles.price}>{formatPrice(item.price, currency)}</Text>

        <View style={styles.qtyRow}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => updateQuantity(item.cartItemId, item.quantity - 1)}
          >
            <Text style={styles.qtyBtnText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.qty}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => updateQuantity(item.cartItemId, item.quantity + 1)}
          >
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => removeItem(item.cartItemId)}
          >
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.lineTotal}>
        {formatPrice(item.price * item.quantity, currency)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    alignItems: 'flex-start',
  },
  imageWrapper: {
    width: 72,
    height: 88,
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageFallbackText: {
    color: Colors.border,
    fontSize: 20,
  },
  details: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    fontFamily: Typography.fontSerif,
    lineHeight: Typography.sm * 1.4,
  },
  material: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    letterSpacing: Typography.trackingWide,
    textTransform: 'uppercase',
    fontFamily: Typography.fontSans,
  },
  price: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: Typography.md,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  qty: {
    fontSize: Typography.base,
    color: Colors.textPrimary,
    minWidth: 20,
    textAlign: 'center',
  },
  removeBtn: {
    marginLeft: 'auto',
  },
  removeText: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
  lineTotal: {
    fontSize: Typography.sm,
    color: Colors.primary,
    fontWeight: '500',
    minWidth: 64,
    textAlign: 'right',
  },
});
