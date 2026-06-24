import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  RefreshControl,
  StatusBar,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Colors, Typography, Spacing, Radius, Shadow } from '../constants/theme';
import { fetchProducts, fetchMaterials } from '../services/products';
import { fetchCurrencySettings } from '../services/settings';
import { useCurrencyStore } from '../store/currencyStore';
import type { ProductCardData, Material, RootStackParamList } from '../types';

import ProductCard from '../components/ProductCard';
import CurrencySelector from '../components/CurrencySelector';
import { ProductCardSkeleton } from '../components/LoadingSkeleton';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function materialColor(material: Material) {
  if (material.colorHex) return material.colorHex;
  const name = material.name.toLowerCase();
  if (name.includes('black') || name.includes('marquina')) return '#2A2422';
  if (name.includes('onyx')) return '#C4934B';
  if (name.includes('travertine')) return '#C8B89A';
  if (name.includes('emperador')) return '#6B4C3B';
  if (name.includes('calacatta')) return '#EFEDEA';
  if (name.includes('carrara') || name.includes('white')) return '#F1F0EC';
  return Colors.surfaceAlt;
}

function MaterialArtwork({ material, large = false }: { material: Material; large?: boolean }) {
  if (material.imagePath) {
    return (
      <Image
        source={{ uri: material.imagePath }}
        style={large ? styles.previewImage : styles.materialImage}
        resizeMode="cover"
      />
    );
  }

  const base = materialColor(material);
  return (
    <View style={[large ? styles.previewImage : styles.materialImage, styles.materialFallback, { backgroundColor: base }]}>
      <View style={[styles.vein, styles.veinOne]} />
      <View style={[styles.vein, styles.veinTwo]} />
      <View style={[styles.vein, styles.veinThree]} />
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { currency } = useCurrencyStore();

  const [featuredProducts, setFeaturedProducts] = useState<ProductCardData[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);

  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    try {
      setError(null);
      await fetchCurrencySettings();
      const [products, mats] = await Promise.all([
        fetchProducts({ featured: true, limit: 6 }),
        fetchMaterials(),
      ]);
      setFeaturedProducts(products);
      setMaterials(mats.slice(0, 4));
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    } catch (err: any) {
      setError(err.message ?? 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSuper}>L U X U R Y  M A R B L E</Text>
          <Text style={styles.headerBrand}>PRELA ATELIER</Text>
        </View>
        <CurrencySelector />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent}
          />
        }
      >
        {/* Hero Banner */}
        <Animated.View style={[styles.hero, { opacity: fadeAnim }]}>
          <View style={styles.heroInner}>
            <Text style={styles.heroEyebrow}>NEW COLLECTION</Text>
            <Text style={styles.heroTitle}>
              Crafted in{'\n'}Marble
            </Text>
            <Text style={styles.heroSub}>
              Timeless surfaces for the discerning home
            </Text>
            <TouchableOpacity
              style={styles.heroCta}
              onPress={() => navigation.navigate('MainTabs', { screen: 'Collections' })}
              activeOpacity={0.8}
            >
              <Text style={styles.heroCtaText}>EXPLORE COLLECTION</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Materials Strip */}
        {materials.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>OUR STONES</Text>
            <Text style={styles.sectionTitle}>Premium Materials</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.materialsRow}
            >
              {materials.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={styles.materialChip}
                  activeOpacity={0.86}
                  onPress={() => setPreviewMaterial(m)}
                >
                  <MaterialArtwork material={m} />
                  <Text style={styles.materialChipName}>{m.name}</Text>
                  {m.origin && (
                    <Text style={styles.materialChipOrigin}>{m.origin}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Featured Products */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CURATED FOR YOU</Text>
          <Text style={styles.sectionTitle}>Featured Pieces</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={load} style={styles.retryBtn}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : loading ? (
            <View style={styles.grid}>
              {[0, 1, 2, 3].map((k) => (
                <View key={k} style={styles.gridItem}>
                  <ProductCardSkeleton />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.grid}>
              {featuredProducts.map((p) => (
                <View key={p.id} style={styles.gridItem}>
                  <ProductCard
                    product={p}
                    currency={currency}
                    onPress={() =>
                      navigation.navigate('ProductDetail', { slug: p.slug })
                    }
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Bespoke CTA */}
        <View style={styles.bespokeSection}>
          <View style={styles.bespokeCard}>
            <Text style={styles.bespokeEyebrow}>MADE FOR YOU</Text>
            <Text style={styles.bespokeTitle}>Bespoke Orders</Text>
            <Text style={styles.bespokeSub}>
              Commission a piece crafted to your exact dimensions and specifications.
            </Text>
            <TouchableOpacity
              style={styles.bespokeCta}
              onPress={() => navigation.navigate('MainTabs', { screen: 'Bespoke' })}
              activeOpacity={0.8}
            >
              <Text style={styles.bespokeCtaText}>ENQUIRE NOW</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: Spacing.xl + insets.bottom }} />
      </ScrollView>

      <Modal
        visible={previewMaterial !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewMaterial(null)}
      >
        <Pressable style={styles.previewBackdrop} onPress={() => setPreviewMaterial(null)}>
          <Pressable style={styles.previewPanel}>
            {previewMaterial && (
              <>
                <MaterialArtwork material={previewMaterial} large />
                <View style={styles.previewInfo}>
                  <Text style={styles.previewName}>{previewMaterial.name}</Text>
                  {previewMaterial.origin && (
                    <Text style={styles.previewOrigin}>{previewMaterial.origin}</Text>
                  )}
                  {previewMaterial.description && (
                    <Text style={styles.previewDescription} numberOfLines={5}>
                      {previewMaterial.description}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.previewClose}
                  onPress={() => setPreviewMaterial(null)}
                  accessibilityRole="button"
                  accessibilityLabel="Close material preview"
                >
                  <Text style={styles.previewCloseText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
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
    backgroundColor: Colors.background,
  },
  headerSuper: {
    fontSize: Typography.xs - 1,
    color: Colors.textMuted,
    letterSpacing: Typography.trackingWidest * 1.5,
    fontFamily: Typography.fontSans,
  },
  headerBrand: {
    fontSize: Typography.lg,
    color: Colors.primary,
    letterSpacing: Typography.trackingWidest,
    fontFamily: Typography.fontSerif,
  },

  // Hero
  hero: {
    backgroundColor: Colors.primary,
    minHeight: 340,
    justifyContent: 'flex-end',
  },
  heroInner: {
    padding: Spacing.xl,
    paddingBottom: Spacing['2xl'],
  },
  heroEyebrow: {
    fontSize: Typography.xs,
    color: Colors.accentLight,
    letterSpacing: Typography.trackingWidest * 1.5,
    marginBottom: Spacing.sm,
  },
  heroTitle: {
    fontSize: Typography['3xl'],
    color: Colors.textInverse,
    fontFamily: Typography.fontSerif,
    lineHeight: Typography['3xl'] * 1.15,
    marginBottom: Spacing.sm,
  },
  heroSub: {
    fontSize: Typography.base,
    color: Colors.surfaceAlt,
    fontFamily: Typography.fontSans,
    lineHeight: Typography.base * 1.6,
    marginBottom: Spacing.xl,
  },
  heroCta: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.accent,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  heroCtaText: {
    fontSize: Typography.xs,
    color: Colors.accent,
    letterSpacing: Typography.trackingWidest,
    fontFamily: Typography.fontSans,
  },

  // Sections
  section: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl,
  },
  sectionLabel: {
    fontSize: Typography.xs - 1,
    color: Colors.accent,
    letterSpacing: Typography.trackingWidest * 1.5,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: Typography.xl,
    color: Colors.primary,
    fontFamily: Typography.fontSerif,
    marginBottom: Spacing.md,
  },

  // Materials
  materialsRow: {
    gap: Spacing.sm,
    paddingRight: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  materialChip: {
    backgroundColor: Colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
    alignItems: 'center',
    width: 148,
    ...Shadow.sm,
  },
  materialImage: {
    width: '100%',
    height: 96,
    backgroundColor: Colors.surfaceAlt,
  },
  materialFallback: {
    overflow: 'hidden',
  },
  vein: {
    position: 'absolute',
    height: 2,
    borderRadius: 2,
    backgroundColor: 'rgba(44, 36, 23, 0.22)',
    transform: [{ rotate: '-22deg' }],
  },
  veinOne: {
    width: 150,
    top: 26,
    left: -20,
  },
  veinTwo: {
    width: 120,
    top: 58,
    left: 34,
    opacity: 0.55,
  },
  veinThree: {
    width: 90,
    top: 78,
    left: -8,
    opacity: 0.35,
  },
  materialChipName: {
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    textAlign: 'center',
    fontFamily: Typography.fontSans,
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
    minHeight: 42,
  },
  materialChipOrigin: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
    minHeight: 34,
  },
  previewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 18, 8, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  previewPanel: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    overflow: 'hidden',
    ...Shadow.lg,
  },
  previewImage: {
    width: '100%',
    height: 280,
    backgroundColor: Colors.surfaceAlt,
  },
  previewInfo: {
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  previewName: {
    fontSize: Typography.xl,
    color: Colors.primary,
    fontFamily: Typography.fontSerif,
    textAlign: 'center',
  },
  previewOrigin: {
    fontSize: Typography.sm,
    color: Colors.accentDark,
    textAlign: 'center',
  },
  previewDescription: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.sm * 1.55,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  previewClose: {
    borderTopWidth: 1,
    borderColor: Colors.borderLight,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  previewCloseText: {
    fontSize: Typography.xs,
    color: Colors.primary,
    letterSpacing: Typography.trackingWidest,
    textTransform: 'uppercase',
    fontWeight: '600',
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  gridItem: {
    flex: 1,
    minWidth: '45%',
    maxWidth: '50%',
  },

  // Error
  errorBox: {
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.base,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  retryText: {
    fontSize: Typography.sm,
    color: Colors.primary,
    letterSpacing: Typography.trackingWidest,
  },

  // Bespoke
  bespokeSection: {
    padding: Spacing.md,
    paddingTop: Spacing.xl,
  },
  bespokeCard: {
    backgroundColor: Colors.surfaceAlt,
    padding: Spacing.xl,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  bespokeEyebrow: {
    fontSize: Typography.xs - 1,
    color: Colors.accent,
    letterSpacing: Typography.trackingWidest * 1.5,
    marginBottom: 4,
  },
  bespokeTitle: {
    fontSize: Typography.xl,
    color: Colors.primary,
    fontFamily: Typography.fontSerif,
    marginBottom: Spacing.sm,
  },
  bespokeSub: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.sm * 1.6,
    marginBottom: Spacing.lg,
  },
  bespokeCta: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  bespokeCtaText: {
    fontSize: Typography.xs,
    color: Colors.textInverse,
    letterSpacing: Typography.trackingWidest,
  },
});
