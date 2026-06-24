import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { generateSlug, productImageUrl } from '@/lib/helpers'
import { getProductRecommendations } from '@/server/services/recommendation-service'
import {
  collectProductVariationMaterialIds,
  getProductVariationMaterialsMap,
  getStoredProductVariationConfig,
  resolveProductMaterialVariations,
} from '@/server/services/product-variation-service'

export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.prela-atelier.com'

function requestOrigin(request: NextRequest) {
  const origin = request.nextUrl.origin
  return origin.includes('localhost') ? SITE_URL : origin
}

function absoluteImageUrl(path: string | null | undefined, origin: string) {
  const imagePath = productImageUrl(path)
  return imagePath.startsWith('http') ? imagePath : `${origin}${imagePath}`
}

function normalizeBadge(badge: string | null) {
  if (!badge) return null

  const upper = badge.toUpperCase()
  if (upper === 'NEW' || upper === 'LIMITED' || upper === 'BESTSELLER') return upper
  return badge
}

function toMaterialResponse(
  material: {
    id: number
    name: string
    origin: string | null
    description: string | null
    imagePath: string | null
    hardness?: string | null
    tone?: string | null
    veining?: string | null
  } | null,
  origin: string,
) {
  if (!material) return null

  return {
    id: material.id,
    name: material.name,
    slug: generateSlug(material.name),
    description: material.description,
    imagePath: absoluteImageUrl(material.imagePath, origin),
    colorHex: null,
    origin: material.origin,
    hardness: material.hardness ?? null,
    tone: material.tone ?? null,
    veining: material.veining ?? null,
  }
}

function toImageResponse(images: string[], origin: string, alt: string) {
  return images.map((imagePath, index) => ({
    id: index,
    path: absoluteImageUrl(imagePath, origin),
    alt,
    position: index,
  }))
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const origin = requestOrigin(request)

  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      priceEur: true,
      imagePath: true,
      badge: true,
      stock: true,
      materialId: true,
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
      images: {
        select: {
          id: true,
          url: true,
          sortOrder: true,
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  if (!product) {
    return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
  }

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

  const fallbackMainImage = absoluteImageUrl(product.imagePath ?? product.material?.imagePath ?? null, origin)
  const activeVariation = resolved.defaultVariation
  const images = activeVariation
    ? toImageResponse(activeVariation.images, origin, product.name)
    : product.images.length > 0
      ? product.images.map((image) => ({
          id: image.id,
          path: absoluteImageUrl(image.url, origin),
          alt: product.name,
          position: image.sortOrder,
        }))
      : [{ id: 0, path: fallbackMainImage, alt: product.name, position: 0 }]

  const recommendations = await getProductRecommendations({
    currentProductId: product.id,
    limit: 6,
  })

  return NextResponse.json({
    success: true,
    data: {
      id: product.id,
      name: product.name,
      slug: product.slug,
      priceEur: activeVariation?.priceEUR ?? Number(product.priceEur),
      imagePath: images[0]?.path ?? fallbackMainImage,
      badge: normalizeBadge(product.badge),
      stock: product.stock,
      description: product.description,
      descriptionHtml: null,
      widthCm: null,
      heightCm: null,
      weightKg: null,
      images,
      material: toMaterialResponse(activeVariation?.material ?? product.material, origin),
      defaultVariation: activeVariation ? {
        materialId: activeVariation.materialId,
        materialName: activeVariation.materialName,
        priceEur: activeVariation.priceEUR,
        priceOverrideEur: activeVariation.priceOverrideEUR,
        images: toImageResponse(activeVariation.images, origin, product.name),
        isDefault: activeVariation.isDefault,
        material: toMaterialResponse(activeVariation.material, origin),
      } : null,
      variations: resolved.variations.map((variation) => ({
        materialId: variation.materialId,
        materialName: variation.materialName,
        priceEur: variation.priceEUR,
        priceOverrideEur: variation.priceOverrideEUR,
        images: toImageResponse(variation.images, origin, product.name),
        isDefault: variation.isDefault,
        material: toMaterialResponse(variation.material, origin),
      })),
      recommendedProducts: recommendations.map((recommendation) => ({
        id: recommendation.id,
        name: recommendation.name,
        slug: recommendation.slug,
        priceEur: recommendation.priceEur,
        imagePath: absoluteImageUrl(recommendation.imagePath, origin),
        badge: normalizeBadge(recommendation.badge),
        stock: recommendation.stock,
        materialId: recommendation.materialId,
        materialName: recommendation.materialName,
      })),
    },
  })
}
