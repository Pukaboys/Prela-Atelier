import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { normalizeCartItems } from '@/lib/cart'
import { getSession } from '@/lib/session'
import { hasVisaClickToPayConfig, visaRequest } from '@/lib/visa'
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

    const { total } = await calculateOrderAmounts({
      country: parsed.data.country,
      cart,
      appliedPromo: session.appliedPromo,
    })

    if (!hasVisaClickToPayConfig()) {
      return NextResponse.json(
        {
          error:
            'Visa sandbox is almost ready. Add the Visa API key, shared secret, certificate, and private key in Vercel, then redeploy.',
          amount: total,
          currency: 'EUR',
        },
        { status: 501 },
      )
    }

    const apiKey = process.env.VISA_API_KEY!
    const srcClientId = process.env.VISA_SRC_CLIENT_ID || apiKey
    const phoneDigits = parsed.data.phone.replace(/\D/g, '')
    const consumerIdentity = phoneDigits.length >= 4
      ? {
          identityType: 'MOBILE_PHONE_NUMBER',
          identityValue: phoneDigits,
        }
      : {
          identityType: 'EMAIL_ADDRESS',
          identityValue: parsed.data.email,
        }
    const identityLookup = await visaRequest<{
      consumerPresent1?: boolean
      consumerStatus?: string
      reason?: string
      message?: string
      status?: string
      errorDetail?: Array<{
        reason?: string
        message?: string
        source?: string
        sourceType?: string
      }>
    }>({
      resourcePath: '/src/v1/identities/lookup',
      body: {
        srcClientId,
        consumerIdentity,
      },
    })

    if (identityLookup.status < 200 || identityLookup.status >= 300) {
      const detail = identityLookup.body?.errorDetail?.[0]
      const detailText = [
        identityLookup.body?.reason,
        detail?.reason,
        detail?.source,
        detail?.message,
      ].filter(Boolean).join(' - ')
      const authHint =
        identityLookup.status === 401 && !detailText
          ? 'Visa returned 401 without details. Verify that VISA_SHARED_SECRET is the decrypted X-Pay shared secret, not the encrypted value copied from Visa, and that VISA_API_KEY and VISA_SHARED_SECRET belong to the same active X-Pay credential.'
          : ''

      return NextResponse.json(
        {
          error: [
            identityLookup.body?.message ?? 'Visa sandbox rejected the Click to Pay identity lookup.',
            detailText,
            authHint,
          ].filter(Boolean).join(' '),
          visaStatus: identityLookup.status,
          visaReason: identityLookup.body?.reason,
          visaMessage: identityLookup.body?.message,
          visaErrorDetail: identityLookup.body?.errorDetail ?? [],
          amount: total,
          currency: 'EUR',
        },
        { status: 502 },
      )
    }

    return NextResponse.json({
      message: identityLookup.body.consumerPresent1
        ? 'Visa sandbox connection works. This customer appears to have a Click to Pay profile.'
        : 'Visa sandbox connection works. This customer does not appear to have a Click to Pay profile yet.',
      visaStatus: identityLookup.status,
      consumerPresent: Boolean(identityLookup.body.consumerPresent1),
      consumerStatus: identityLookup.body.consumerStatus ?? null,
      amount: total,
      currency: 'EUR',
    })
  } catch (err) {
    if (err instanceof InventoryError) {
      return NextResponse.json({ error: err.message }, { status: 409 })
    }

    console.error('[card-payments/create-session]', err)
    return NextResponse.json({ error: 'Could not start payment. Please try again.' }, { status: 500 })
  }
}
