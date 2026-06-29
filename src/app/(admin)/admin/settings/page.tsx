'use client'
import { useEffect, useState, useCallback } from 'react'

type LoginEntry = { ip: string; ua: string; at: string }
type Settings = Record<string, string>

type Section = {
  title: string
  description: string
  fields: {
    key: string
    label: string
    placeholder?: string
    type?: 'text' | 'number' | 'email' | 'tel' | 'select'
    options?: { label: string; value: string }[]
    hint?: string
  }[]
}

const BANNER_PRESETS = [
  { label: 'Stone', bg: '#1a1713', text: '#faf8f4' },
  { label: 'Gold', bg: '#b08d57', text: '#faf8f4' },
  { label: 'Beige', bg: '#e9dcc6', text: '#1a1713' },
  { label: 'Cream', bg: '#faf8f4', text: '#1a1713' },
  { label: 'Black', bg: '#000000', text: '#ffffff' },
  { label: 'White', bg: '#ffffff', text: '#1a1713' },
]

const SECTIONS: Section[] = [
  {
    title: 'Shipping',
    description: 'Configure shipping rates and free shipping threshold.',
    fields: [
      { key: 'shipping_free_threshold', label: 'Free Shipping Threshold (€)', type: 'number', placeholder: '500', hint: 'Orders at or above this amount get free shipping.' },
      { key: 'shipping_eu_rate', label: 'Europe / West Shipping Rate (€)', type: 'number', placeholder: '95' },
      { key: 'shipping_intl_rate', label: 'International / Other Shipping Rate (€)', type: 'number', placeholder: '45' },
    ],
  },
  {
    title: 'Contact Information',
    description: 'Contact details shown on the Contact page and in emails.',
    fields: [
      { key: 'contact_email', label: 'Contact Email', type: 'email', placeholder: 'hello@prela-atelier.com' },
      { key: 'contact_whatsapp', label: 'WhatsApp Number (digits only)', type: 'tel', placeholder: '355696786451', hint: 'Used in the wa.me link. Digits only, no spaces or +.' },
      { key: 'contact_whatsapp_display', label: 'WhatsApp Display Text', placeholder: '+355 69 678 6451', hint: 'How the number is shown on the contact page.' },
      { key: 'contact_studio', label: 'Studio Location', placeholder: 'Laç, Albania' },
      { key: 'contact_hours_days', label: 'Business Days', placeholder: 'Monday–Friday' },
      { key: 'contact_hours_time', label: 'Business Hours', placeholder: '09:00–17:00 CET' },
    ],
  },
  {
    title: 'Store',
    description: 'General store information used across the site.',
    fields: [
      { key: 'store_description', label: 'Store Description (footer)', placeholder: 'Handcrafted marble accessories…', hint: 'Shown in the footer and email signatures.' },
      { key: 'response_days', label: 'Response Time (business days)', type: 'number', placeholder: '2', hint: 'Used in contact and bespoke confirmation messages.' },
    ],
  },
  {
    title: 'Currency',
    description: 'Choose how prices are displayed. Product prices, orders, and payments remain stored in EUR.',
    fields: [
      {
        key: 'display_currency',
        label: 'Display Currency',
        type: 'select',
        options: [
          { label: 'Euro (EUR)', value: 'EUR' },
          { label: 'US Dollar (USD)', value: 'USD' },
          { label: 'British Pound (GBP)', value: 'GBP' },
        ],
        hint: 'This controls storefront and admin price display only.',
      },
      { key: 'currency_usd_rate', label: 'USD rate for 1 EUR', type: 'number', placeholder: '1.09', hint: 'Example: 1 EUR = 1.09 USD.' },
      { key: 'currency_gbp_rate', label: 'GBP rate for 1 EUR', type: 'number', placeholder: '0.86', hint: 'Example: 1 EUR = 0.86 GBP.' },
    ],
  },
  {
    title: 'Custom Orders',
    description: 'Configure the bespoke quote calculator used on the public commission form.',
    fields: [
      {
        key: 'custom_order_production_multiplier',
        label: 'Production Cost Multiplier',
        type: 'number',
        placeholder: '0.65',
        hint: 'Estimated production cost = material cost × this multiplier.',
      },
    ],
  },
]

type AdminAccount = {
  username: string
  email: string
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>({})
  const [account, setAccount] = useState<AdminAccount>({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmCode, setConfirmCode] = useState('')
  const [awaitingConfirm, setAwaitingConfirm] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [loginActivity, setLoginActivity] = useState<LoginEntry[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    const [settingsRes, accountRes, activityRes] = await Promise.all([
      fetch('/api/admin/settings'),
      fetch('/api/admin/account'),
      fetch('/api/admin/login-activity'),
    ])
    if (settingsRes.ok) setSettings(await settingsRes.json())
    if (accountRes.ok) {
      const data = await accountRes.json()
      setAccount(prev => ({ ...prev, username: data.username ?? '', email: data.email ?? '' }))
    }
    if (activityRes.ok) setLoginActivity(await activityRes.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function handleSettingChange(key: string, value: string) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  function handleAccountChange(key: keyof AdminAccount, value: string) {
    setAccount(prev => ({ ...prev, [key]: value }))
  }

  async function handleSaveAll() {
    setError(null)

    if (account.newPassword || account.confirmPassword) {
      if (account.newPassword !== account.confirmPassword) {
        setError('New passwords do not match.')
        return
      }
      if (account.newPassword.length < 8) {
        setError('New password must be at least 8 characters.')
        return
      }
      if (!account.currentPassword) {
        setError('Current password is required to set a new password.')
        return
      }
    }

    setSaving(true)

    try {
      const payload: Record<string, unknown> = {
        settings,
        username: account.username,
        email: account.email,
      }
      if (account.newPassword) {
        payload.currentPassword = account.currentPassword
        payload.newPassword = account.newPassword
      }

      const res = await fetch('/api/admin/settings/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Failed to save settings.')
        return
      }

      if (data.requiresConfirmation) {
        setAwaitingConfirm(true)
        return
      }

      // Saved immediately (no email configured)
      setAccount(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }))
      setSaved(true)
      setTimeout(() => setSaved(false), 4000)
    } finally {
      setSaving(false)
    }
  }

  async function handleConfirmCode() {
    setError(null)
    setConfirming(true)
    try {
      const res = await fetch('/api/admin/settings/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: confirmCode }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Invalid code.'); return }

      setAwaitingConfirm(false)
      setConfirmCode('')
      setAccount(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }))
      setSaved(true)
      setTimeout(() => setSaved(false), 4000)
    } finally {
      setConfirming(false)
    }
  }

  if (loading) {
    return <p className="text-stone-mid font-sans text-sm">Loading…</p>
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-stone">Settings</h1>
        <p className="text-stone-mid text-sm font-sans mt-1">
          Manage store configuration, shipping rates, contact details, and your admin account.
        </p>
      </div>

      {error && (
        <div className="flash-error mb-6">{error}</div>
      )}

      <div className="space-y-8">

        {/* Admin Details */}
        <div className="bg-white border border-beige">
          <div className="px-6 py-4 border-b border-beige">
            <h2 className="font-serif text-lg text-stone">Admin Details</h2>
            <p className="text-xs text-stone-mid font-sans mt-0.5">Your login credentials and notification email.</p>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-input mt-1"
                value={account.username}
                onChange={(e) => handleAccountChange('username', e.target.value)}
                autoComplete="username"
              />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input mt-1"
                value={account.email}
                onChange={(e) => handleAccountChange('email', e.target.value)}
                placeholder="admin@prela-atelier.com"
                autoComplete="email"
              />
              <p className="text-xs text-stone-pale font-sans mt-1">Used for all settings confirmations and admin notifications.</p>
            </div>
            <hr className="border-beige" />
            <div>
              <label className="form-label">Current Password</label>
              <input
                type="password"
                className="form-input mt-1"
                value={account.currentPassword}
                onChange={(e) => handleAccountChange('currentPassword', e.target.value)}
                placeholder="Required only when changing password"
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-input mt-1"
                value={account.newPassword}
                onChange={(e) => handleAccountChange('newPassword', e.target.value)}
                placeholder="Leave blank to keep current"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                className="form-input mt-1"
                value={account.confirmPassword}
                onChange={(e) => handleAccountChange('confirmPassword', e.target.value)}
                placeholder="Repeat new password"
                autoComplete="new-password"
              />
            </div>
            <hr className="border-beige" />
            <div className="flex items-center justify-between">
              <div>
                <p className="form-label">Reset All Sessions</p>
                <p className="text-xs text-stone-pale font-sans mt-0.5">Sign out all active admin sessions immediately. You will stay logged in.</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (!confirm('Sign out all other active sessions?')) return
                  await fetch('/api/admin/sessions', { method: 'DELETE' })
                }}
                className="btn-outline text-sm px-4 py-2 whitespace-nowrap"
              >
                Reset Sessions
              </button>
            </div>
          </div>
        </div>

        {/* Site Banner */}
        <div className="bg-white border border-beige">
          <div className="px-6 py-4 border-b border-beige">
            <h2 className="font-serif text-lg text-stone">Site Banner</h2>
            <p className="text-xs text-stone-mid font-sans mt-0.5">Show an announcement bar at the top of every page.</p>
          </div>
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <label className="form-label">Enable Banner</label>
                <p className="text-xs text-stone-pale font-sans mt-0.5">Visitors can dismiss it — it won't reappear until the text changes.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.banner_enabled === 'true'}
                onClick={() => handleSettingChange('banner_enabled', settings.banner_enabled === 'true' ? 'false' : 'true')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.banner_enabled === 'true' ? 'bg-stone' : 'bg-beige-dark'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.banner_enabled === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="form-label">Pin Banner (Important)</label>
                <p className="text-xs text-stone-pale font-sans mt-0.5">Visitors cannot dismiss a pinned banner. It ignores previous dismissals and stays visible.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.banner_pinned === 'true'}
                onClick={() => handleSettingChange('banner_pinned', settings.banner_pinned === 'true' ? 'false' : 'true')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.banner_pinned === 'true' ? 'bg-stone' : 'bg-beige-dark'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.banner_pinned === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div>
              <label className="form-label">Banner Text</label>
              <input
                type="text"
                className="form-input mt-1"
                value={settings.banner_text ?? ''}
                placeholder="Free shipping on orders over €500 · New collection arriving soon"
                onChange={(e) => handleSettingChange('banner_text', e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Colour</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {BANNER_PRESETS.map((preset) => {
                  const active = settings.banner_bg === preset.bg
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        handleSettingChange('banner_bg', preset.bg)
                        handleSettingChange('banner_text_color', preset.text)
                      }}
                      title={preset.label}
                      className={`h-8 px-3 rounded font-sans text-xs transition-all ${active ? 'ring-2 ring-offset-2 ring-stone scale-105' : 'opacity-80 hover:opacity-100'}`}
                      style={{ backgroundColor: preset.bg, color: preset.text }}
                    >
                      {preset.label}
                    </button>
                  )
                })}
              </div>
              {settings.banner_text && (
                <div
                  className={`mt-4 text-center py-2.5 text-sm font-sans relative ${settings.banner_pinned === 'true' ? 'px-6' : 'px-10'}`}
                  style={{ backgroundColor: settings.banner_bg ?? '#1a1713', color: settings.banner_text_color ?? '#faf8f4' }}
                >
                  {settings.banner_text}
                  {settings.banner_pinned !== 'true' && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40 text-lg leading-none">×</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Store Sections */}
        {SECTIONS.map((section) => (
          <div key={section.title} className="bg-white border border-beige">
            <div className="px-6 py-4 border-b border-beige">
              <h2 className="font-serif text-lg text-stone">{section.title}</h2>
              <p className="text-xs text-stone-mid font-sans mt-0.5">{section.description}</p>
            </div>
            <div className="p-6 space-y-5">
              {section.fields.map((field) => (
                <div key={field.key}>
                  <label className="form-label">{field.label}</label>
                  {field.type === 'select' ? (
                    <select
                      className="form-select mt-1"
                      value={settings[field.key] ?? field.options?.[0]?.value ?? ''}
                      onChange={(e) => handleSettingChange(field.key, e.target.value)}
                    >
                      {field.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type ?? 'text'}
                      className="form-input mt-1"
                      value={settings[field.key] ?? ''}
                      placeholder={field.placeholder}
                      onChange={(e) => handleSettingChange(field.key, e.target.value)}
                    />
                  )}
                  {field.hint && (
                    <p className="text-xs text-stone-pale font-sans mt-1">{field.hint}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Login Activity */}
      <div className="bg-white border border-beige mt-8">
        <div className="px-6 py-4 border-b border-beige">
          <h2 className="font-serif text-lg text-stone">Login Activity</h2>
          <p className="text-xs text-stone-mid font-sans mt-0.5">Last 20 successful logins to the admin panel.</p>
        </div>
        <div className="divide-y divide-beige">
          {loginActivity.length === 0 ? (
            <p className="px-6 py-4 text-sm font-sans text-stone-pale">No login activity recorded yet.</p>
          ) : loginActivity.map((entry, i) => {
            const date = new Date(entry.at)
            const browser = (entry.ua.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/)?.[0] ?? entry.ua.slice(0, 40)) || 'Unknown'
            return (
              <div key={i} className="px-6 py-3 flex items-center justify-between gap-4 text-sm font-sans">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-stone font-medium tabular-nums whitespace-nowrap">{entry.ip}</span>
                  <span className="text-stone-pale truncate">{browser}</span>
                </div>
                <span className="text-stone-pale text-xs whitespace-nowrap">
                  {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {' '}
                  {date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Single save button */}
      <div className="mt-8 pt-6 border-t border-beige flex items-center justify-between">
        <span className={`text-sm font-sans transition-opacity ${saved ? 'text-green-600 opacity-100' : 'opacity-0'}`}>
          All settings saved ✓
        </span>
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="btn-primary px-8 py-2.5 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save All Settings'}
        </button>
      </div>

      {/* Confirmation modal */}
      {awaitingConfirm && (
        <div className="fixed inset-0 bg-stone/60 flex items-center justify-center z-50 px-4">
          <div className="bg-white border border-beige w-full max-w-sm p-8">
            <h2 className="font-serif text-xl text-stone mb-2">Confirm changes</h2>
            <p className="text-sm text-stone-mid font-sans mb-6">
              A 6-digit confirmation code was sent to your admin email. Enter it below to apply all changes.
            </p>
            {error && <div className="flash-error mb-4">{error}</div>}
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              className="form-input text-center tracking-widest text-lg mb-4"
              placeholder="000000"
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, ''))}
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setAwaitingConfirm(false); setConfirmCode(''); setError(null) }}
                className="btn-secondary flex-1 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCode}
                disabled={confirming || confirmCode.length !== 6}
                className="btn-primary flex-1 py-2 text-sm disabled:opacity-60"
              >
                {confirming ? 'Verifying…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
