import prisma from '@/lib/db'
import { getSettings } from '@/lib/settings'
import { getMaterialPriceSettingKey } from '@/lib/material-pricing'
import type { CustomOrderCalculationInput } from '@/server/validations/custom-order'

const BASE_MATERIAL_RATE_PER_M2 = 950
const DEFAULT_PRODUCTION_MULTIPLIER = 0.65
const DEFAULT_THICKNESS_CM = 2

export type CalculatedCustomOrderQuote = {
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

function round2(value: number) {
  return Math.round(value * 100) / 100
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function parsePositiveNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function fallbackMaterialPremium(name: string) {
  const normalized = name.trim().toLowerCase()

  if (normalized.includes('onyx')) return 1.55
  if (
    normalized.includes('calacatta') ||
    normalized.includes('calacatti') ||
    normalized.includes('calacata')
  ) {
    return 1.45
  }
  if (normalized.includes('marquina')) return 1.25
  if (normalized.includes('emperador')) return 1.18
  if (normalized.includes('travertine')) return 0.95
  if (normalized.includes('carrara')) return 1

  return 1.1
}

function formatDimension(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

export async function calculateCustomOrderQuote(
  input: CustomOrderCalculationInput,
  settingsOverride?: Record<string, string>,
): Promise<CalculatedCustomOrderQuote> {
  const [material, catalog, settings] = await Promise.all([
    prisma.material.findUnique({
      where: { id: input.materialId },
      select: { id: true, name: true, origin: true, imagePath: true },
    }),
    prisma.product.findMany({
      select: { priceEur: true, materialId: true },
    }),
    settingsOverride ? Promise.resolve(settingsOverride) : getSettings(),
  ])

  if (!material) {
    throw new Error('Selected material was not found.')
  }

  const areaM2 = round2((input.widthCm / 100) * (input.heightCm / 100))
  const totalAreaM2 = round2(areaM2 * input.quantity)
  const thicknessCm = input.thicknessCm ?? null
  const effectiveThickness = thicknessCm ?? DEFAULT_THICKNESS_CM
  const thicknessFactor = round2(1 + Math.max(effectiveThickness - DEFAULT_THICKNESS_CM, 0) * 0.12)

  const configuredMaterialRate = Number(settings[getMaterialPriceSettingKey(material.id)])
  let materialRatePerM2 =
    Number.isFinite(configuredMaterialRate) && configuredMaterialRate >= 0
      ? round2(configuredMaterialRate)
      : 0

  if (materialRatePerM2 <= 0) {
    const allCatalogPrices = catalog.map((product) => Number(product.priceEur)).filter((price) => price > 0)
    const materialCatalogPrices = catalog
      .filter((product) => product.materialId === material.id)
      .map((product) => Number(product.priceEur))
      .filter((price) => price > 0)

    const allCatalogAverage =
      allCatalogPrices.length > 0
        ? allCatalogPrices.reduce((sum, price) => sum + price, 0) / allCatalogPrices.length
        : 0
    const materialCatalogAverage =
      materialCatalogPrices.length > 0
        ? materialCatalogPrices.reduce((sum, price) => sum + price, 0) / materialCatalogPrices.length
        : 0

    const catalogPremiumFactor = round2(
      materialCatalogAverage > 0 && allCatalogAverage > 0
        ? clamp(materialCatalogAverage / allCatalogAverage, 0.75, 1.85)
        : fallbackMaterialPremium(material.name)
    )

    materialRatePerM2 = round2(BASE_MATERIAL_RATE_PER_M2 * catalogPremiumFactor)
  }

  const estimatedMaterialCost = round2(totalAreaM2 * materialRatePerM2 * thicknessFactor)
  const productionMultiplier = parsePositiveNumber(
    settings.custom_order_production_multiplier,
    DEFAULT_PRODUCTION_MULTIPLIER,
  )
  const estimatedProductionCost = round2(estimatedMaterialCost * productionMultiplier)
  const totalEstimatedPrice = round2(estimatedMaterialCost + estimatedProductionCost)

  return {
    widthCm: input.widthCm,
    heightCm: input.heightCm,
    thicknessCm,
    quantity: input.quantity,
    materialId: material.id,
    materialName: material.name,
    materialImagePath: material.imagePath,
    materialOrigin: material.origin,
    areaM2,
    totalAreaM2,
    thicknessFactor,
    estimatedMaterialCost,
    estimatedProductionCost,
    totalEstimatedPrice,
    generatedAt: new Date().toISOString(),
  }
}

export function formatCustomOrderQuoteSummary(quote: CalculatedCustomOrderQuote) {
  return [
    'Custom Order Builder Estimate',
    `Material: ${quote.materialName}${quote.materialOrigin ? ` (${quote.materialOrigin})` : ''}`,
    `Dimensions: ${formatDimension(quote.widthCm)} x ${formatDimension(quote.heightCm)} cm`,
    `Thickness: ${quote.thicknessCm ? `${formatDimension(quote.thicknessCm)} cm` : `Standard ${DEFAULT_THICKNESS_CM} cm`}`,
    `Quantity: ${quote.quantity}`,
    `Area per piece: ${quote.areaM2.toFixed(2)} m2`,
    `Total area: ${quote.totalAreaM2.toFixed(2)} m2`,
    `Thickness factor: ${quote.thicknessFactor.toFixed(2)}x`,
    `Estimated material cost: EUR ${quote.estimatedMaterialCost.toFixed(2)}`,
    `Estimated production cost: EUR ${quote.estimatedProductionCost.toFixed(2)}`,
    `Estimated total: EUR ${quote.totalEstimatedPrice.toFixed(2)}`,
  ].join('\n')
}
