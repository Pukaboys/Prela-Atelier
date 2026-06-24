import type { Metadata } from 'next'
import Link from 'next/link'
import prisma from '@/lib/db'
import { formatPrice } from '@/lib/helpers'
import { PurchaseTracker } from '@/components/analytics/PurchaseTracker'
import { getDisplayCurrencyOptions } from '@/server/services/currency-service'
import { getCurrentLanguage } from '@/server/services/language-service'
import { getPublicPageCopy } from '@/lib/public-page-copy'

export const metadata: Metadata = { title: 'Order Confirmed - Prela Atelier' }
export const dynamic = 'force-dynamic'

interface Props { searchParams: Promise<{ order?: string }> }

export default async function OrderConfirmedPage({ searchParams }: Props) {
  const { order: orderCode } = await searchParams
  const [currencyOptions, language] = await Promise.all([getDisplayCurrencyOptions(), getCurrentLanguage()])
  const copy = getPublicPageCopy(language).orderConfirmed

  type OrderRow = { id: number; orderCode: string; customerName: string; customerEmail: string; shipping: number; total: number }
  type ItemRow = { id: number; name: string; quantity: number; subtotal: number }
  let order: OrderRow | null = null
  let items: ItemRow[] = []

  if (orderCode) {
    const raw = await prisma.order.findFirst({
      where: { orderCode },
      select: { id: true, orderCode: true, customerName: true, customerEmail: true, shipping: true, total: true },
    })
    if (raw) {
      order = { ...raw, shipping: Number(raw.shipping), total: Number(raw.total) }
      const rawItems = await prisma.orderItem.findMany({
        where: { orderId: raw.id },
        select: { id: true, name: true, quantity: true, subtotal: true },
      })
      items = rawItems.map((item) => ({ ...item, subtotal: Number(item.subtotal) }))
    }
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="font-serif text-3xl text-stone mb-4">{copy.notFound}</h1>
          <Link href="/" className="btn-primary">{copy.returnHome}</Link>
        </div>
      </div>
    )
  }

  const firstName = order.customerName.split(' ')[0]

  return (
    <div className="min-h-screen bg-cream pt-32 pb-24 px-6">
      <PurchaseTracker orderCode={order.orderCode} total={order.total} shipping={order.shipping} items={items} />
      <div className="max-w-xl mx-auto text-center">
        <div className="text-gold text-5xl mb-6">*</div>
        <h1 className="font-serif text-4xl text-stone mb-3">{copy.thankYou(firstName)}</h1>
        <p className="text-stone-mid font-sans mb-10">
          {copy.preparing}
        </p>

        <div className="bg-white border border-beige p-8 mb-8">
          <p className="section-eyebrow">{copy.orderReference}</p>
          <p className="font-serif text-3xl text-stone mt-2 tracking-wider">{order.orderCode}</p>
          <p className="text-stone-mid text-sm font-sans mt-3">
            {copy.confirmationSent(order.customerEmail)}
          </p>
        </div>

        <div className="bg-white border border-beige p-8 text-left mb-8">
          <h2 className="font-serif text-xl text-stone mb-6">{copy.orderSummary}</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm font-sans">
                <span className="text-stone">{item.name} x {item.quantity}</span>
                <span className="text-stone">{formatPrice(Number(item.subtotal), currencyOptions)}</span>
              </div>
            ))}
            <div className="border-t border-beige pt-3 mt-3">
              <div className="flex justify-between text-sm font-sans text-stone-mid">
                <span>{copy.shipping}</span>
                <span>{Number(order.shipping) === 0 ? copy.free : formatPrice(Number(order.shipping), currencyOptions)}</span>
              </div>
              <div className="flex justify-between font-sans text-stone font-medium mt-2">
                <span>{copy.total}</span>
                <span>{formatPrice(Number(order.total), currencyOptions)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href={`/track-order?order=${order.orderCode}`} className="btn-primary">{copy.trackYourOrder}</Link>
          <Link href="/collections" className="btn-outline">{copy.continueShopping}</Link>
        </div>
        <p className="text-xs text-stone-pale font-sans mt-6">
          {copy.trackAnytime}{' '}
          <Link href={`/track-order?order=${order.orderCode}`} className="text-gold hover:underline">{copy.trackingPage}</Link>.
        </p>
      </div>
    </div>
  )
}
