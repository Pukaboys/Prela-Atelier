import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import { getSession } from '@/lib/session'
import { normalizeCartItem, normalizeCartItems } from '@/lib/cart'
import { assertCartInventoryAvailable, InventoryError } from '@/server/services/inventory-service'
import {
  collectProductVariationMaterialIds,
  getProductVariationMaterialsMap,
  getStoredProductVariationConfig,
  resolveProductVariationSelection,
} from '@/server/services/product-variation-service'

const schema = z.object({
  productId: z.coerce.number().int().positive(),
  materialId: z.coerce.number().int().positive().nullable().optional(),
  quantity: z.coerce.number().int().min(1).max(99).default(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const { productId, materialId, quantity } = parsed.data

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        slug: true,
        priceEur: true,
        imagePath: true,
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
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const storedConfig = await getStoredProductVariationConfig(product.id)
    const configMap = new Map(storedConfig ? [[product.id, storedConfig]] : [])
    const materialsById = await getProductVariationMaterialsMap(
      collectProductVariationMaterialIds([{ id: product.id, materialId: product.materialId }], configMap),
    )
    const selection = resolveProductVariationSelection({
      productId: product.id,
      basePriceEUR: product.priceEur,
      productImagePath: product.imagePath ?? product.material?.imagePath ?? null,
      baseMaterialId: product.materialId,
      baseMaterial: product.material,
      storedConfig,
      materialsById,
      selectedMaterialId: materialId ?? null,
    }).selectedVariation

    const nextItem = normalizeCartItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: selection?.priceEUR ?? Number(product.priceEur),
      quantity,
      imagePath: selection?.images[0] ?? product.imagePath ?? product.material?.imagePath ?? null,
      materialId: selection?.materialId ?? product.materialId ?? null,
      materialName: selection?.materialName ?? product.material?.name ?? null,
    })

    const session = await getSession()
    const cart = normalizeCartItems(session.cart)

    const existingIdx = cart.findIndex((item) => item.cartItemId === nextItem.cartItemId)
    const nextCart = [...cart]

    if (existingIdx >= 0) {
      nextCart[existingIdx] = {
        ...nextCart[existingIdx],
        quantity: Math.min(nextCart[existingIdx].quantity + quantity, 99),
      }
    } else {
      nextCart.push(nextItem)
    }

    await assertCartInventoryAvailable(nextCart)

    session.cart = nextCart
    await session.save()

    const cartCount = nextCart.reduce((sum, item) => sum + item.quantity, 0)
    return NextResponse.json({ success: true, cartCount })
  } catch (err) {
    if (err instanceof InventoryError) {
      return NextResponse.json({ error: err.message }, { status: 409 })
    }

    console.error('[cart/add]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
