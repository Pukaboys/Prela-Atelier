import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/session'
import { buildCartItemId, normalizeCartItems } from '@/lib/cart'

const schema = z.object({
  cartItemId: z.string().min(1).optional(),
  productId: z.coerce.number().int().positive().optional(),
  materialId: z.coerce.number().int().positive().nullable().optional(),
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

    const session = await getSession()
    const targetCartItemId =
      parsed.data.cartItemId ??
      buildCartItemId(parsed.data.productId!, parsed.data.materialId ?? null)
    const cart = normalizeCartItems(session.cart).filter((item) => item.cartItemId !== targetCartItemId)
    session.cart = cart
    await session.save()

    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
    return NextResponse.json({ success: true, cartCount })
  } catch (err) {
    console.error('[cart/remove]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
