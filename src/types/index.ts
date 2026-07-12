export interface CartItem {
  cartItemId: string
  productId: number
  slug: string
  name: string
  price: number
  quantity: number
  imagePath: string | null
  materialId: number | null
  materialName: string | null
}

export interface AppliedPromo {
  code: string
  type: 'percentage' | 'fixed'
  value: number
  discount: number
}

export interface SessionData {
  adminId?: number
  sessionNonce?: string
  cart?: CartItem[]
  viewedProductIds?: number[]
  pokpayPendingForm?: CheckoutFormData
  pokpayOrderId?: string
  bespokePaymentToken?: string
  bespokePaymentForm?: CheckoutFormData
  bespokePaymentPokOrderId?: string
  pendingOrder?: CheckoutFormData
  appliedPromo?: AppliedPromo
  customOrderQuote?: {
    widthCm: number
    heightCm: number
    thicknessCm: number | null
    quantity: number
    materialId: number
    materialName: string
    materialImagePath: string | null
    materialOrigin: string | null
    areaM2: number
    totalAreaM2: number
    thicknessFactor: number
    estimatedMaterialCost: number
    estimatedProductionCost: number
    totalEstimatedPrice: number
    generatedAt: string
  }
}

export interface CheckoutFormData {
  name: string
  email: string
  phone?: string
  address: string
  city: string
  postcode: string
  country: string
  notes?: string
}

export type ProductBadge = 'NEW' | 'LIMITED' | 'BESTSELLER' | null

export interface ProductImage {
  id: number
  path: string
  alt: string | null
  position: number
}

export interface ProductMaterialDetails {
  id: number
  name: string
  slug?: string
  description: string | null
  imagePath: string | null
  colorHex?: string | null
  origin: string | null
  hardness?: string | null
  tone?: string | null
  veining?: string | null
}

export interface ProductMaterialVariation {
  materialId: number
  materialName: string
  priceEur: number
  priceOverrideEur?: number | null
  images: ProductImage[]
  isDefault: boolean
  material: ProductMaterialDetails | null
}

export interface ProductCardData {
  id: number
  name: string
  slug: string
  priceEur: number
  imagePath: string | null
  badge: string | null
  stock: number
  materialId?: number | null
  materialName?: string | null
  isFeatured?: boolean
  defaultVariation?: ProductMaterialVariation | null
  variations?: ProductMaterialVariation[]
}

export type OrderStatusType =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export type EnquiryStatusType = 'new' | 'read' | 'replied' | 'closed'

export interface ApiResponse<T = undefined> {
  success: boolean
  data?: T
  error?: string
}
