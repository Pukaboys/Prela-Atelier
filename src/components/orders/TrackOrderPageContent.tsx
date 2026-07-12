'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { formatPrice, type CurrencyFormatOptions } from '@/lib/helpers'
import {
  PRODUCTION_STAGES,
  type ProductionManagementSummary,
  type ProductionStage,
  getProductionStageIndex,
} from '@/lib/production-workflow'
import { useLanguage } from '@/components/providers/LanguageProvider'

const STATUS_STEPS = ['pending', 'confirmed', 'shipped'] as const

interface OrderResult {
  orderCode: string
  status: string
  productionStage: ProductionStage
  production: ProductionManagementSummary
  estimatedCompletionAt: string | null
  customerName: string
  address: string
  city: string
  postcode: string
  country: string
  subtotal: number
  shipping: number
  total: number
  notes: string | null
  createdAt: string
  items: { name: string; quantity: number; subtotal: number }[]
}

export default function TrackOrderPageContent() {
  const searchParams = useSearchParams()
  const { language, dictionary } = useLanguage()
  const [orderCode, setOrderCode] = useState(() => searchParams.get('order') ?? '')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [order, setOrder] = useState<OrderResult | null>(null)
  const [currencyOptions, setCurrencyOptions] = useState<CurrencyFormatOptions>()

  useEffect(() => {
    if (searchParams.get('order')) {
      document.getElementById('track-email')?.focus()
    }
  }, [searchParams])

  useEffect(() => {
    fetch('/api/display-currency')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data) setCurrencyOptions(data)
      })
      .catch(() => {
        // ignore
      })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!orderCode.trim() || !email.trim()) {
      setError(dictionary.trackOrder.enterBoth)
      return
    }
    setError('')
    setLoading(true)
    setOrder(null)
    try {
      const res = await fetch('/api/track-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderCode: orderCode.trim(), email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? dictionary.trackOrder.orderNotFound)
        return
      }
      setOrder(data.order)
    } catch {
      setError(dictionary.trackOrder.networkError)
    } finally {
      setLoading(false)
    }
  }

  const currentStatusIdx = order
    ? order.status === 'cancelled'
      ? -1
      : order.status === 'delivered'
        ? STATUS_STEPS.indexOf('shipped')
        : STATUS_STEPS.indexOf(order.status as typeof STATUS_STEPS[number])
    : -1
  const currentProductionStageIdx = order ? getProductionStageIndex(order.productionStage) : -1
  const locale = language === 'sq' ? 'sq-AL' : 'en-GB'
  const estimatedCompletionLabel =
    order?.estimatedCompletionAt
      ? new Date(order.estimatedCompletionAt).toLocaleDateString(locale, {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : null

  return (
    <div className="min-h-screen bg-cream pt-36 pb-24 px-6">
      <div className="max-w-xl mx-auto">
        <p className="section-eyebrow">{dictionary.trackOrder.delivery}</p>
        <h1 className="font-serif text-5xl text-stone mb-4">{dictionary.trackOrder.title}</h1>
        <div className="divider-gold mb-10" />

        <form onSubmit={handleSubmit} className="bg-white border border-beige p-8 mb-8">
          <div className="space-y-4">
            <div>
              <label className="form-label">{dictionary.trackOrder.orderCode}</label>
              <input
                type="text"
                className="form-input uppercase"
                value={orderCode}
                onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
                placeholder="PRL-XXXXXXXX"
                required
              />
            </div>
            <div>
              <label className="form-label">{dictionary.trackOrder.emailAddress}</label>
              <input
                id="track-email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          {error && <div className="flash-error mt-4">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-6 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? dictionary.trackOrder.searching : dictionary.trackOrder.search}
          </button>
        </form>

        {order && (
          <div className="space-y-6">
            <div className="bg-white border border-beige p-8">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="section-eyebrow">{dictionary.trackOrder.orderLabel}</p>
                  <p className="font-serif text-2xl text-stone tracking-wider">{order.orderCode}</p>
                </div>
                <span
                  className={`inline-block text-xs font-sans uppercase tracking-widest px-3 py-1 border ${
                    order.status === 'cancelled'
                      ? 'text-red-600 border-red-300 bg-red-50'
                      : 'text-gold border-gold bg-gold/5'
                  }`}
                >
                  {dictionary.trackOrder.statusLabels[(order.status === 'delivered' ? 'shipped' : order.status) as keyof typeof dictionary.trackOrder.statusLabels] ?? order.status}
                </span>
              </div>
              <p className="font-sans text-sm text-stone-mid">
                {dictionary.trackOrder.placedOn(new Date(order.createdAt).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }))}
              </p>
            </div>

            <div className="bg-white border border-beige p-8">
              <div className="flex items-center justify-between gap-4 mb-6">
                <h2 className="font-serif text-lg text-stone">{dictionary.trackOrder.productionProgress}</h2>
                <span className="text-xs font-sans uppercase tracking-[0.22em] text-gold">
                  {dictionary.trackOrder.productionStageLabels[order.productionStage]}
                </span>
              </div>
              {estimatedCompletionLabel ? (
                <div className="border border-beige bg-cream p-5 mb-6">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-stone-pale font-sans">
                    {dictionary.trackOrder.estimatedCompletion}
                  </p>
                  <p className="font-serif text-2xl text-stone mt-2">{estimatedCompletionLabel}</p>
                  <p className="text-sm font-sans text-stone-mid mt-2">
                    {dictionary.trackOrder.currentStageEstimate(
                      dictionary.trackOrder.productionStageLabels[order.productionStage],
                      order.production.estimatedStageDays,
                    )}
                  </p>
                </div>
              ) : null}
              <div className="h-2 bg-beige overflow-hidden mb-6">
                <div
                  className="h-full bg-gold transition-all duration-300"
                  style={{ width: `${((currentProductionStageIdx + 1) / PRODUCTION_STAGES.length) * 100}%` }}
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-6 gap-3">
                {PRODUCTION_STAGES.map((stage, idx) => {
                  const active = idx <= currentProductionStageIdx
                  return (
                    <div
                      key={stage}
                      className={`border px-4 py-4 min-h-[116px] text-center flex flex-col items-center justify-center ${
                        active ? 'border-gold bg-gold/5' : 'border-beige bg-white'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-sans border ${
                          active ? 'bg-gold border-gold text-cream' : 'border-beige text-stone-pale'
                        }`}
                      >
                        {active ? 'OK' : idx + 1}
                      </div>
                      <p
                        className={`text-[10px] sm:text-xs font-sans mt-3 uppercase tracking-[0.14em] leading-relaxed whitespace-normal break-words ${
                          active ? 'text-stone' : 'text-stone-pale'
                        }`}
                      >
                        {dictionary.trackOrder.productionStageLabels[stage]}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {order.status !== 'cancelled' ? (
              <div className="bg-white border border-beige p-8">
                <h2 className="font-serif text-lg text-stone mb-6">{dictionary.trackOrder.orderProgress}</h2>
                <div className="flex items-center">
                  {STATUS_STEPS.map((step, idx) => (
                    <div key={step} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-sans border-2 transition-colors ${
                            idx <= currentStatusIdx
                              ? 'bg-gold border-gold text-cream'
                              : 'bg-white border-beige text-stone-pale'
                          }`}
                        >
                          {idx <= currentStatusIdx ? 'OK' : idx + 1}
                        </div>
                        <p
                          className={`text-xs font-sans mt-2 text-center whitespace-nowrap ${
                            idx <= currentStatusIdx ? 'text-stone' : 'text-stone-pale'
                          }`}
                        >
                          {dictionary.trackOrder.statusLabels[step]}
                        </p>
                      </div>
                      {idx < STATUS_STEPS.length - 1 && (
                        <div
                          className={`flex-1 h-0.5 mx-1 mb-5 ${
                            idx < currentStatusIdx ? 'bg-gold' : 'bg-beige'
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 p-6 text-center">
                <p className="font-serif text-xl text-red-700 mb-2">{dictionary.trackOrder.cancelledTitle}</p>
                <p className="font-sans text-sm text-red-600">
                  {dictionary.trackOrder.cancelledText}
                </p>
              </div>
            )}

            <div className="bg-white border border-beige p-8">
              <h2 className="font-serif text-lg text-stone mb-4">{dictionary.trackOrder.deliveryAddress}</h2>
              <p className="font-sans text-sm text-stone-mid leading-relaxed">
                {order.customerName}<br />
                {order.address}<br />
                {order.city}, {order.postcode}<br />
                {order.country}
              </p>
              {order.notes ? (
                <p className="font-sans text-sm text-stone-mid leading-relaxed mt-4">
                  {dictionary.trackOrder.note}: {order.notes}
                </p>
              ) : null}
            </div>

            <div className="bg-white border border-beige p-8">
              <h2 className="font-serif text-lg text-stone mb-4">{dictionary.trackOrder.items}</h2>
              <div className="space-y-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm font-sans">
                    <span className="text-stone">{item.name} x {item.quantity}</span>
                    <span className="text-stone">{formatPrice(item.subtotal, currencyOptions)}</span>
                  </div>
                ))}
                <div className="border-t border-beige pt-3 mt-2">
                  <div className="flex justify-between text-sm font-sans text-stone-mid">
                    <span>{dictionary.common.shipping}</span>
                    <span>{order.shipping === 0 ? dictionary.common.free : formatPrice(order.shipping, currencyOptions)}</span>
                  </div>
                  <div className="flex justify-between font-sans text-stone font-medium mt-2">
                    <span>{dictionary.common.total}</span>
                    <span>{formatPrice(order.total, currencyOptions)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
