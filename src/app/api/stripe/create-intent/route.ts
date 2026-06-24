import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { stripe } from '@/lib/stripe'
import { normalizeCartItems } from '@/lib/cart'
import { getSession } from '@/lib/session'
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? 'Invalid form data'
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const session = await getSession()
    const cart = normalizeCartItems(session.cart)
    if (cart.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    await assertCartInventoryAvailable(cart)

    const form = parsed.data
    const appliedPromo = session.appliedPromo
    const { total, discount } = await calculateOrderAmounts({
      country: form.country,
      cart,
      appliedPromo,
    })

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100),
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
      receipt_email: form.email,
      metadata: {
        name: form.name,
        email: form.email,
        phone: form.phone ?? '',
        address: form.address,
        city: form.city,
        postcode: form.postcode,
        country: form.country,
        notes: form.notes ?? '',
        promoCode: appliedPromo?.code ?? '',
        promoDiscount: String(discount),
      },
    })

    // Save form to session so confirm-intent can read it if needed
    session.stripePendingForm = form
    await session.save()

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (err) {
    if (err instanceof InventoryError) {
      return NextResponse.json({ error: err.message }, { status: 409 })
    }

    console.error('[stripe/create-intent]', err)
    const msg =
      err instanceof Error ? err.message : 'Could not start payment. Please try again.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
