import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/session'
import { buildCartItemId, normalizeCartItems } from '@/lib/cart'
import { assertCartInventoryAvailable, InventoryError } from '@/server/services/inventory-service'

const schema = z.object({
  cartItemId: z.string().min(1).optional(),
  productId: z.coerce.number().int().positive().optional(),
  materialId: z.coerce.number().int().positive().nullable().optional(),
  quantity: z.coerce.number().int().min(1).max(99),
}).refine((value) => Boolean(value.cartItemId || value.productId), {
  message: 'Cart item identifier is required.',
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const { cartItemId, productId, materialId, quantity } = parsed.data

    const session = await getSession()
    const cart = normalizeCartItems(session.cart)
    const targetCartItemId = cartItemId ?? buildCartItemId(productId!, materialId ?? null)
    const idx = cart.findIndex((item) => item.cartItemId === targetCartItemId)
    let nextCart = cart

    if (idx >= 0) {
      nextCart = [...cart]
      nextCart[idx] = {
        ...nextCart[idx],
        quantity,
      }

      await assertCartInventoryAvailable(nextCart)

      session.cart = nextCart
      await session.save()
    }

    const cartCount = nextCart.reduce((sum, item) => sum + item.quantity, 0)
    return NextResponse.json({ success: true, cartCount })
  } catch (err) {
    if (err instanceof InventoryError) {
      return NextResponse.json({ error: err.message }, { status: 409 })
    }

    console.error('[cart/update]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
