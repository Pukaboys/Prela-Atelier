import type { Prisma } from '@prisma/client'
import { z } from 'zod'
import prisma from '@/lib/db'
import { toNumber, type DecimalLike } from '@/server/utils/money'

const PRODUCT_VARIATION_SETTING_PREFIX = 'product_variations:'

type ProductVariationDbClient = typeof prisma | Prisma.TransactionClient

export const productVariationInputSchema = z.object({
  materialId: z.number().int().positive(),
  materialName: z.string().trim().max(120).optional().default(''),
  priceEUR: z.number().nonnegative().nullable().optional(),
  images: z.array(z.string().trim().min(1).max(500)).max(12).optional().default([]),
  isDefault: z.boolean().optional().default(false),
})

const productVariationConfigSchema = z.object({
  productId: z.number().int().positive(),
  variations: z.array(productVariationInputSchema).max(24).default([]),
})

export type ProductVariationInput = z.infer<typeof productVariationInputSchema>
export type ProductVariationConfig = z.infer<typeof productVariationConfigSchema>

export type ProductVariationMaterialRecord = {
  id: number
  name: string
  origin?: string | null
  description?: string | null
  hardness?: string | null
  tone?: string | null
  veining?: string | null
  imagePath?: string | null
}

export type ResolvedProductVariation = {
  materialId: number
  materialName: string
  priceEUR: number
  priceOverrideEUR: number | null
  images: string[]
  isDefault: boolean
  material: {
    id: number
    name: string
    origin: string | null
    description: string | null
    hardness: string | null
    tone: string | null
    veining: string | null
    imagePath: string | null
  } | null
}

export type ResolveProductVariationParams = {
  productId: number
  basePriceEUR: DecimalLike
  productImagePath?: string | null
  galleryImagePaths?: string[]
  baseMaterialId?: number | null
  baseMaterial?: ProductVariationMaterialRecord | null
  storedConfig?: ProductVariationConfig | null
  materialsById?: Map<number, ProductVariationMaterialRecord>
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))]
}

function settingKey(productId: number) {
  return `${PRODUCT_VARIATION_SETTING_PREFIX}${productId}`
}

function normalizeMaterialRecord(material: ProductVariationMaterialRecord | null | undefined) {
  if (!material) return null

  return {
    id: material.id,
    name: material.name,
    origin: material.origin ?? null,
    description: material.description ?? null,
    hardness: material.hardness ?? null,
    tone: material.tone ?? null,
    veining: material.veining ?? null,
    imagePath: material.imagePath ?? null,
  }
}

function normalizeProductVariationInputs(
  productId: number,
  variations: ProductVariationInput[] | undefined,
  baseMaterialId?: number | null,
  materialsById?: Map<number, ProductVariationMaterialRecord>,
): ProductVariationConfig {
  const deduped = new Map<number, ProductVariationInput>()

  for (const variation of variations ?? []) {
    const parsed = productVariationInputSchema.safeParse(variation)
    if (!parsed.success) continue

    const current = parsed.data
    const material = materialsById?.get(current.materialId)

    deduped.set(current.materialId, {
      materialId: current.materialId,
      materialName: material?.name ?? current.materialName ?? '',
      priceEUR: current.priceEUR ?? null,
      images: uniqueStrings(current.images),
      isDefault: current.isDefault,
    })
  }

  const normalized = [...deduped.values()]
  const defaultIndex = normalized.findIndex((variation) => variation.isDefault)
  const fallbackIndex = normalized.findIndex((variation) => variation.materialId === baseMaterialId)
  const nextDefaultIndex =
    defaultIndex >= 0
      ? defaultIndex
      : fallbackIndex >= 0
        ? fallbackIndex
        : normalized.length > 0
          ? 0
          : -1

  return {
    productId,
    variations: normalized.map((variation, index) => ({
      ...variation,
      isDefault: nextDefaultIndex >= 0 ? index === nextDefaultIndex : false,
    })),
  }
}

export function collectProductVariationMaterialIds(
  products: Array<{ id: number; materialId?: number | null }>,
  configMap: Map<number, ProductVariationConfig>,
) {
  const materialIds = new Set<number>()

  for (const product of products) {
    if (typeof product.materialId === 'number' && product.materialId > 0) {
      materialIds.add(product.materialId)
    }

    const config = configMap.get(product.id)
    for (const variation of config?.variations ?? []) {
      materialIds.add(variation.materialId)
    }
  }

  return [...materialIds]
}

export async function getProductVariationMaterialsMap(
  materialIds: number[],
  client: ProductVariationDbClient = prisma,
) {
  if (materialIds.length === 0) {
    return new Map<number, ProductVariationMaterialRecord>()
  }

  const materials = await client.material.findMany({
    where: { id: { in: materialIds } },
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
  })

  return new Map<number, ProductVariationMaterialRecord>(materials.map((material) => [material.id, material]))
}

export async function getStoredProductVariationConfig(
  productId: number,
  client: ProductVariationDbClient = prisma,
) {
  const row = await client.setting.findUnique({
    where: { key: settingKey(productId) },
    select: { value: true },
  })

  if (!row?.value) return null

  try {
    const parsed = JSON.parse(row.value)
    const validated = productVariationConfigSchema.safeParse(parsed)
    return validated.success
      ? normalizeProductVariationInputs(productId, validated.data.variations)
      : null
  } catch {
    return null
  }
}

export async function getStoredProductVariationConfigMap(
  productIds: number[],
  client: ProductVariationDbClient = prisma,
) {
  if (productIds.length === 0) {
    return new Map<number, ProductVariationConfig>()
  }

  const keys = productIds.map((productId) => settingKey(productId))
  const rows = await client.setting.findMany({
    where: { key: { in: keys } },
    select: { key: true, value: true },
  })

  const result = new Map<number, ProductVariationConfig>()

  for (const row of rows) {
    const rawProductId = row.key.slice(PRODUCT_VARIATION_SETTING_PREFIX.length)
    const productId = Number.parseInt(rawProductId, 10)
    if (!Number.isInteger(productId) || productId <= 0) continue

    try {
      const parsed = JSON.parse(row.value)
      const validated = productVariationConfigSchema.safeParse(parsed)
      if (!validated.success) continue
      result.set(
        productId,
        normalizeProductVariationInputs(productId, validated.data.variations),
      )
    } catch {
      continue
    }
  }

  return result
}

export async function saveProductVariationConfig(
  productId: number,
  variations: ProductVariationInput[] | undefined,
  options: {
    client?: ProductVariationDbClient
    baseMaterialId?: number | null
    materialsById?: Map<number, ProductVariationMaterialRecord>
  } = {},
) {
  const normalized = normalizeProductVariationInputs(
    productId,
    variations,
    options.baseMaterialId,
    options.materialsById,
  )

  const client = options.client ?? prisma

  if (normalized.variations.length === 0) {
    await client.setting.deleteMany({ where: { key: settingKey(productId) } })
    return normalized
  }

  await client.setting.upsert({
    where: { key: settingKey(productId) },
    create: {
      key: settingKey(productId),
      value: JSON.stringify(normalized),
    },
    update: {
      value: JSON.stringify(normalized),
    },
  })

  return normalized
}

export async function deleteProductVariationConfig(
  productId: number,
  client: ProductVariationDbClient = prisma,
) {
  await client.setting.deleteMany({ where: { key: settingKey(productId) } })
}

export function getEditableProductVariations(
  productId: number,
  storedConfig: ProductVariationConfig | null | undefined,
  materialsById?: Map<number, ProductVariationMaterialRecord>,
) {
  return normalizeProductVariationInputs(
    productId,
    storedConfig?.variations,
    undefined,
    materialsById,
  ).variations
}

export function resolveProductMaterialVariations({
  productId,
  basePriceEUR,
  productImagePath = null,
  galleryImagePaths = [],
  baseMaterialId = null,
  baseMaterial = null,
  storedConfig = null,
  materialsById = new Map<number, ProductVariationMaterialRecord>(),
}: ResolveProductVariationParams) {
  const basePrice = toNumber(basePriceEUR)
  const fallbackGallery = uniqueStrings([
    productImagePath,
    ...galleryImagePaths,
    baseMaterial?.imagePath ?? null,
  ])

  const config = normalizeProductVariationInputs(
    productId,
    storedConfig?.variations,
    baseMaterialId,
    materialsById,
  )

  const resolveVariationMaterial = (materialId: number) =>
    normalizeMaterialRecord(
      materialsById.get(materialId) ??
      (baseMaterial?.id === materialId ? baseMaterial : null),
    )

  let variations: ResolvedProductVariation[] = config.variations.map((variation) => {
    const material = resolveVariationMaterial(variation.materialId)
    const images = uniqueStrings([
      ...variation.images,
      ...(variation.images.length === 0 ? fallbackGallery : []),
      material?.imagePath ?? null,
    ])

    return {
      materialId: variation.materialId,
      materialName: material?.name ?? variation.materialName ?? 'Stone Selection',
      priceEUR: variation.priceEUR ?? basePrice,
      priceOverrideEUR: variation.priceEUR ?? null,
      images,
      isDefault: variation.isDefault,
      material,
    }
  })

  if (variations.length === 0 && baseMaterial) {
    variations = [{
      materialId: baseMaterial.id,
      materialName: baseMaterial.name,
      priceEUR: basePrice,
      priceOverrideEUR: null,
      images: fallbackGallery,
      isDefault: true,
      material: normalizeMaterialRecord(baseMaterial),
    }]
  }

  const defaultVariation = variations.find((variation) => variation.isDefault) ?? variations[0] ?? null

  return {
    variations,
    defaultVariation,
    hasStoredVariations: config.variations.length > 0,
  }
}

export function resolveProductVariationSelection(
  params: ResolveProductVariationParams & {
    selectedMaterialId?: number | null
  },
) {
  const resolved = resolveProductMaterialVariations(params)
  const selected =
    resolved.variations.find((variation) => variation.materialId === params.selectedMaterialId) ??
    resolved.defaultVariation

  return {
    ...resolved,
    selectedVariation: selected,
  }
}
