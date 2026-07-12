'use client'

import { useState } from 'react'
import { formatPrice } from '@/lib/helpers'

type Props = {
  token: string
  title: string
  description: string
  amountEur: number
  customerName: string
  customerEmail: string
  pokpayEnabled: boolean
  bankTransferEnabled: boolean
}

export function CustomPaymentForm({
  token,
  title,
  description,
  amountEur,
  customerName,
  customerEmail,
  pokpayEnabled,
  bankTransferEnabled,
}: Props) {
  const [form, setForm] = useState({
    name: customerName,
    email: customerEmail,
    phone: '',
    address: '',
    city: '',
    postcode: '',
    country: 'Albania',
    notes: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState<'pok' | 'bank' | null>(null)

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function validateForm() {
    if (!form.name.trim() || !form.email.includes('@') || !form.address.trim() || !form.city.trim() || !form.postcode.trim()) {
      setError('Please complete your contact and shipping details.')
      return false
    }

    return true
  }

  async function startPayment() {
    if (!validateForm()) return

    setLoading('pok')
    setError('')
    try {
      const res = await fetch(`/api/bespoke-payment/${token}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Could not start payment.')
        return
      }
      window.location.href = data.url
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  async function startBankTransfer() {
    if (!validateForm()) return

    setLoading('bank')
    setError('')
    try {
      const res = await fetch(`/api/bespoke-payment/${token}/bank-transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json() as { orderCode?: string; error?: string }
      if (!res.ok || !data.orderCode) {
        setError(data.error ?? 'Could not create bank transfer order.')
        return
      }
      window.location.href = `/order-confirmed?order=${encodeURIComponent(data.orderCode)}`
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-cream pt-36 pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        <p className="section-eyebrow">Private Payment Link</p>
        <h1 className="font-serif text-5xl text-stone mt-4">{title}</h1>
        {description ? (
          <p className="font-sans text-stone-mid mt-4 leading-relaxed">{description}</p>
        ) : null}

        <div className="bg-white border border-beige p-8 mt-10">
          <div className="flex items-center justify-between border-b border-beige pb-5 mb-6">
            <span className="font-sans text-sm uppercase tracking-[0.2em] text-stone-pale">Total</span>
            <span className="font-serif text-3xl text-stone">{formatPrice(amountEur)}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Full Name *</label>
              <input className="form-input mt-1" value={form.name} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Email *</label>
              <input className="form-input mt-1" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Phone</label>
              <input className="form-input mt-1" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Country *</label>
              <input className="form-input mt-1" value={form.country} onChange={(e) => set('country', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="form-label">Street Address *</label>
              <input className="form-input mt-1" value={form.address} onChange={(e) => set('address', e.target.value)} />
            </div>
            <div>
              <label className="form-label">City *</label>
              <input className="form-input mt-1" value={form.city} onChange={(e) => set('city', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Postcode *</label>
              <input className="form-input mt-1" value={form.postcode} onChange={(e) => set('postcode', e.target.value)} />
            </div>
          </div>

          {error && <div className="flash-error mt-6">{error}</div>}

          {(pokpayEnabled || bankTransferEnabled) ? (
            <div className="mt-8 space-y-3">
              {pokpayEnabled ? (
                <button
                  onClick={startPayment}
                  disabled={loading !== null}
                  className="btn-primary w-full disabled:opacity-60"
                >
                  {loading === 'pok' ? 'Redirecting to POK...' : 'Pay with POK'}
                </button>
              ) : null}
              {bankTransferEnabled ? (
                <button
                  onClick={startBankTransfer}
                  disabled={loading !== null}
                  className="btn-ghost w-full disabled:opacity-60"
                >
                  {loading === 'bank' ? 'Creating bank transfer order...' : 'Pay by Bank Transfer'}
                </button>
              ) : null}
            </div>
          ) : (
            <div className="flash-error mt-8">Payment methods are temporarily unavailable.</div>
          )}
          <p className="text-xs font-sans text-stone-pale text-center mt-3">
            This private link can be used once. After online payment or bank transfer order creation it will close automatically.
          </p>
        </div>
      </div>
    </div>
  )
}
