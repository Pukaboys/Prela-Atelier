import { NextRequest, NextResponse } from 'next/server'
import { buildOrderItemName, normalizeCartItems } from '@/lib/cart'
import { getSession } from '@/lib/session'
import { createPokOrder } from '@/lib/pokpay'
import { assertCartInventoryAvailable, InventoryError } from '@/server/services/inventory-service'
import { calculateOrderAmounts } from '@/server/services/order-service'
import { checkoutSchema } from '@/server/validations/order'

function getAppUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return rawUrl.startsWith('http://') || rawUrl.startsWith('https://') ? rawUrl : `https://${rawUrl}`
}

function getCountryCode(country: string) {
  const normalized = country.trim().toLowerCase()
  if (normalized === 'albania') return 'AL'
  if (normalized === 'france') return 'FR'
  if (normalized === 'germany') return 'DE'
  if (normalized === 'italy') return 'IT'
  if (normalized === 'united kingdom') return 'GB'
  if (normalized === 'united states') return 'US'
  return ''
}

function withCustomerPrefill(confirmUrl: string, form: { name: string; email: string; phone?: string; country: string; city: string; address: string; postcode: string }) {
  const [firstName, ...lastNameParts] = form.name.trim().split(/\s+/)
  const url = new URL(confirmUrl)
  url.searchParams.set('firstName', firstName || form.name)
  url.searchParams.set('lastName', lastNameParts.join(' '))
  url.searchParams.set('email', form.email)
  url.searchParams.set('phone', form.phone ?? '')
  url.searchParams.set('city', form.city)
  url.searchParams.set('address', form.address)
  url.searchParams.set('zip', form.postcode)
  url.searchParams.set('language', getCountryCode(form.country) === 'AL' ? 'AL' : 'EN')

  const countryCode = getCountryCode(form.country)
  if (countryCode) {
    url.searchParams.set('country', countryCode)
  }

  return url.toString()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = checkoutSchema.omit({ items: true, currency: true, promoCode: true }).safeParse(body)
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

    const form = parsed.data
    const { subtotal, shipping, discount, total } = await calculateOrderAmounts({
      country: form.country,
      cart,
      appliedPromo: session.appliedPromo,
    })
    const appUrl = getAppUrl()
    const merchantCustomReference = `PRELA-${Date.now()}`
    const { sdkOrder, confirmUrl } = await createPokOrder({
      amount: Number(Math.max(0, subtotal - discount).toFixed(2)),
      shippingCost: Number(shipping.toFixed(2)),
      currencyCode: 'EUR',
      description: 'Prela Atelier Order',
      redirectUrl: `${appUrl}/api/pokpay/success`,
      failRedirectUrl: `${appUrl}/checkout?error=payment_failed`,
      merchantCustomReference,
      products: discount > 0
        ? undefined
        : cart.map((item) => ({
            name: buildOrderItemName(item).slice(0, 120),
            quantity: item.quantity,
            price: Number(item.price.toFixed(2)),
          })),
    })

    session.pokpayPendingForm = form
    session.pokpayOrderId = sdkOrder.id
    await session.save()

    return NextResponse.json({
      url: withCustomerPrefill(confirmUrl, form),
      orderId: sdkOrder.id,
      subtotal,
      shipping,
      discount,
      total,
    })
  } catch (err) {
    if (err instanceof InventoryError) {
      return NextResponse.json({ error: err.message }, { status: 409 })
    }

    console.error('[pokpay/create-order]', err)
    return NextResponse.json({ error: 'Could not start POK payment. Please try again.' }, { status: 500 })
  }
}
