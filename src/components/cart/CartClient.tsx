'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { CartItem } from '@/types'
import {
  calculateShipping,
  formatPrice,
  productImageUrl,
  SHIPPING_FREE_THRESHOLD,
  type CurrencyFormatOptions,
} from '@/lib/helpers'
import { useLanguage } from '@/components/providers/LanguageProvider'

const COUNTRIES = [
  'Albania',
  'Austria',
  'Belgium',
  'Bosnia and Herzegovina',
  'Bulgaria',
  'Croatia',
  'Cyprus',
  'Czech Republic',
  'Denmark',
  'Estonia',
  'Finland',
  'France',
  'Germany',
  'Greece',
  'Hungary',
  'Ireland',
  'Italy',
  'Kosovo',
  'Latvia',
  'Lithuania',
  'Luxembourg',
  'Malta',
  'Montenegro',
  'Netherlands',
  'North Macedonia',
  'Norway',
  'Poland',
  'Portugal',
  'Romania',
  'Serbia',
  'Slovakia',
  'Slovenia',
  'Spain',
  'Sweden',
  'Switzerland',
  'United Kingdom',
  'United States',
  'Other',
]

const STORAGE_KEY = 'prela_country'

function CountryModal({ onSelect }: { onSelect: (country: string) => void }) {
  const [selected, setSelected] = useState('France')
  const { dictionary } = useLanguage()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-stone/60 backdrop-blur-sm" />

      <div className="relative bg-white border border-beige w-full max-w-md p-10 text-center shadow-xl">
        <div className="text-gold text-3xl mb-4">*</div>
        <p className="section-eyebrow mb-2">{dictionary.cart.shippingDestination}</p>
        <h2 className="font-serif text-2xl text-stone mb-3">{dictionary.cart.shippingQuestion}</h2>
        <p className="font-sans text-sm text-stone-mid mb-8 leading-relaxed">
          {dictionary.cart.shippingPrompt}
        </p>

        <select
          className="form-select mb-6 text-center"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {COUNTRIES.map((country) => (
            <option key={country} value={country}>{country}</option>
          ))}
        </select>

        <button
          className="btn-primary w-full"
          onClick={() => onSelect(selected)}
        >
          {dictionary.cart.continueToCart}
        </button>
      </div>
    </div>
  )
}

export function CartClient({
  initialCart,
  currencyOptions,
}: {
  initialCart: CartItem[]
  currencyOptions?: CurrencyFormatOptions
}) {
  const [cart, setCart] = useState<CartItem[]>(initialCart)
  const [updating, setUpdating] = useState<number | null>(null)
  const [country, setCountry] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()
  const { dictionary } = useLanguage()

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      setCountry(saved)
    } else {
      setShowModal(true)
    }
  }, [])

  function handleCountrySelect(nextCountry: string) {
    setCountry(nextCountry)
    localStorage.setItem(STORAGE_KEY, nextCountry)
    setShowModal(false)
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = calculateShipping(subtotal, country ?? 'France')
  const total = subtotal + shipping
  const money = (value: number) => formatPrice(value, currencyOptions)

  async function handleRemove(cartItemId: string, productId: number, materialId: number | null) {
    setUpdating(productId)
    try {
      const res = await fetch('/api/cart/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId, productId, materialId }),
      })
      if (res.ok) {
        setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId))
        router.refresh()
      }
    } finally {
      setUpdating(null)
    }
  }

  async function handleQtyChange(cartItemId: string, productId: number, materialId: number | null, newQty: number) {
    if (newQty < 1) return
    setUpdating(productId)
    try {
      const res = await fetch('/api/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId, productId, materialId, quantity: newQty }),
      })
      if (res.ok) {
        setCart((prev) =>
          prev.map((item) => (item.cartItemId === cartItemId ? { ...item, quantity: newQty } : item))
        )
        router.refresh()
      }
    } finally {
      setUpdating(null)
    }
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-cream pt-36 pb-24">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="section-eyebrow">{dictionary.cart.shopping}</p>
          <h1 className="font-serif text-5xl text-stone mb-6">{dictionary.cart.title}</h1>
          <div className="divider-gold mx-auto mb-10" />
          <p className="text-stone-mid font-sans mb-8">{dictionary.cart.empty}</p>
          <Link href="/collections" className="btn-primary">
            {dictionary.common.browseCollections}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      {showModal && <CountryModal onSelect={handleCountrySelect} />}

      <div className="min-h-screen bg-cream pt-36 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <p className="section-eyebrow">{dictionary.cart.shopping}</p>
          <h1 className="font-serif text-5xl text-stone mb-6">{dictionary.cart.title}</h1>
          <div className="divider-gold mb-12" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-0">
              <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b border-beige text-xs font-sans uppercase tracking-widest text-stone-pale">
                <div className="col-span-6">{dictionary.cart.product}</div>
                <div className="col-span-2 text-center">{dictionary.cart.price}</div>
                <div className="col-span-2 text-center">{dictionary.cart.qty}</div>
                <div className="col-span-2 text-right">{dictionary.common.total}</div>
              </div>

              {cart.map((item) => (
                <div
                  key={item.cartItemId}
                  className="grid grid-cols-12 gap-4 py-6 border-b border-beige items-center"
                >
                  <div className="col-span-12 md:col-span-6 flex gap-4 items-center">
                    <div className="relative w-20 h-20 flex-shrink-0 bg-beige-light overflow-hidden">
                      <Image
                        src={productImageUrl(item.imagePath)}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                    <div>
                      <Link
                        href={`/product/${item.slug}`}
                        className="font-serif text-base text-stone hover:text-gold transition-colors"
                      >
                        {item.name}
                      </Link>
                      {item.materialName ? (
                        <p className="text-[11px] font-sans uppercase tracking-[0.18em] text-stone-pale mt-1">
                          {item.materialName}
                        </p>
                      ) : null}
                      <button
                        onClick={() => handleRemove(item.cartItemId, item.productId, item.materialId)}
                        disabled={updating === item.productId}
                        className="block text-xs font-sans text-stone-pale hover:text-red-500 transition-colors mt-1 disabled:opacity-50"
                      >
                        {dictionary.common.remove}
                      </button>
                    </div>
                  </div>

                  <div className="col-span-4 md:col-span-2 text-center font-sans text-stone text-sm">
                    {money(item.price)}
                  </div>

                  <div className="col-span-4 md:col-span-2 flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleQtyChange(item.cartItemId, item.productId, item.materialId, item.quantity - 1)}
                      disabled={item.quantity <= 1 || updating === item.productId}
                      className="w-7 h-7 flex items-center justify-center border border-beige text-stone hover:border-gold transition-colors disabled:opacity-40 font-sans text-sm"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={item.quantity}
                      onChange={(e) => {
                        const value = parseInt(e.target.value)
                        if (!Number.isNaN(value) && value >= 1) handleQtyChange(item.cartItemId, item.productId, item.materialId, value)
                      }}
                      className="w-10 text-center border border-beige text-stone text-sm font-sans py-1 focus:outline-none focus:border-gold"
                    />
                    <button
                      onClick={() => handleQtyChange(item.cartItemId, item.productId, item.materialId, item.quantity + 1)}
                      disabled={updating === item.productId}
                      className="w-7 h-7 flex items-center justify-center border border-beige text-stone hover:border-gold transition-colors disabled:opacity-40 font-sans text-sm"
                    >
                      +
                    </button>
                  </div>

                  <div className="col-span-4 md:col-span-2 text-right font-sans text-stone text-sm font-medium">
                    {money(item.price * item.quantity)}
                  </div>
                </div>
              ))}

              <div className="pt-6">
                <Link href="/collections" className="btn-ghost text-sm">
                  {dictionary.common.continueShopping}
                </Link>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white border border-beige p-8 sticky top-28">
                <h2 className="font-serif text-xl text-stone mb-6">{dictionary.common.orderSummary}</h2>

                <div className="space-y-3 font-sans text-sm">
                  <div className="flex justify-between text-stone-mid">
                    <span>{dictionary.common.subtotal}</span>
                    <span>{money(subtotal)}</span>
                  </div>

                  <div className="flex justify-between items-center text-stone-mid">
                    <span>{dictionary.cart.shipTo}</span>
                    <button
                      onClick={() => setShowModal(true)}
                      className="text-gold hover:underline font-sans text-sm flex items-center gap-1"
                    >
                      {country ?? '-'}
                    </button>
                  </div>

                  <div className="flex justify-between text-stone-mid">
                    <span>{dictionary.common.shipping}</span>
                    <span>
                      {shipping === 0 ? (
                        <span className="text-green-600">{dictionary.common.free}</span>
                      ) : (
                        money(shipping)
                      )}
                    </span>
                  </div>
                  {shipping > 0 && (
                    <p className="text-xs text-stone-pale">
                      {dictionary.cart.freeShippingOver(money(SHIPPING_FREE_THRESHOLD))}
                    </p>
                  )}
                  <div className="border-t border-beige pt-3 mt-3 flex justify-between text-stone font-medium text-base">
                    <span>{dictionary.common.total}</span>
                    <span>{money(total)}</span>
                  </div>
                </div>

                <div className="mt-8">
                  <Link href="/checkout" className="btn-primary w-full block text-center">
                    {dictionary.common.proceedToCheckout}
                  </Link>
                </div>

                <div className="mt-6 pt-6 border-t border-beige space-y-2">
                  <p className="text-xs font-sans text-stone-pale flex items-center gap-2">
                    <span className="text-gold">*</span> {dictionary.common.secureCheckout}
                  </p>
                  <p className="text-xs font-sans text-stone-pale flex items-center gap-2">
                    <span className="text-gold">*</span> {dictionary.cart.freeShippingOver(money(SHIPPING_FREE_THRESHOLD)).replace('.', '')}
                  </p>
                  <p className="text-xs font-sans text-stone-pale flex items-center gap-2">
                    <span className="text-gold">*</span> {dictionary.common.certificateOfAuthenticity}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
