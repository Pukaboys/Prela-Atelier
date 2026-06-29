import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { normalizeCartItems } from '@/lib/cart'
import { getSession } from '@/lib/session'
import { getSettings } from '@/lib/settings'
import { CheckoutForm } from '@/components/checkout/CheckoutForm'
import { getDisplayCurrencyOptions } from '@/server/services/currency-service'

export const metadata: Metadata = { title: 'Checkout - Prela Atelier' }
export const dynamic = 'force-dynamic'

export default async function CheckoutPage() {
  const [session, settings] = await Promise.all([getSession(), getSettings()])
  const currencyOptions = await getDisplayCurrencyOptions(settings)
  const cart = normalizeCartItems(session.cart)
  if (cart.length === 0) redirect('/cart')

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <CheckoutForm
      cart={cart}
      subtotal={subtotal}
      currencyOptions={currencyOptions}
    />
  )
}
