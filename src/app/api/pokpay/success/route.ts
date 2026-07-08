import { NextRequest, NextResponse } from 'next/server'
import { normalizeCartItems } from '@/lib/cart'
import { getCurrencyFormatOptions } from '@/lib/helpers'
import { sendNewOrderAlert, sendOrderConfirmation } from '@/lib/mailer'
import { retrievePokOrder } from '@/lib/pokpay'
import { getSession } from '@/lib/session'
import { getDisplayCurrencyOptions } from '@/server/services/currency-service'
import { InventoryError } from '@/server/services/inventory-service'
import { calculateOrderAmounts, createConfirmedOrder } from '@/server/services/order-service'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    const pokOrderId = request.nextUrl.searchParams.get('pok_order_id') ?? session.pokpayOrderId
    const form = session.pokpayPendingForm

    if (!pokOrderId || !form) {
      return NextResponse.redirect(new URL('/checkout?error=payment_missing', request.url))
    }

    const pokOrder = await retrievePokOrder(pokOrderId)
    if (!pokOrder.isCompleted || pokOrder.isCanceled || pokOrder.isRefunded) {
      return NextResponse.redirect(new URL('/checkout?error=payment_failed', request.url))
    }

    const cart = normalizeCartItems(session.cart)
    if (cart.length === 0) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    const expected = await calculateOrderAmounts({
      country: form.country,
      cart,
      appliedPromo: session.appliedPromo,
    })
    const paidTotal = Number(pokOrder.finalAmount ?? 0)
    if (Math.abs(paidTotal - expected.total) > 0.01 || pokOrder.currencyCode !== 'EUR') {
      console.error('[pokpay/success] amount mismatch', {
        pokOrderId,
        paidTotal,
        expectedTotal: expected.total,
        currency: pokOrder.currencyCode,
      })
      return NextResponse.redirect(new URL('/checkout?error=payment_mismatch', request.url))
    }

    const order = await createConfirmedOrder({
      form,
      cart,
      appliedPromo: session.appliedPromo,
      paymentReference: `pokpay:${pokOrderId}`,
    })

    session.cart = []
    session.pokpayPendingForm = undefined
    session.pokpayOrderId = undefined
    session.appliedPromo = undefined
    await session.save()

    const customerCurrencyOptions = await getDisplayCurrencyOptions(order.settings)
    const adminCurrencyOptions = getCurrencyFormatOptions(order.settings)

    if (order.created) {
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
    }

    return NextResponse.redirect(new URL(`/order-confirmed?order=${order.orderCode}`, request.url))
  } catch (err) {
    if (err instanceof InventoryError) {
      return NextResponse.redirect(new URL('/checkout?error=stock_unavailable', request.url))
    }

    console.error('[pokpay/success]', err)
    return NextResponse.redirect(new URL('/checkout?error=server_error', request.url))
  }
}
