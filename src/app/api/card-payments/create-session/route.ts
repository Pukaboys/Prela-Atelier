import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { normalizeCartItems } from '@/lib/cart'
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

function hasVisaSandboxConfig() {
  return Boolean(
    process.env.VISA_API_BASE_URL &&
      process.env.VISA_API_USERNAME &&
      (process.env.VISA_CLIENT_CERT_PEM || process.env.VISA_CLIENT_CERT_PATH) &&
      (process.env.VISA_CLIENT_KEY_PEM || process.env.VISA_CLIENT_KEY_PATH),
  )
}

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

    if (!hasVisaSandboxConfig()) {
      return NextResponse.json(
        {
          error:
            'Visa sandbox is almost ready. Add the Visa certificate, private key, and username in Vercel, then redeploy.',
          amount: total,
          currency: 'EUR',
        },
        { status: 501 },
      )
    }

    return NextResponse.json(
      {
        error:
          'Visa sandbox credentials are loaded. The checkout connection is waiting for the Click to Pay API endpoint details from Visa.',
        amount: total,
        currency: 'EUR',
      },
      { status: 501 },
    )
  } catch (err) {
    if (err instanceof InventoryError) {
      return NextResponse.json({ error: err.message }, { status: 409 })
    }

    console.error('[card-payments/create-session]', err)
    return NextResponse.json({ error: 'Could not start payment. Please try again.' }, { status: 500 })
  }
}
