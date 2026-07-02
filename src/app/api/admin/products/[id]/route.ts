import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import {
  getProductVariationMaterialsMap,
  productVariationInputSchema,
  saveProductVariationConfig,
  deleteProductVariationConfig,
} from '@/server/services/product-variation-service'

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().optional(),
  priceEur: z.number().positive().optional(),
  imagePath: z.string().optional(),
  badge: z.string().optional(),
  stock: z.number().int().min(0).optional(),
  featured: z.boolean().optional(),
  materialId: z.number().int().nullable().optional(),
  materialVariations: z.array(productVariationInputSchema).optional(),
})

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const numId = parseInt(id)
  if (isNaN(numId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const body = await req.json()
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 422 })
  }

  const d = parsed.data

  if (d.slug) {
    const existing = await prisma.product.findFirst({ where: { slug: d.slug, NOT: { id: numId } } })
    if (existing) {
      return NextResponse.json({ error: 'A product with this slug already exists.' }, { status: 409 })
    }
  }

  try {
    const materialIds = [...new Set([
      ...(('materialId' in d && typeof d.materialId === 'number') ? [d.materialId] : []),
      ...(d.materialVariations?.map((variation) => variation.materialId) ?? []),
    ])]
    const materialsById = await getProductVariationMaterialsMap(materialIds)

    const product = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id: numId },
        data: {
          ...(d.name !== undefined && { name: d.name }),
          ...(d.slug !== undefined && { slug: d.slug }),
          ...(d.description !== undefined && { description: d.description || null }),
          ...(d.priceEur !== undefined && { priceEur: d.priceEur }),
          ...(d.imagePath !== undefined && { imagePath: d.imagePath || null }),
          ...(d.badge !== undefined && { badge: d.badge || null }),
          ...(d.stock !== undefined && { stock: d.stock }),
          ...(d.featured !== undefined && { featured: d.featured }),
          ...('materialId' in d && { materialId: d.materialId ?? null }),
        },
      })

      let defaultMaterialId = updated.materialId

      if (d.materialVariations !== undefined) {
        const variationConfig = await saveProductVariationConfig(updated.id, d.materialVariations, {
          client: tx,
          baseMaterialId: 'materialId' in d ? (d.materialId ?? null) : updated.materialId,
          materialsById,
        })

        defaultMaterialId =
          variationConfig.variations.find((variation) => variation.isDefault)?.materialId ??
          ('materialId' in d ? (d.materialId ?? null) : updated.materialId)
      }

      return tx.product.update({
        where: { id: numId },
        data: {
          materialId: defaultMaterialId ?? null,
        },
        include: { material: { select: { id: true, name: true, imagePath: true } } },
      })
    })

    return NextResponse.json({ ...product, priceEur: Number(product.priceEur) })
  } catch {
    return NextResponse.json({ error: 'Product not found.' }, { status: 404 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const numId = parseInt(id)
  if (isNaN(numId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  try {
    const orderItemCount = await prisma.orderItem.count({ where: { productId: numId } })

    if (orderItemCount > 0) {
      return NextResponse.json(
        {
          error: `This product is used in ${orderItemCount} order item${orderItemCount === 1 ? '' : 's'} and cannot be permanently deleted. Set its stock to 0 if you want to stop selling it while keeping order history safe.`,
        },
        { status: 409 },
      )
    }

    await prisma.$transaction(async (tx) => {
      await deleteProductVariationConfig(numId, tx)
      await tx.product.delete({ where: { id: numId } })
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 })
    }

    console.error('[admin/products DELETE]', err)
    return NextResponse.json({ error: 'Unable to delete product.' }, { status: 500 })
  }
}
