import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createPokOrder, PokPayApiError, PokPayConfigError } from '@/lib/pokpay'
import { getSession } from '@/lib/session'
import { getSettings } from '@/lib/settings'
import { getBespokePaymentLink } from '@/server/services/bespoke-payment-link-service'

const schema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().max(255),
  phone: z.string().max(50).optional().default(''),
  address: z.string().min(1).max(500),
  city: z.string().min(1).max(100),
  postcode: z.string().min(1).max(20),
  country: z.string().min(1).max(100).default('Albania'),
  notes: z.string().max(1000).optional().default(''),
})

function getAppUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return rawUrl.startsWith('http://') || rawUrl.startsWith('https://') ? rawUrl : `https://${rawUrl}`
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please complete your payment details.' }, { status: 400 })
  }

  try {
    const [link, settings] = await Promise.all([getBespokePaymentLink(token), getSettings()])
    if (!link || link.status !== 'open') {
      return NextResponse.json({ error: 'This payment link is no longer active.' }, { status: 410 })
    }
    if (settings.pokpay_enabled === 'false') {
      return NextResponse.json({ error: 'POK payments are currently disabled.' }, { status: 403 })
    }

    const appUrl = getAppUrl()
    const { sdkOrder, confirmUrl } = await createPokOrder({
      amount: link.amountEur,
      shippingCost: 0,
      currencyCode: 'EUR',
      description: link.title,
      redirectUrl: `${appUrl}/api/bespoke-payment/success`,
      failRedirectUrl: `${appUrl}/custom-payment/${token}?error=payment_failed`,
      merchantCustomReference: `BESPOKE-${token.slice(0, 10)}`,
      products: [{
        name: `Custom / Bespoke - ${link.title}`.slice(0, 120),
        quantity: 1,
        price: link.amountEur,
      }],
    })

    const session = await getSession()
    session.bespokePaymentToken = token
    session.bespokePaymentForm = parsed.data
    session.bespokePaymentPokOrderId = sdkOrder.id
    await session.save()

    return NextResponse.json({ url: confirmUrl })
  } catch (err) {
    if (err instanceof PokPayConfigError) {
      return NextResponse.json({ error: err.message }, { status: 503 })
    }
    if (err instanceof PokPayApiError) {
      console.error('[bespoke-payment/start] POK API error:', {
        message: err.message,
        status: err.status,
        details: err.details,
      })
      return NextResponse.json({ error: `POK payment could not be started: ${err.message}` }, { status: 502 })
    }
    console.error('[bespoke-payment/start]', err)
    return NextResponse.json({ error: 'Could not start payment.' }, { status: 500 })
  }
}
