import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { normalizeCartItems } from '@/lib/cart'
import { getSession } from '@/lib/session'
import { getCurrencyFormatOptions } from '@/lib/helpers'
import { capturePayPalOrder } from '@/lib/paypal'
import { sendNewOrderAlert, sendOrderConfirmation } from '@/lib/mailer'
import { getDisplayCurrencyOptions } from '@/server/services/currency-service'
import { InventoryError } from '@/server/services/inventory-service'
import { createConfirmedOrder } from '@/server/services/order-service'

const schema = z.object({ orderId: z.string().min(1) })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
    }

    const session = await getSession()
    const cart = normalizeCartItems(session.cart)
    if (cart.length === 0) {
      return NextResponse.json({ error: 'Cart is empty.' }, { status: 400 })
    }

    const form = session.pendingOrder
    if (!form) {
      return NextResponse.json({ error: 'Order details missing.' }, { status: 400 })
    }

    // Capture with PayPal
    const capture = await capturePayPalOrder(parsed.data.orderId)
    if (capture.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Payment not completed.' }, { status: 402 })
    }

    const order = await createConfirmedOrder({
      form,
      cart,
      appliedPromo: session.appliedPromo,
    })

    // Clear session
    session.cart = []
    session.appliedPromo = undefined
    session.pendingOrder = undefined
    await session.save()

    const customerCurrencyOptions = await getDisplayCurrencyOptions(order.settings)
    const adminCurrencyOptions = getCurrencyFormatOptions(order.settings)

    await Promise.allSettled([
      sendOrderConfirmation({
        to: form.email,
        customerName: form.name,
        orderCode: order.orderCode,
        items: order.emailItems,
        shipping: order.shipping,
        total: order.total,
        currencyOptions: customerCurrencyOptions,
      }),
      sendNewOrderAlert({
        customerName: form.name,
        customerEmail: form.email,
        orderCode: order.orderCode,
        items: order.emailItems,
        shipping: order.shipping,
        total: order.total,
        currencyOptions: adminCurrencyOptions,
      }),
    ])

    return NextResponse.json({ success: true, orderCode: order.orderCode })
  } catch (err) {
    if (err instanceof InventoryError) {
      return NextResponse.json({ error: err.message }, { status: 409 })
    }

    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[paypal/capture-order]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
