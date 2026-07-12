import { NextRequest, NextResponse } from 'next/server'
import { getCurrencyFormatOptions } from '@/lib/helpers'
import {
  sendBankTransferInstructions,
  sendNewOrderAlert,
} from '@/lib/mailer'
import { getSettings } from '@/lib/settings'
import { getDisplayCurrencyOptions } from '@/server/services/currency-service'
import {
  getBespokePaymentLink,
  markBespokePaymentLinkPending,
} from '@/server/services/bespoke-payment-link-service'
import { createPendingCustomOrder } from '@/server/services/order-service'
import { checkoutSchema } from '@/server/validations/order'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params
    const parsed = checkoutSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please check your payment details.' }, { status: 400 })
    }

    const [link, settings] = await Promise.all([getBespokePaymentLink(token), getSettings()])
    if (!link) {
      return NextResponse.json({ error: 'Payment link not found.' }, { status: 404 })
    }

    if (settings.bank_transfer_enabled === 'false') {
      return NextResponse.json({ error: 'Bank transfer is currently disabled.' }, { status: 403 })
    }

    if (link.status === 'pending' && link.orderCode) {
      return NextResponse.json({ success: true, orderCode: link.orderCode })
    }

    if (link.status !== 'open') {
      return NextResponse.json({ error: 'This payment link is no longer active.' }, { status: 409 })
    }

    const order = await createPendingCustomOrder({
      form: parsed.data,
      title: link.title,
      description: link.description,
      amountEur: link.amountEur,
      paymentReference: `bespoke-bank:${token}`,
    })

    await markBespokePaymentLinkPending(token, { orderCode: order.orderCode })

    const customerCurrencyOptions = await getDisplayCurrencyOptions(order.settings)
    const adminCurrencyOptions = getCurrencyFormatOptions(order.settings)

    if (order.created) {
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
          currencyOptions: customerCurrencyOptions,
        }),
        sendNewOrderAlert({
          customerName: parsed.data.name,
          customerEmail: parsed.data.email,
          orderCode: order.orderCode,
          items: order.emailItems,
          shipping: order.shipping,
          total: order.total,
          currencyOptions: adminCurrencyOptions,
        }),
      ])
    }

    return NextResponse.json({ success: true, orderCode: order.orderCode })
  } catch (err) {
    console.error('[bespoke-payment/bank-transfer]', err)
    return NextResponse.json({ error: 'Could not create bank transfer order.' }, { status: 500 })
  }
}
