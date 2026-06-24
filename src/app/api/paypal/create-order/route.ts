import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { normalizeCartItems } from '@/lib/cart'
import { getSession } from '@/lib/session'
import { createPayPalOrder } from '@/lib/paypal'
import { assertCartInventoryAvailable, InventoryError } from '@/server/services/inventory-service'
import { calculateOrderAmounts } from '@/server/services/order-service'

const schema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().max(255),
  phone: z.string().max(50).optional().default(''),
  address: z.string().min(1).max(500),
  city: z.string().min(1).max(100),
  postcode: z.string().min(1).max(20),
  country: z.string().min(1).max(100).default('France'),
  notes: z.string().max(1000).optional().default(''),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Invalid form data' }, { status: 400 })
    }

    const session = await getSession()
    const cart = normalizeCartItems(session.cart)
    if (cart.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    await assertCartInventoryAvailable(cart)

    const { total } = await calculateOrderAmounts({
      country: parsed.data.country,
      cart,
      appliedPromo: session.appliedPromo,
    })

    // Store form data in session for use during capture
    session.pendingOrder = parsed.data
    await session.save()

    const paypalOrderId = await createPayPalOrder(total)
    return NextResponse.json({ orderId: paypalOrderId })
  } catch (err) {
    if (err instanceof InventoryError) {
      return NextResponse.json({ error: err.message }, { status: 409 })
    }

    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[paypal/create-order]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
