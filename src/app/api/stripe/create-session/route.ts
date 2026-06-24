import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { stripe } from '@/lib/stripe'
import { buildOrderItemName, normalizeCartItems } from '@/lib/cart'
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
    const { shipping, discount } = await calculateOrderAmounts({
      country: form.country,
      cart,
      appliedPromo,
    })

    const rawUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const appUrl =
      rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
        ? rawUrl
        : `https://${rawUrl}`

    const lineItems: {
      price_data: {
        currency: string
        unit_amount: number
        product_data: { name: string }
      }
      quantity: number
    }[] = cart.map((item) => ({
      price_data: {
        currency: 'eur',
        unit_amount: Math.round(item.price * 100),
        product_data: { name: buildOrderItemName(item).slice(0, 127) },
      },
      quantity: item.quantity,
    }))

    if (shipping > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          unit_amount: Math.round(shipping * 100),
          product_data: { name: 'Shipping' },
        },
        quantity: 1,
      })
    }

    // Apply discount via a one-time Stripe coupon so the customer sees it on the checkout page
    let stripeDiscounts: { coupon: string }[] | undefined
    if (discount > 0 && appliedPromo) {
      const coupon = await stripe.coupons.create({
        amount_off: Math.round(discount * 100),
        currency: 'eur',
        duration: 'once',
        name: `Promo: ${appliedPromo.code}`,
        max_redemptions: 1,
      })
      stripeDiscounts = [{ coupon: coupon.id }]
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      customer_email: form.email,
      payment_method_types: ['card'],
      discounts: stripeDiscounts,
      success_url: `${appUrl}/api/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout`,
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
      payment_intent_data: {
        description: 'Prela Atelier Order',
        statement_descriptor: 'PRELA ATELIER',
      },
    })

    if (!checkoutSession.url) {
      throw new Error('Stripe did not return a checkout URL')
    }

    // Save form to session for fallback
    session.stripePendingForm = form
    await session.save()

    return NextResponse.json({ url: checkoutSession.url })
  } catch (err) {
    if (err instanceof InventoryError) {
      return NextResponse.json({ error: err.message }, { status: 409 })
    }

    console.error('[stripe/create-session]', err)
    return NextResponse.json({ error: 'Could not start payment. Please try again.' }, { status: 500 })
  }
}
