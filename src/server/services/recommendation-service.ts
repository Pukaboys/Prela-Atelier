import prisma from '@/lib/db'
import type { CartItem } from '@/types'
import {
  collectProductVariationMaterialIds,
  getProductVariationMaterialsMap,
  getStoredProductVariationConfigMap,
  resolveProductMaterialVariations,
} from '@/server/services/product-variation-service'

export const MAX_VIEWED_PRODUCT_IDS = 12

export type RecommendationReason =
  | 'same-material'
  | 'cart-match'
  | 'viewed-match'
  | 'featured'
  | 'price-fit'

export type ProductRecommendation = {
  id: number
  name: string
  slug: string
  description: string | null
  priceEur: number
  imagePath: string | null
  badge: string | null
  stock: number
  materialId: number | null
  materialName: string | null
  material: {
    id: number
    name: string
    origin: string | null
    imagePath: string | null
  } | null
  reasons: RecommendationReason[]
}

type RecommendationInput = {
  currentProductId?: number
  viewedProductIds?: number[]
  cartItems?: Pick<CartItem, 'productId' | 'quantity'>[]
  limit?: number
}

type SeedProduct = {
  id: number
  materialId: number | null
  priceEur: unknown
  featured: boolean
  badge: string | null
  name: string
  description: string | null
  material: {
    id: number
    name: string
    origin: string | null
    tone: string | null
    veining: string | null
  } | null
}

function uniqueIds(ids: (number | undefined)[]) {
  return [
    ...new Set(
      ids.filter((id): id is number => typeof id === 'number' && Number.isInteger(id) && id > 0),
    ),
  ]
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

export function rememberViewedProductId(existing: number[] | undefined, productId: number) {
  return uniqueIds([productId, ...(existing ?? [])]).slice(0, MAX_VIEWED_PRODUCT_IDS)
}

function words(value: string | null | undefined) {
  return new Set(
    (value ?? '')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 3),
  )
}

function overlapScore(
  candidate: Pick<SeedProduct, 'name' | 'description'>,
  seeds: Pick<SeedProduct, 'name' | 'description'>[],
) {
  const candidateWords = words(`${candidate.name} ${candidate.description ?? ''}`)
  if (candidateWords.size === 0) return 0

  let score = 0
  for (const seed of seeds) {
    for (const word of words(`${seed.name} ${seed.description ?? ''}`)) {
      if (candidateWords.has(word)) score += 1
    }
  }
  return Math.min(score, 6)
}

function addReason(reasons: Set<RecommendationReason>, reason: RecommendationReason) {
  if (reasons.size < 3) reasons.add(reason)
}

function averageSeedPrice(seeds: SeedProduct[]) {
  if (seeds.length === 0) return null
  const total = seeds.reduce((sum, product) => sum + Number(product.priceEur), 0)
  return total / seeds.length
}

export async function getProductRecommendations({
  currentProductId,
  viewedProductIds = [],
  cartItems = [],
  limit = 4,
}: RecommendationInput): Promise<ProductRecommendation[]> {
  const cartIds = uniqueIds(cartItems.map((item) => item.productId))
  const viewedIds = uniqueIds(viewedProductIds)
  const seedIds = uniqueIds([currentProductId, ...cartIds, ...viewedIds])
  const excludeIds = uniqueIds([currentProductId, ...cartIds])

  const seedProducts = seedIds.length > 0
    ? await prisma.product.findMany({
        where: { id: { in: seedIds } },
        select: {
          id: true,
          name: true,
          description: true,
          materialId: true,
          priceEur: true,
          featured: true,
          badge: true,
          material: {
            select: {
              id: true,
              name: true,
              origin: true,
              tone: true,
              veining: true,
            },
          },
        },
      })
    : []

  const seedMaterialIds = uniqueIds(seedProducts.map((product) => product.materialId ?? undefined))
  const cartSeedMaterialIds = new Set(seedProducts.filter((product) => cartIds.includes(product.id)).map((product) => product.materialId).filter(isPresent))
  const viewedSeedMaterialIds = new Set(seedProducts.filter((product) => viewedIds.includes(product.id) || product.id === currentProductId).map((product) => product.materialId).filter(isPresent))
  const seedOrigins = new Set(seedProducts.map((product) => product.material?.origin).filter(isPresent))
  const seedTones = new Set(seedProducts.map((product) => product.material?.tone).filter(isPresent))
  const seedVeining = new Set(seedProducts.map((product) => product.material?.veining).filter(isPresent))
  const avgPrice = averageSeedPrice(seedProducts)

  const candidates = await prisma.product.findMany({
    where: {
      id: excludeIds.length ? { notIn: excludeIds } : undefined,
      stock: { gt: 0 },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      priceEur: true,
      imagePath: true,
      badge: true,
      stock: true,
      featured: true,
      materialId: true,
      material: {
        select: {
          id: true,
          name: true,
          origin: true,
          tone: true,
          veining: true,
          imagePath: true,
        },
      },
    },
    orderBy: [{ featured: 'desc' }, { id: 'asc' }],
    take: 60,
  })

  const scored = candidates.map((candidate) => {
    let score = 0
    const reasons = new Set<RecommendationReason>()
    const candidateMaterialId = candidate.materialId ?? null

    if (candidateMaterialId && cartSeedMaterialIds.has(candidateMaterialId)) {
      score += 46
      addReason(reasons, 'cart-match')
    }

    if (candidateMaterialId && viewedSeedMaterialIds.has(candidateMaterialId)) {
      score += 34
      addReason(reasons, 'same-material')
    } else if (candidateMaterialId && seedMaterialIds.includes(candidateMaterialId)) {
      score += 24
      addReason(reasons, 'viewed-match')
    }

    if (candidate.material?.origin && seedOrigins.has(candidate.material.origin)) score += 10
    if (candidate.material?.tone && seedTones.has(candidate.material.tone)) score += 8
    if (candidate.material?.veining && seedVeining.has(candidate.material.veining)) score += 6

    if (avgPrice && avgPrice > 0) {
      const priceRatio = Math.abs(Number(candidate.priceEur) - avgPrice) / avgPrice
      if (priceRatio <= 0.25) {
        score += 9
        addReason(reasons, 'price-fit')
      } else if (priceRatio <= 0.5) {
        score += 4
      }
    }

    score += overlapScore(candidate, seedProducts)

    if (candidate.featured) {
      score += 7
      addReason(reasons, 'featured')
    }
    if (candidate.badge) score += 3

    if (score === 0) {
      score = candidate.featured ? 4 : 1
    }

    return { candidate, score, reasons }
  })

  const candidateConfigMap = await getStoredProductVariationConfigMap(candidates.map((candidate) => candidate.id))
  const candidateMaterialsById = await getProductVariationMaterialsMap(
    collectProductVariationMaterialIds(candidates, candidateConfigMap),
  )

  return scored
    .sort((a, b) => b.score - a.score || a.candidate.id - b.candidate.id)
    .slice(0, limit)
    .map(({ candidate, reasons }) => {
      const resolved = resolveProductMaterialVariations({
        productId: candidate.id,
        basePriceEUR: candidate.priceEur,
        productImagePath: candidate.imagePath ?? candidate.material?.imagePath ?? null,
        baseMaterialId: candidate.materialId,
        baseMaterial: candidate.material,
        storedConfig: candidateConfigMap.get(candidate.id),
        materialsById: candidateMaterialsById,
      })
      const activeVariation = resolved.defaultVariation
      const activeMaterial = activeVariation?.material ?? candidate.material

      return {
        id: candidate.id,
        name: candidate.name,
        slug: candidate.slug,
        description: candidate.description,
        priceEur: activeVariation?.priceEUR ?? Number(candidate.priceEur),
        imagePath: activeVariation?.images[0] ?? candidate.imagePath ?? candidate.material?.imagePath ?? null,
        badge: candidate.badge,
        stock: candidate.stock,
        materialId: activeVariation?.materialId ?? candidate.materialId ?? null,
        materialName: activeVariation?.materialName ?? activeMaterial?.name ?? null,
        material: activeMaterial
          ? {
              id: activeMaterial.id,
              name: activeMaterial.name,
              origin: activeMaterial.origin ?? null,
              imagePath: activeMaterial.imagePath ?? null,
            }
          : null,
        reasons: Array.from(reasons),
      }
    })
}
