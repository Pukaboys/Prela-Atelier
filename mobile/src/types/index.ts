import type { NavigatorScreenParams } from '@react-navigation/native';

export type Currency = 'EUR' | 'USD' | 'GBP';

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type EnquiryStatus = 'new' | 'read' | 'replied' | 'closed';
export type ProductBadge = 'NEW' | 'LIMITED' | 'BESTSELLER' | null;

export interface ApiResponse<T = undefined> {
  success: boolean;
  data?: T;
  error?: string;
}

// ─── Product ────────────────────────────────────────────────────────────────

export interface ProductCardData {
  id: number;
  name: string;
  slug: string;
  priceEur: number;
  imagePath: string | null;
  badge: ProductBadge;
  stock: number;
  materialId?: number | null;
  materialName?: string | null;
  isFeatured?: boolean;
  defaultVariation?: ProductMaterialVariation | null;
  variations?: ProductMaterialVariation[];
}

export interface ProductDetail extends ProductCardData {
  description: string | null;
  descriptionHtml: string | null;
  widthCm: number | null;
  heightCm: number | null;
  weightKg: number | null;
  images: ProductImage[];
  material: Material | null;
  defaultVariation?: ProductMaterialVariation | null;
  variations?: ProductMaterialVariation[];
  recommendedProducts?: ProductCardData[];
}

export interface ProductImage {
  id: number;
  path: string;
  alt: string | null;
  position: number;
}

// ─── Material ───────────────────────────────────────────────────────────────

export interface Material {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imagePath: string | null;
  colorHex: string | null;
  origin: string | null;
  hardness?: string | null;
  tone?: string | null;
  veining?: string | null;
}

export interface ProductMaterialVariation {
  materialId: number;
  materialName: string;
  priceEur: number;
  priceOverrideEur?: number | null;
  images: ProductImage[];
  isDefault: boolean;
  material: Material | null;
}

// ─── Cart ───────────────────────────────────────────────────────────────────

export interface CartItem {
  cartItemId: string;
  productId: number;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  imagePath: string | null;
  materialId: number | null;
  materialName: string | null;
}

export interface AppliedPromo {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  discount: number;
}

// ─── Checkout ────────────────────────────────────────────────────────────────

export interface CheckoutFormData {
  name: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  postcode: string;
  country: string;
  notes?: string;
}

export interface CheckoutPayload extends CheckoutFormData {
  items: CartItem[];
  currency: Currency;
  promoCode?: string;
}

export interface OrderConfirmedData {
  orderCode: string;
  total: number;
  currency: Currency;
}

// ─── Order Tracking ──────────────────────────────────────────────────────────

export interface OrderTrackResult {
  orderCode: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  items: OrderTrackItem[];
  shippingAddress: string;
  total: number;
  currency: Currency;
  statusHistory?: StatusHistoryEntry[];
}

export interface OrderTrackItem {
  name: string;
  quantity: number;
  price: number;
}

export interface StatusHistoryEntry {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

// ─── Custom / Bespoke Order ──────────────────────────────────────────────────

export interface CustomOrderCalculatePayload {
  widthCm: number;
  heightCm: number;
  thicknessCm?: number | null;
  quantity?: number;
  materialId: number;
  currency: Currency;
}

export interface CustomOrderQuote {
  estimatedPrice: number;
  currency: Currency;
  widthCm: number;
  heightCm: number;
  materialName: string;
  leadTimeWeeks?: number;
}

export interface BespokeEnquiryPayload {
  name: string;
  email: string;
  phone?: string;
  widthCm: number;
  heightCm: number;
  materialId: number;
  notes?: string;
  currency: Currency;
  estimatedPrice?: number;
}

// ─── Promo ───────────────────────────────────────────────────────────────────

export interface PromoValidatePayload {
  code: string;
  subtotal: number;
  currency: Currency;
}

export interface PromoValidateResult {
  valid: boolean;
  code?: string;
  type?: 'percentage' | 'fixed';
  value?: number;
  discount?: number;
  error?: string;
}

// ─── Client / Profile ────────────────────────────────────────────────────────

export interface ClientOrder {
  id: number;
  orderCode: string;
  status: OrderStatus;
  total: number;
  currency: Currency;
  createdAt: string;
  itemCount: number;
}

export interface ClientEnquiry {
  id: number;
  status: EnquiryStatus;
  createdAt: string;
  widthCm: number;
  heightCm: number;
  materialName: string;
  estimatedPrice: number | null;
}

// ─── Navigation Types ─────────────────────────────────────────────────────────

export type TabParamList = {
  Home: undefined;
  Collections: undefined;
  Bespoke: undefined;
  Cart: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList> | undefined;
  ProductDetail: { slug: string };
  Checkout: undefined;
  OrderConfirmed: { orderCode: string; total: number; currency: Currency };
  OrderTracking: { orderCode?: string; email?: string } | undefined;
  Login: undefined;
};
