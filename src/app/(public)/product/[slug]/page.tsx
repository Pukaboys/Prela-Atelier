import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import prisma from '@/lib/db'
import { normalizeCartItems } from '@/lib/cart'
import { formatPrice, productImageUrl } from '@/lib/helpers'
import { ProductViewTracker } from '@/components/analytics/ProductViewTracker'
import { ProductRecommendations } from '@/components/recommendations/ProductRecommendations'
import { getSession } from '@/lib/session'
import { getDisplayCurrencyOptions } from '@/server/services/currency-service'
import { getCurrentLanguage } from '@/server/services/language-service'
import { getProductRecommendations } from '@/server/services/recommendation-service'
import { getPublicPageCopy } from '@/lib/public-page-copy'
import {
  collectProductVariationMaterialIds,
  getProductVariationMaterialsMap,
  getStoredProductVariationConfig,
  resolveProductMaterialVariations,
} from '@/server/services/product-variation-service'
import { ProductDetailClient } from './ProductDetailClient'

export const dynamic = 'force-dynamic'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await prisma.product.findFirst({
    where: { slug },
    select: {
      id: true,
      name: true,
      description: true,
      imagePath: true,
      materialId: true,
      images: { select: { url: true }, orderBy: { sortOrder: 'asc' } },
      material: {
        select: {
          id: true,
          name: true,
          origin: true,
          description: true,
          hardness: true,
          tone: true,
          veining: true,
          imagePath: true,
        },
      },
      priceEur: true,
    },
  })
  if (!product) return { title: 'Product Not Found' }

  const storedConfig = await getStoredProductVariationConfig(product.id)
  const configMap = new Map(storedConfig ? [[product.id, storedConfig]] : [])
  const materialsById = await getProductVariationMaterialsMap(
    collectProductVariationMaterialIds([{ id: product.id, materialId: product.materialId }], configMap),
  )
  const resolved = resolveProductMaterialVariations({
    productId: product.id,
    basePriceEUR: product.priceEur,
    productImagePath: product.imagePath ?? product.material?.imagePath ?? null,
    galleryImagePaths: product.images.map((image) => image.url),
    baseMaterialId: product.materialId,
    baseMaterial: product.material,
    storedConfig,
    materialsById,
  })

  const displayImage = resolved.defaultVariation?.images[0] ?? product.imagePath ?? product.material?.imagePath ?? null
  const imageUrl = productImageUrl(displayImage)
  const absoluteImage = imageUrl.startsWith('http') ? imageUrl : `${APP_URL}${imageUrl}`
  const canonicalUrl = `${APP_URL}/product/${slug}`

  return {
    title: `${product.name} - Prela Atelier`,
    description: product.description || `${product.name} - handcrafted natural stone accessory by Prela Atelier.`,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: 'website',
      title: `${product.name} - Prela Atelier`,
      description: product.description || `${product.name} - handcrafted natural stone accessory by Prela Atelier.`,
      url: canonicalUrl,
      siteName: 'Prela Atelier',
      images: [{ url: absoluteImage, alt: product.name, width: 800, height: 800 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} - Prela Atelier`,
      description: product.description || `${product.name} - handcrafted natural stone accessory by Prela Atelier.`,
      images: [absoluteImage],
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const [currencyOptions, language, session] = await Promise.all([getDisplayCurrencyOptions(), getCurrentLanguage(), getSession()])
  const copy = getPublicPageCopy(language).product
  const raw = await prisma.product.findFirst({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      priceEur: true,
      badge: true,
      stock: true,
      materialId: true,
      imagePath: true,
      images: { select: { id: true, url: true, sortOrder: true }, orderBy: { sortOrder: 'asc' } },
      material: {
        select: {
          id: true,
          name: true,
          origin: true,
          description: true,
          hardness: true,
          tone: true,
          veining: true,
          imagePath: true,
        },
      },
    },
  })
  if (!raw) notFound()
  const storedConfig = await getStoredProductVariationConfig(raw.id)
  const configMap = new Map(storedConfig ? [[raw.id, storedConfig]] : [])
  const materialsById = await getProductVariationMaterialsMap(
    collectProductVariationMaterialIds([{ id: raw.id, materialId: raw.materialId }], configMap),
  )
  const resolved = resolveProductMaterialVariations({
    productId: raw.id,
    basePriceEUR: raw.priceEur,
    productImagePath: raw.imagePath ?? raw.material?.imagePath ?? null,
    galleryImagePaths: raw.images.map((image) => image.url),
    baseMaterialId: raw.materialId,
    baseMaterial: raw.material,
    storedConfig,
    materialsById,
  })
  const product = {
    ...raw,
    priceEur: Number(raw.priceEur),
    images: raw.images.map((image) => ({
      id: image.id,
      path: productImageUrl(image.url),
      alt: raw.name,
      position: image.sortOrder,
    })),
    material: raw.material ? {
      id: raw.material.id,
      name: raw.material.name,
      description: raw.material.description,
      imagePath: raw.material.imagePath ? productImageUrl(raw.material.imagePath) : null,
      origin: raw.material.origin,
      hardness: raw.material.hardness,
      tone: raw.material.tone,
      veining: raw.material.veining,
    } : null,
    defaultVariation: resolved.defaultVariation ? {
      materialId: resolved.defaultVariation.materialId,
      materialName: resolved.defaultVariation.materialName,
      priceEur: resolved.defaultVariation.priceEUR,
      priceOverrideEur: resolved.defaultVariation.priceOverrideEUR,
      images: resolved.defaultVariation.images.map((imagePath, index) => ({
        id: index,
        path: productImageUrl(imagePath),
        alt: raw.name,
        position: index,
      })),
      isDefault: resolved.defaultVariation.isDefault,
      material: resolved.defaultVariation.material ? {
        id: resolved.defaultVariation.material.id,
        name: resolved.defaultVariation.material.name,
        description: resolved.defaultVariation.material.description,
        imagePath: resolved.defaultVariation.material.imagePath
          ? (resolved.defaultVariation.material.imagePath.startsWith('http')
            ? resolved.defaultVariation.material.imagePath
            : productImageUrl(resolved.defaultVariation.material.imagePath))
          : null,
        origin: resolved.defaultVariation.material.origin,
        hardness: resolved.defaultVariation.material.hardness,
        tone: resolved.defaultVariation.material.tone,
        veining: resolved.defaultVariation.material.veining,
      } : null,
    } : null,
    variations: resolved.variations.map((variation) => ({
      materialId: variation.materialId,
      materialName: variation.materialName,
      priceEur: variation.priceEUR,
      priceOverrideEur: variation.priceOverrideEUR,
      images: variation.images.map((imagePath, index) => ({
        id: index,
        path: productImageUrl(imagePath),
        alt: raw.name,
        position: index,
      })),
      isDefault: variation.isDefault,
      material: variation.material ? {
        id: variation.material.id,
        name: variation.material.name,
        description: variation.material.description,
        imagePath: variation.material.imagePath
          ? (variation.material.imagePath.startsWith('http')
            ? variation.material.imagePath
            : productImageUrl(variation.material.imagePath))
          : null,
        origin: variation.material.origin,
        hardness: variation.material.hardness,
        tone: variation.material.tone,
        veining: variation.material.veining,
      } : null,
    })),
  }

  const priceNum = Number(product.defaultVariation?.priceEur ?? product.priceEur)
  const displayImage = product.defaultVariation?.images[0]?.path ?? product.imagePath ?? product.material?.imagePath ?? null
  const mainUrl = displayImage ? productImageUrl(displayImage) : productImageUrl(null)

  const absoluteImage = mainUrl.startsWith('http') ? mainUrl : `${APP_URL}${mainUrl}`
  const canonicalUrl = `${APP_URL}/product/${slug}`

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || undefined,
    image: absoluteImage,
    brand: { '@type': 'Brand', name: 'Prela Atelier' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'EUR',
      price: priceNum.toFixed(2),
      availability: product.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: canonicalUrl,
      seller: { '@type': 'Organization', name: 'Prela Atelier' },
    },
  }

  const recommendations = await getProductRecommendations({
    currentProductId: product.id,
    viewedProductIds: session.viewedProductIds,
    cartItems: normalizeCartItems(session.cart),
    limit: 4,
  })

  return (
    <div className="min-h-screen bg-cream pt-36 pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <ProductViewTracker productId={product.id} productName={product.name} priceEur={priceNum} />

      <div className="max-w-7xl mx-auto px-6">
        <Link
          href="/collections"
          className="inline-flex items-center gap-2 text-sm font-sans text-stone-pale hover:text-stone transition-colors mb-10"
        >
          {'<-'} {copy.backToCollections}
        </Link>

        <ProductDetailClient product={product} currencyOptions={currencyOptions} />
      </div>

      <ProductRecommendations
        recommendations={recommendations}
        currencyOptions={currencyOptions}
        language={language}
        className="bg-cream border-t border-beige mt-20"
      />
    </div>
  )
}
