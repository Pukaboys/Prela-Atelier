import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import {
  collectProductVariationMaterialIds,
  getEditableProductVariations,
  getProductVariationMaterialsMap,
  getStoredProductVariationConfigMap,
  productVariationInputSchema,
  saveProductVariationConfig,
} from '@/server/services/product-variation-service'

const ProductSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, hyphens only'),
  description: z.string().optional().default(''),
  priceEur: z.number().positive(),
  imagePath: z.string().optional().default(''),
  badge: z.string().optional().default(''),
  stock: z.number().int().min(0).default(0),
  featured: z.boolean().default(false),
  materialId: z.number().int().nullable().optional(),
  materialVariations: z.array(productVariationInputSchema).optional().default([]),
})

export async function GET() {
  await requireAdmin()
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      priceEur: true,
      stock: true,
      featured: true,
      badge: true,
      imagePath: true,
      materialId: true,
      material: { select: { id: true, name: true, imagePath: true } },
      createdAt: true,
    },
  })

  const configMap = await getStoredProductVariationConfigMap(products.map((product) => product.id))
  const materialsById = await getProductVariationMaterialsMap(
    collectProductVariationMaterialIds(products, configMap),
  )

  return NextResponse.json(products.map((product) => ({
    ...product,
    priceEur: Number(product.priceEur),
    materialVariations: getEditableProductVariations(
      product.id,
      configMap.get(product.id),
      materialsById,
    ),
    variationCount: configMap.get(product.id)?.variations.length ?? 0,
  })))
}

export async function POST(req: NextRequest) {
  await requireAdmin()
  const body = await req.json()
  const parsed = ProductSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 422 })
  }
  const { name, slug, description, priceEur, imagePath, badge, stock, featured, materialId, materialVariations } = parsed.data

  const existing = await prisma.product.findUnique({ where: { slug } })
  if (existing) {
    return NextResponse.json({ error: 'A product with this slug already exists.' }, { status: 409 })
  }

  const materialIds = [...new Set([
    ...(typeof materialId === 'number' ? [materialId] : []),
    ...materialVariations.map((variation) => variation.materialId),
  ])]
  const materialsById = await getProductVariationMaterialsMap(materialIds)

  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        name,
        slug,
        description: description || null,
        priceEur,
        imagePath: imagePath || null,
        badge: badge || null,
        stock,
        featured,
        materialId: materialId ?? null,
      },
    })

    const variationConfig = await saveProductVariationConfig(created.id, materialVariations, {
      client: tx,
      baseMaterialId: materialId ?? null,
      materialsById,
    })

    const defaultMaterialId =
      variationConfig.variations.find((variation) => variation.isDefault)?.materialId ??
      materialId ??
      null

    return tx.product.update({
      where: { id: created.id },
      data: {
        materialId: defaultMaterialId,
      },
      include: { material: { select: { id: true, name: true, imagePath: true } } },
    })
  })

  return NextResponse.json({
    ...product,
    priceEur: Number(product.priceEur),
    materialVariations,
  }, { status: 201 })
}
