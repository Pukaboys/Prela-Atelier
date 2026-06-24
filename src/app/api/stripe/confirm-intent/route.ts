import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { stripe } from '@/lib/stripe'
import { normalizeCartItems } from '@/lib/cart'
import { getSession } from '@/lib/session'
import { getCurrencyFormatOptions } from '@/lib/helpers'
import { sendOrderConfirmation, sendNewOrderAlert } from '@/lib/mailer'
import { getDisplayCurrencyOptions } from '@/server/services/currency-service'
import { InventoryError } from '@/server/services/inventory-service'
import { createConfirmedOrder } from '@/server/services/order-service'

async function createOrderFromPaymentIntent(paymentIntentId: string) {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

  if (paymentIntent.status !== 'succeeded') {
    throw new Error(`Payment not completed (status: ${paymentIntent.status})`)
  }

  const meta = paymentIntent.metadata ?? {}
  const session = await getSession()
  const cart = normalizeCartItems(session.cart)

  if (cart.length === 0) {
    // Already processed
    return null
  }

  const order = await createConfirmedOrder({
    form: {
      name: meta.name ?? 'Customer',
      email: meta.email ?? '',
      phone: meta.phone ?? '',
      address: meta.address ?? '',
      city: meta.city ?? '',
      postcode: meta.postcode ?? '',
      country: meta.country ?? 'France',
      notes: meta.notes ?? '',
    },
    cart,
    appliedPromo: session.appliedPromo,
  })

  session.cart = []
  session.stripePendingForm = undefined
  session.appliedPromo = undefined
  await session.save()

  const customerCurrencyOptions = await getDisplayCurrencyOptions(order.settings)
  const adminCurrencyOptions = getCurrencyFormatOptions(order.settings)

  await Promise.allSettled([
    sendOrderConfirmation({
      to: meta.email ?? '',
      customerName: meta.name ?? 'Customer',
      orderCode: order.orderCode,
      items: order.emailItems,
      shipping: order.shipping,
      total: order.total,
      currencyOptions: customerCurrencyOptions,
    }),
    sendNewOrderAlert({
      customerName: meta.name ?? 'Customer',
      customerEmail: meta.email ?? '',
      orderCode: order.orderCode,
      items: order.emailItems,
      shipping: order.shipping,
      total: order.total,
      currencyOptions: adminCurrencyOptions,
    }),
  ])

  return order.orderCode
}

// GET — handles 3D Secure redirect from Stripe
export async function GET(request: NextRequest) {
  const paymentIntentId = request.nextUrl.searchParams.get('payment_intent')
  const redirectStatus = request.nextUrl.searchParams.get('redirect_status')

  if (!paymentIntentId) {
    return NextResponse.redirect(new URL('/checkout', request.url))
  }

  if (redirectStatus !== 'succeeded') {
    return NextResponse.redirect(new URL('/checkout?error=payment_failed', request.url))
  }

  try {
    const orderCode = await createOrderFromPaymentIntent(paymentIntentId)
    if (!orderCode) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.redirect(new URL(`/order-confirmed?order=${orderCode}`, request.url))
  } catch (err) {
    if (err instanceof InventoryError) {
      return NextResponse.redirect(new URL('/checkout?error=stock_unavailable', request.url))
    }

    console.error('[stripe/confirm-intent GET]', err)
    return NextResponse.redirect(new URL('/checkout?error=server_error', request.url))
  }
}

// POST — handles direct success (no redirect needed, e.g. most cards)
const postSchema = z.object({
  paymentIntentId: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = postSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const orderCode = await createOrderFromPaymentIntent(parsed.data.paymentIntentId)
    if (!orderCode) {
      return NextResponse.json({ error: 'Order already processed' }, { status: 409 })
    }

    return NextResponse.json({ orderCode })
  } catch (err) {
    if (err instanceof InventoryError) {
      return NextResponse.json({ error: err.message }, { status: 409 })
    }

    console.error('[stripe/confirm-intent POST]', err)
    const message = err instanceof Error ? err.message : 'Order creation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
