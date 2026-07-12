import { NextRequest, NextResponse } from 'next/server'
import { getCurrencyFormatOptions } from '@/lib/helpers'
import { sendNewOrderAlert, sendOrderConfirmation } from '@/lib/mailer'
import { retrievePokOrder } from '@/lib/pokpay'
import { getSession } from '@/lib/session'
import { getDisplayCurrencyOptions } from '@/server/services/currency-service'
import {
  getBespokePaymentLink,
  markBespokePaymentLinkPaid,
} from '@/server/services/bespoke-payment-link-service'
import { createConfirmedCustomOrder } from '@/server/services/order-service'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    const token = session.bespokePaymentToken
    const form = session.bespokePaymentForm
    const pokOrderId = session.bespokePaymentPokOrderId

    if (!token || !form || !pokOrderId) {
      return NextResponse.redirect(new URL('/checkout?error=payment_missing', request.url))
    }

    const link = await getBespokePaymentLink(token)
    if (!link) {
      return NextResponse.redirect(new URL('/checkout?error=payment_missing', request.url))
    }

    if (link.status === 'paid' && link.orderCode) {
      session.bespokePaymentToken = undefined
      session.bespokePaymentForm = undefined
      session.bespokePaymentPokOrderId = undefined
      await session.save()
      return NextResponse.redirect(new URL(`/order-confirmed?order=${link.orderCode}`, request.url))
    }

    const pokOrder = await retrievePokOrder(pokOrderId)
    if (!pokOrder.isCompleted || pokOrder.isCanceled || pokOrder.isRefunded) {
      return NextResponse.redirect(new URL(`/custom-payment/${token}?error=payment_failed`, request.url))
    }

    const paidTotal = Number(pokOrder.finalAmount ?? 0)
    if (Math.abs(paidTotal - link.amountEur) > 0.01 || pokOrder.currencyCode !== 'EUR') {
      console.error('[bespoke-payment/success] amount mismatch', {
        token,
        pokOrderId,
        paidTotal,
        expectedTotal: link.amountEur,
        currency: pokOrder.currencyCode,
      })
      return NextResponse.redirect(new URL(`/custom-payment/${token}?error=payment_mismatch`, request.url))
    }

    const order = await createConfirmedCustomOrder({
      form,
      title: link.title,
      description: link.description,
      amountEur: link.amountEur,
      paymentReference: `bespoke:${token}:${pokOrderId}`,
    })

    await markBespokePaymentLinkPaid(token, { orderCode: order.orderCode, pokOrderId })

    session.bespokePaymentToken = undefined
    session.bespokePaymentForm = undefined
    session.bespokePaymentPokOrderId = undefined
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
    console.error('[bespoke-payment/success]', err)
    return NextResponse.redirect(new URL('/checkout?error=server_error', request.url))
  }
}
