import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { generateSlug, productImageUrl } from '@/lib/helpers'
import {
  collectProductVariationMaterialIds,
  getProductVariationMaterialsMap,
  getStoredProductVariationConfigMap,
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

export async function GET(request: NextRequest) {
  const origin = requestOrigin(request)
  const searchParams = request.nextUrl.searchParams
  const featured = searchParams.get('featured')
  const material = searchParams.get('material')

  const products = await prisma.product.findMany({
    where: {
      ...(featured === 'true' ? { featured: true } : {}),
      ...(material
        ? {
            material: {
              name: {
                equals: material.replace(/-/g, ' '),
                mode: 'insensitive',
              },
            },
          }
        : {}),
    },
    orderBy: [{ featured: 'desc' }, { id: 'asc' }],
    select: {
      id: true,
      name: true,
      slug: true,
      priceEur: true,
      imagePath: true,
      badge: true,
      stock: true,
      materialId: true,
      featured: true,
      material: {
        select: {
          id: true,
          name: true,
          origin: true,
          description: true,
          imagePath: true,
        },
      },
    },
  })

  const configMap = await getStoredProductVariationConfigMap(products.map((product) => product.id))
  const materialsById = await getProductVariationMaterialsMap(
    collectProductVariationMaterialIds(products, configMap),
  )

  const resolvedProducts = products.map((product) => {
    const resolved = resolveProductMaterialVariations({
      productId: product.id,
      basePriceEUR: product.priceEur,
      productImagePath: product.imagePath ?? product.material?.imagePath ?? null,
      baseMaterialId: product.materialId,
      baseMaterial: product.material,
      storedConfig: configMap.get(product.id),
      materialsById,
    })

    const defaultVariation = resolved.defaultVariation
    const materialName = defaultVariation?.materialName ?? product.material?.name
    const materialSlug = materialName ? generateSlug(materialName) : undefined
    const variations = resolved.variations.map((variation) => ({
      materialId: variation.materialId,
      materialName: variation.materialName,
      priceEur: variation.priceEUR,
      priceOverrideEur: variation.priceOverrideEUR,
      images: variation.images.map((imagePath, index) => ({
        id: index,
        path: absoluteImageUrl(imagePath, origin),
        alt: product.name,
        position: index,
      })),
      isDefault: variation.isDefault,
      material: variation.material ? {
        id: variation.material.id,
        name: variation.material.name,
        slug: generateSlug(variation.material.name),
        description: variation.material.description,
        imagePath: absoluteImageUrl(variation.material.imagePath, origin),
        colorHex: null,
        origin: variation.material.origin,
      } : null,
    }))

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      priceEur: defaultVariation?.priceEUR ?? Number(product.priceEur),
      imagePath: absoluteImageUrl(
        defaultVariation?.images[0] ?? product.imagePath ?? product.material?.imagePath ?? null,
        origin,
      ),
      badge: normalizeBadge(product.badge),
      stock: product.stock,
      materialId: defaultVariation?.materialId ?? product.materialId ?? null,
      materialName,
      isFeatured: product.featured,
      materialSlug,
      defaultVariation: variations.find((variation) => variation.isDefault) ?? null,
      variations,
    }
  }).filter((product) => {
    if (!material) return true

    const normalizedMaterial = material.replace(/-/g, ' ').toLowerCase()
    return product.variations.some((variation) => variation.materialName.toLowerCase() === normalizedMaterial)
      || product.materialName?.toLowerCase() === normalizedMaterial
  })

  return NextResponse.json({
    success: true,
    data: resolvedProducts,
  })
}
