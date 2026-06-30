import { NextRequest, NextResponse } from 'next/server'
import { normalizeCartItems } from '@/lib/cart'
import { getSession } from '@/lib/session'
import {
  sendBankTransferInstructions,
  sendNewOrderAlert,
} from '@/lib/mailer'
import { getDisplayCurrencyOptions } from '@/server/services/currency-service'
import { createPendingBankTransferOrder } from '@/server/services/order-service'
import { InventoryError } from '@/server/services/inventory-service'
import { checkoutSchema } from '@/server/validations/order'

export async function POST(request: NextRequest) {
  try {
    const parsed = checkoutSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please check your checkout details.' }, { status: 400 })
    }

    const session = await getSession()
    const cart = normalizeCartItems(session.cart)
    if (cart.length === 0) {
      return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 })
    }

    const order = await createPendingBankTransferOrder({
      form: parsed.data,
      cart,
      appliedPromo: session.appliedPromo,
    })
    const currencyOptions = await getDisplayCurrencyOptions(order.settings)

    session.cart = []
    session.appliedPromo = undefined
    await session.save()

    await Promise.allSettled([
      sendBankTransferInstructions({
        to: parsed.data.email,
        customerName: parsed.data.name,
        orderCode: order.orderCode,
        items: order.emailItems,
        shipping: order.shipping,
        total: order.total,
        bankAccountName: order.settings.bank_account_name,
        bankIban: order.settings.bank_iban,
        bankName: order.settings.bank_name,
        currencyOptions,
      }),
      sendNewOrderAlert({
        customerName: parsed.data.name,
        customerEmail: parsed.data.email,
        orderCode: order.orderCode,
        items: order.emailItems,
        shipping: order.shipping,
        total: order.total,
        currencyOptions,
      }),
    ])

    return NextResponse.json({
      success: true,
      orderCode: order.orderCode,
      total: order.total,
      currency: currencyOptions.currency,
    })
  } catch (err) {
    if (err instanceof InventoryError) {
      return NextResponse.json({ error: err.message, issues: err.issues }, { status: 409 })
    }
    console.error('[checkout]', err)
    return NextResponse.json({ error: 'Failed to place order.' }, { status: 500 })
  }
}
