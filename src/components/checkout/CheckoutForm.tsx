'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { gtagEvent } from '@/lib/gtag'
import type { CartItem } from '@/types'
import {
  calculateShipping,
  formatPrice,
  productImageUrl,
  type CurrencyFormatOptions,
} from '@/lib/helpers'
import { useLanguage } from '@/components/providers/LanguageProvider'

const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
  'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bolivia', 'Bosnia and Herzegovina',
  'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Cambodia', 'Cameroon', 'Canada', 'Chile', 'China', 'Colombia', 'Costa Rica',
  'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Estonia',
  'Ethiopia', 'Fiji', 'Finland', 'France', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Guatemala', 'Hungary', 'Iceland', 'India',
  'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kuwait',
  'Latvia', 'Lebanon', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Malaysia', 'Maldives', 'Malta', 'Mexico',
  'Moldova', 'Monaco', 'Montenegro', 'Morocco', 'Myanmar', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Nigeria',
  'Norway', 'Oman', 'Pakistan', 'Panama', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania',
  'Russia', 'Rwanda', 'Saudi Arabia', 'Senegal', 'Serbia', 'Singapore', 'Slovakia', 'Slovenia', 'Somalia', 'South Africa',
  'South Korea', 'Spain', 'Sri Lanka', 'Sudan', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tanzania', 'Thailand',
  'Tunisia', 'Turkey', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay',
  'Uzbekistan', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe',
]

interface Props {
  cart: CartItem[]
  subtotal: number
  currencyOptions?: CurrencyFormatOptions
}

interface FormState {
  name: string
  email: string
  phone: string
  address: string
  city: string
  postcode: string
  country: string
  notes: string
}

export function CheckoutForm({ cart, subtotal, currencyOptions }: Props) {
  const { dictionary } = useLanguage()

  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postcode: '',
    country: 'France',
    notes: '',
  })

  useEffect(() => {
    const savedCountry = localStorage.getItem('prela_country') ?? 'France'
    setForm((prev) => ({ ...prev, country: savedCountry }))
    gtagEvent('begin_checkout', {
      currency: 'EUR',
      value: subtotal,
      items: cart.map((item) => ({
        item_id: String(item.productId),
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)
  const [promoInput, setPromoInput] = useState('')
  const [promoApplied, setPromoApplied] = useState<{ code: string; discount: number } | null>(null)
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoError, setPromoError] = useState('')

  const shipping = calculateShipping(subtotal, form.country)
  const discount = promoApplied?.discount ?? 0
  const total = Math.max(0, subtotal + shipping - discount)
  const money = (value: number) => formatPrice(value, currencyOptions)

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function validate(): string | null {
    if (!form.name.trim()) return dictionary.checkout.validationName
    if (!form.email.trim() || !form.email.includes('@')) return dictionary.checkout.validationEmail
    if (!form.address.trim()) return dictionary.checkout.validationAddress
    if (!form.city.trim()) return dictionary.checkout.validationCity
    if (!form.postcode.trim()) return dictionary.checkout.validationPostcode
    return null
  }

  async function handleStartCardPayment() {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setError('')
    setProcessing(true)
    try {
      const res = await fetch('/api/card-payments/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json() as { redirectUrl?: string; error?: string }
      if (!res.ok) {
        setError(data.error ?? dictionary.checkout.failedToPlaceOrder)
        return
      }
      if (!data.redirectUrl) {
        setError(dictionary.checkout.failedToPlaceOrder)
        return
      }
      window.location.href = data.redirectUrl
    } catch {
      setError(dictionary.checkout.networkError)
    } finally {
      setProcessing(false)
    }
  }

  async function handleApplyPromo() {
    if (!promoInput.trim()) return
    setPromoLoading(true)
    setPromoError('')
    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoInput.trim(), subtotal }),
      })
      const data = await res.json() as { code?: string; discount?: number; error?: string }
      if (!res.ok) {
        setPromoError(data.error ?? dictionary.checkout.invalidPromo)
        return
      }
      setPromoApplied({ code: data.code!, discount: data.discount! })
      setPromoInput('')
    } catch {
      setPromoError(dictionary.checkout.promoValidationFailed)
    } finally {
      setPromoLoading(false)
    }
  }

  async function handleRemovePromo() {
    try {
      await fetch('/api/promo/remove', { method: 'POST' })
    } catch {
      // ignore
    }
    setPromoApplied(null)
    setPromoError('')
  }

  const inputClass = 'form-input'
  const labelClass = 'form-label'

  return (
    <div className="min-h-screen bg-cream pt-36 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        <p className="section-eyebrow">{dictionary.checkout.purchase}</p>
        <h1 className="font-serif text-5xl text-stone mb-6">{dictionary.checkout.title}</h1>
        <div className="divider-gold mb-12" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <h2 className="font-serif text-2xl text-stone mb-8">{dictionary.checkout.deliveryDetails}</h2>

            <div className="space-y-5">
              <div>
                <label className={labelClass}>{dictionary.checkout.fullName}</label>
                <input type="text" className={inputClass} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="John Doe" required />
              </div>
              <div>
                <label className={labelClass}>{dictionary.checkout.emailAddress}</label>
                <input type="email" className={inputClass} value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="your@email.com" required />
              </div>
              <div>
                <label className={labelClass}>{dictionary.checkout.phone}</label>
                <input type="tel" className={inputClass} value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+44 7700 000000" />
              </div>
              <div>
                <label className={labelClass}>{dictionary.checkout.streetAddress}</label>
                <input type="text" className={inputClass} value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="123 Example Street" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{dictionary.checkout.city}</label>
                  <input type="text" className={inputClass} value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="London" required />
                </div>
                <div>
                  <label className={labelClass}>{dictionary.checkout.postcode}</label>
                  <input type="text" className={inputClass} value={form.postcode} onChange={(e) => set('postcode', e.target.value)} placeholder="SW1A 1AA" required />
                </div>
              </div>
              <div>
                <label className={labelClass}>{dictionary.checkout.country}</label>
                <select className="form-select" value={form.country} onChange={(e) => set('country', e.target.value)}>
                  {COUNTRIES.map((country) => <option key={country} value={country}>{country}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>{dictionary.checkout.orderNotes} <span className="text-stone-pale">{dictionary.checkout.optional}</span></label>
                <textarea className="form-textarea" rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Any special instructions or requests..." />
              </div>

              <div>
                <label className={labelClass}>{dictionary.checkout.promoCode} <span className="text-stone-pale">{dictionary.checkout.optional}</span></label>
                {promoApplied ? (
                  <div className="flex items-center gap-3 mt-1">
                    <span className="font-sans text-sm text-green-700 font-medium">
                      {promoApplied.code} - {money(promoApplied.discount)}
                    </span>
                    <button type="button" onClick={handleRemovePromo} className="text-xs font-sans text-stone-pale hover:text-red-500 transition-colors underline">{dictionary.checkout.remove}</button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        className="form-input flex-1"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                        placeholder="ENTER CODE"
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                      />
                      <button type="button" onClick={handleApplyPromo} disabled={promoLoading || !promoInput.trim()} className="btn-outline px-4 text-sm disabled:opacity-50">
                        {promoLoading ? '...' : dictionary.checkout.apply}
                      </button>
                    </div>
                    {promoError && <p className="text-xs text-red-600 mt-1 font-sans">{promoError}</p>}
                  </>
                )}
              </div>
            </div>

            {error && <div className="flash-error mt-6">{error}</div>}

            <div className="mt-10">
              <h2 className="font-serif text-2xl text-stone mb-6">{dictionary.checkout.payment}</h2>

              <button
                onClick={handleStartCardPayment}
                disabled={processing}
                className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {processing ? dictionary.checkout.preparingPayment : dictionary.checkout.payWithCard}
              </button>
            </div>
          </div>

          <div>
            <div className="bg-white border border-beige p-8 sticky top-28">
              <h2 className="font-serif text-xl text-stone mb-6">{dictionary.common.orderSummary}</h2>

              <div className="space-y-4 mb-6">
                {cart.map((item) => (
                  <div key={item.cartItemId} className="flex items-center gap-4">
                    <div className="relative w-14 h-14 flex-shrink-0 bg-beige-light overflow-hidden">
                      <Image src={productImageUrl(item.imagePath)} alt={item.name} fill className="object-cover" sizes="56px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-sm text-stone truncate">{item.name}</p>
                      {item.materialName ? (
                        <p className="font-sans text-[11px] uppercase tracking-[0.18em] text-stone-pale mt-1 truncate">
                          {item.materialName}
                        </p>
                      ) : null}
                      <p className="font-sans text-xs text-stone-pale">{dictionary.checkout.qtyValue(item.quantity)}</p>
                    </div>
                    <span className="font-sans text-sm text-stone whitespace-nowrap">{money(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-beige pt-4 space-y-2 font-sans text-sm">
                <div className="flex justify-between text-stone-mid">
                  <span>{dictionary.common.subtotal}</span><span>{money(subtotal)}</span>
                </div>
                <div className="flex justify-between text-stone-mid">
                  <span>{dictionary.common.shipping}</span>
                  <span>{shipping === 0 ? <span className="text-green-600">{dictionary.common.free}</span> : money(shipping)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Discount ({promoApplied?.code})</span>
                    <span>-{money(discount)}</span>
                  </div>
                )}
                <div className="border-t border-beige pt-2 mt-2 flex justify-between text-stone font-semibold text-base">
                  <span>{dictionary.common.total}</span><span>{money(total)}</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-beige space-y-2">
                <p className="text-xs font-sans text-stone-pale flex items-center gap-2"><span className="text-gold">*</span> {dictionary.checkout.sslCheckout}</p>
                <p className="text-xs font-sans text-stone-pale flex items-center gap-2"><span className="text-gold">*</span> {dictionary.checkout.deliveryWindow}</p>
                <p className="text-xs font-sans text-stone-pale flex items-center gap-2"><span className="text-gold">*</span> {dictionary.checkout.certificateIncluded}</p>
              </div>
            </div>

            <div className="mt-4 text-center">
              <Link href="/cart" className="text-sm font-sans text-stone-pale hover:text-stone transition-colors">{dictionary.checkout.backToCart}</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
