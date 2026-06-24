import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { normalizeCartItems } from '@/lib/cart'
import { getSession } from '@/lib/session'
import { getCurrencyFormatOptions } from '@/lib/helpers'
import { sendOrderConfirmation, sendNewOrderAlert } from '@/lib/mailer'
import { getDisplayCurrencyOptions } from '@/server/services/currency-service'
import { InventoryError } from '@/server/services/inventory-service'
import { createConfirmedOrder } from '@/server/services/order-service'

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id')
  if (!sessionId) {
    return NextResponse.redirect(new URL('/checkout', request.url))
  }

  try {
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'],
    })

    if (stripeSession.payment_status !== 'paid') {
      return NextResponse.redirect(new URL('/checkout?error=payment_failed', request.url))
    }

    const meta = stripeSession.metadata ?? {}
    const session = await getSession()
    const cart = normalizeCartItems(session.cart)

    if (cart.length === 0) {
      return NextResponse.redirect(new URL('/', request.url))
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

    return NextResponse.redirect(new URL(`/order-confirmed?order=${order.orderCode}`, request.url))
  } catch (err) {
    if (err instanceof InventoryError) {
      return NextResponse.redirect(new URL('/checkout?error=stock_unavailable', request.url))
    }

    console.error('[stripe/success]', err)
    return NextResponse.redirect(new URL('/checkout?error=server_error', request.url))
  }
}
