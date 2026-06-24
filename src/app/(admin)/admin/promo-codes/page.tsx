'use client'
import { useEffect, useState, useCallback } from 'react'
import { formatPrice, type CurrencyFormatOptions } from '@/lib/helpers'

type PromoCode = {
  id: number
  code: string
  type: 'percentage' | 'fixed'
  value: number
  minOrder: number
  maxUses: number | null
  usedCount: number
  expiresAt: string | null
  active: boolean
  createdAt: string
}

const EMPTY_FORM = {
  code: '',
  type: 'percentage' as 'percentage' | 'fixed',
  value: '',
  minOrder: '0',
  maxUses: '',
  expiresAt: '',
  active: true,
}

export default function AdminPromoCodesPage() {
  const [codes, setCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PromoCode | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [currencyOptions, setCurrencyOptions] = useState<CurrencyFormatOptions>()

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/promo-codes')
    if (res.ok) setCodes(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    fetch('/api/settings/currency')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data) setCurrencyOptions(data)
      })
      .catch(() => {
        // Fall back to EUR formatting if currency settings cannot be loaded.
      })
  }, [])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError('')
    setModalOpen(true)
  }

  function openEdit(p: PromoCode) {
    setEditing(p)
    setForm({
      code: p.code,
      type: p.type,
      value: String(p.value),
      minOrder: String(p.minOrder),
      maxUses: p.maxUses != null ? String(p.maxUses) : '',
      expiresAt: p.expiresAt ? p.expiresAt.slice(0, 16) : '',
      active: p.active,
    })
    setError('')
    setModalOpen(true)
  }

  function set<K extends keyof typeof EMPTY_FORM>(field: K, value: typeof EMPTY_FORM[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const value = parseFloat(form.value)
    if (!form.code.trim() || isNaN(value) || value <= 0) {
      setError('Code and value are required.')
      return
    }
    setSaving(true)
    const payload = {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value,
      minOrder: parseFloat(form.minOrder) || 0,
      maxUses: form.maxUses ? parseInt(form.maxUses) : null,
      expiresAt: form.expiresAt || null,
      active: form.active,
    }
    const url = editing ? `/api/admin/promo-codes/${editing.id}` : '/api/admin/promo-codes'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(typeof data.error === 'string' ? data.error : 'Failed to save promo code.')
    } else {
      setModalOpen(false)
      load()
    }
    setSaving(false)
  }

  async function handleToggle(p: PromoCode) {
    await fetch(`/api/admin/promo-codes/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !p.active }),
    })
    load()
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/admin/promo-codes/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setDeleteId(null)
      load()
    }
  }

  function formatValue(p: PromoCode) {
    return p.type === 'percentage' ? `${p.value}%` : formatPrice(p.value, currencyOptions)
  }

  function formatExpiry(p: PromoCode) {
    if (!p.expiresAt) return '—'
    return new Date(p.expiresAt).toLocaleDateString('en-GB')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-stone">Promo Codes</h1>
          <p className="text-stone-mid text-sm font-sans mt-1">Create and manage discount codes.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="search"
            className="form-input text-sm w-56"
            placeholder="Search codes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button onClick={openCreate} className="btn-primary text-sm px-5 py-2.5">
            + New Code
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-stone-mid font-sans text-sm">Loading…</p>
      ) : codes.length === 0 ? (
        <div className="bg-white border border-beige p-12 text-center">
          <p className="font-sans text-stone-mid text-sm">No promo codes yet.</p>
          <button onClick={openCreate} className="btn-ghost mt-4 text-sm">
            Create your first code
          </button>
        </div>
      ) : (
        <div className="bg-white border border-beige overflow-hidden">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Min Order</th>
                  <th>Uses</th>
                  <th>Expires</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {codes.filter(p => !search || p.code.toLowerCase().includes(search.toLowerCase())).map((p) => (
                  <tr key={p.id}>
                    <td className="font-mono font-semibold text-stone">{p.code}</td>
                    <td className="text-xs text-stone-mid capitalize">{p.type}</td>
                    <td className="font-sans text-stone">{formatValue(p)}</td>
                    <td className="text-xs text-stone-mid">
                      {Number(p.minOrder) > 0 ? formatPrice(p.minOrder, currencyOptions) : '—'}
                    </td>
                    <td className="text-xs text-stone-mid">
                      {p.usedCount}{p.maxUses != null ? ` / ${p.maxUses}` : ''}
                    </td>
                    <td className="text-xs text-stone-mid">{formatExpiry(p)}</td>
                    <td>
                      <button
                        onClick={() => handleToggle(p)}
                        className={`text-xs font-sans uppercase tracking-wider ${p.active ? 'text-green-600' : 'text-stone-pale'}`}
                      >
                        {p.active ? 'Active' : 'Off'}
                      </button>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openEdit(p)}
                          className="text-xs text-gold hover:text-gold-dark font-sans uppercase tracking-wider"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteId(p.id)}
                          className="text-xs text-red-500 hover:text-red-700 font-sans uppercase tracking-wider"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone/70 px-4">
          <div className="bg-white w-full max-w-md max-h-[90vh] overflow-y-auto border border-beige shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-beige">
              <h2 className="font-serif text-xl text-stone">
                {editing ? 'Edit Promo Code' : 'New Promo Code'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-stone-pale hover:text-stone text-xl leading-none">×</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="form-label">Code *</label>
                <input
                  className="form-input font-mono uppercase"
                  value={form.code}
                  onChange={(e) => set('code', e.target.value.toUpperCase())}
                  placeholder="SAVE10"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Type *</label>
                  <select
                    className="form-select"
                    value={form.type}
                    onChange={(e) => set('type', e.target.value as 'percentage' | 'fixed')}
                  >
                    <option value="percentage">% Percentage</option>
                    <option value="fixed">€ Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">
                    Value * {form.type === 'percentage' ? '(%)' : '(€)'}
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    max={form.type === 'percentage' ? '100' : undefined}
                    className="form-input"
                    value={form.value}
                    onChange={(e) => set('value', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Min Order (€)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-input"
                    value={form.minOrder}
                    onChange={(e) => set('minOrder', e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Max Uses <span className="text-stone-pale">(blank = unlimited)</span></label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    className="form-input"
                    value={form.maxUses}
                    onChange={(e) => set('maxUses', e.target.value)}
                    placeholder="∞"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Expires At <span className="text-stone-pale">(optional)</span></label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={form.expiresAt}
                  onChange={(e) => set('expiresAt', e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="promo-active"
                  checked={form.active}
                  onChange={(e) => set('active', e.target.checked)}
                  className="w-4 h-4 accent-gold"
                />
                <label htmlFor="promo-active" className="form-label mb-0 cursor-pointer">Active</label>
              </div>

              {error && <div className="flash-error">{error}</div>}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1 disabled:opacity-60"
                >
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Code'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-ghost flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone/70 px-4">
          <div className="bg-white border border-beige p-8 max-w-sm w-full shadow-xl text-center">
            <p className="font-serif text-xl text-stone mb-3">Delete this promo code?</p>
            <p className="font-sans text-sm text-stone-mid mb-6">This action cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => handleDelete(deleteId)}
                className="bg-red-600 text-white text-sm font-sans uppercase tracking-widest px-5 py-2 hover:bg-red-700"
              >
                Delete
              </button>
              <button onClick={() => setDeleteId(null)} className="btn-ghost text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
