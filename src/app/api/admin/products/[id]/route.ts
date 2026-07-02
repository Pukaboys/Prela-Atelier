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

async function ensureProductDeleteKeepsOrderHistory() {
  await prisma.$executeRawUnsafe(`
    DO $$
    DECLARE
      existing_constraint text;
    BEGIN
      SELECT tc.constraint_name
      INTO existing_constraint
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = current_schema()
        AND tc.table_name = 'order_items'
        AND kcu.column_name = 'product_id'
        AND ccu.table_name = 'products'
        AND ccu.column_name = 'id'
      LIMIT 1;

      IF existing_constraint IS NOT NULL THEN
        EXECUTE format('ALTER TABLE order_items DROP CONSTRAINT %I', existing_constraint);
      END IF;

      ALTER TABLE order_items ALTER COLUMN product_id DROP NOT NULL;

      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_schema = current_schema()
          AND table_name = 'order_items'
          AND constraint_name = 'order_items_product_id_fkey'
      ) THEN
        ALTER TABLE order_items
          ADD CONSTRAINT order_items_product_id_fkey
          FOREIGN KEY (product_id)
          REFERENCES products(id)
          ON DELETE SET NULL;
      END IF;
    END $$;
  `)
}

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
    await ensureProductDeleteKeepsOrderHistory()

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
