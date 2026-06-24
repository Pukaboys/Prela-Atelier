import prisma from './db'

const MATERIAL_PRICE_PREFIX = 'material_price_eur_'

export function getMaterialPriceSettingKey(materialId: number) {
  return `${MATERIAL_PRICE_PREFIX}${materialId}`
}

export async function getMaterialPriceMap(materialIds: number[]) {
  if (materialIds.length === 0) return new Map<number, number>()

  const keys = materialIds.map(getMaterialPriceSettingKey)
  const rows = await prisma.setting.findMany({
    where: { key: { in: keys } },
    select: { key: true, value: true },
  })

  const priceMap = new Map<number, number>()

  for (const row of rows) {
    const materialId = Number(row.key.replace(MATERIAL_PRICE_PREFIX, ''))
    const value = Number(row.value)

    if (Number.isInteger(materialId) && Number.isFinite(value) && value >= 0) {
      priceMap.set(materialId, value)
    }
  }

  return priceMap
}

export async function getMaterialPrice(materialId: number) {
  const row = await prisma.setting.findUnique({
    where: { key: getMaterialPriceSettingKey(materialId) },
    select: { value: true },
  })

  if (!row) return null

  const value = Number(row.value)
  return Number.isFinite(value) && value >= 0 ? value : null
}

export async function setMaterialPrice(materialId: number, pricePerM2Eur: number | null) {
  const key = getMaterialPriceSettingKey(materialId)

  if (pricePerM2Eur === null) {
    await prisma.setting.deleteMany({ where: { key } })
    return
  }

  await prisma.setting.upsert({
    where: { key },
    update: { value: pricePerM2Eur.toFixed(2) },
    create: { key, value: pricePerM2Eur.toFixed(2) },
  })
}
