'use client'
import { useState } from 'react'

interface Props {
  responseDays: string
}

export function ContactForm({ responseDays }: Props) {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    setErrorMsg('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.ok) {
        setStatus('success')
        setForm({ name: '', email: '', subject: '', message: '' })
      } else {
        setErrorMsg(data.error ?? 'Something went wrong.')
        setStatus('error')
      }
    } catch {
      setErrorMsg('Something went wrong.')
      setStatus('error')
    }
  }

  return (
    <div>
      <p className="section-eyebrow">Send a Message</p>
      <h2 className="section-title">Write to Us</h2>
      <div className="divider-gold mb-8" />

      {status === 'success' ? (
        <div className="p-8 border border-beige bg-white text-center">
          <p className="font-serif text-2xl text-stone mb-2">Thank you</p>
          <p className="font-sans text-stone-mid text-sm">
            Your message has been received. We will get back to you within {responseDays} business day{Number(responseDays) !== 1 ? 's' : ''}.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Name <span className="text-gold">*</span></label>
              <input
                className="form-input mt-1"
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label">Email <span className="text-gold">*</span></label>
              <input
                className="form-input mt-1"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Subject</label>
            <input
              className="form-input mt-1"
              type="text"
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
            />
          </div>

          <div>
            <label className="form-label">Message <span className="text-gold">*</span></label>
            <textarea
              className="form-input mt-1 resize-none"
              rows={6}
              required
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            />
          </div>

          {status === 'error' && (
            <p className="text-sm font-sans text-red-600">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={status === 'sending'}
            className="btn-primary disabled:opacity-50"
          >
            {status === 'sending' ? 'Sending…' : 'Send Message'}
          </button>
        </form>
      )}
    </div>
  )
}
