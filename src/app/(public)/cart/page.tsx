import type { Metadata } from 'next'
import { normalizeCartItems } from '@/lib/cart'
import { getSession } from '@/lib/session'
import { CartClient } from '@/components/cart/CartClient'
import { ProductRecommendations } from '@/components/recommendations/ProductRecommendations'
import { getDisplayCurrencyOptions } from '@/server/services/currency-service'
import { getCurrentLanguage } from '@/server/services/language-service'
import { getProductRecommendations } from '@/server/services/recommendation-service'

export const metadata: Metadata = { title: 'Your Cart - Prela Atelier' }
export const dynamic = 'force-dynamic'

export default async function CartPage() {
  const [session, currencyOptions, language] = await Promise.all([getSession(), getDisplayCurrencyOptions(), getCurrentLanguage()])
  const cart = normalizeCartItems(session.cart)
  const recommendations = await getProductRecommendations({
    viewedProductIds: session.viewedProductIds,
    cartItems: cart,
    limit: 4,
  })

  return (
    <>
      <CartClient initialCart={cart} currencyOptions={currencyOptions} />
      <ProductRecommendations
        recommendations={recommendations}
        currencyOptions={currencyOptions}
        language={language}
        className="bg-cream border-t border-beige"
      />
    </>
  )
}
