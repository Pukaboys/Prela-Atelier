'use client'
import { useEffect, useState, useCallback } from 'react'
import { formatPrice, type CurrencyFormatOptions } from '@/lib/helpers'

interface Client {
  name: string
  email: string
  phone: string | null
  address: string | null
  city: string | null
  postcode: string | null
  country: string | null
  totalSpent: number
  orderCount: number
  orderCodes: string[]
  sources: string[]
  lastSeen: string
}

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  order:   { label: 'Order',   color: 'bg-green-100 text-green-800' },
  contact: { label: 'Contact', color: 'bg-blue-100 text-blue-800' },
  bespoke: { label: 'Bespoke', color: 'bg-gold/20 text-stone' },
}

type EditForm = {
  email: string; name: string; phone: string; address: string
  city: string; postcode: string; country: string
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [form, setForm] = useState<EditForm>({ email: '', name: '', phone: '', address: '', city: '', postcode: '', country: '' })
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [currencyOptions, setCurrencyOptions] = useState<CurrencyFormatOptions>()

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/clients')
    if (res.ok) setClients(await res.json())
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

  function openEdit(client: Client) {
    setEditingClient(client)
    setForm({ email: client.email, name: client.name, phone: client.phone ?? '', address: client.address ?? '', city: client.city ?? '', postcode: client.postcode ?? '', country: client.country ?? '' })
    setSaveMsg(null)
  }

  async function saveEdit() {
    if (!editingClient) return
    setSaving(true)
    setSaveMsg(null)
    const res = await fetch(`/api/admin/clients/${encodeURIComponent(editingClient.email)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.email, name: form.name, phone: form.phone || null, address: form.address, city: form.city, postcode: form.postcode, country: form.country }),
    })
    if (res.ok) {
      setSaveMsg('Saved')
      setClients((prev) => prev.map((c) => c.email === editingClient.email
        ? { ...c, email: form.email, name: form.name, phone: form.phone || null, address: form.address || null, city: form.city || null, postcode: form.postcode || null, country: form.country || null }
        : c
      ))
      setTimeout(() => setEditingClient(null), 800)
    } else {
      setSaveMsg('Error saving')
    }
    setSaving(false)
  }

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-stone">Clients</h1>
          <p className="text-sm text-stone-mid font-sans mt-1">
            {loading ? 'Loading…' : `${clients.length} unique clients — aggregated from orders, contact messages, and bespoke enquiries.`}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <input
            type="search"
            className="form-input text-sm w-56"
            placeholder="Search clients…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <a href="/api/admin/clients/export" className="inline-flex items-center gap-2 btn-primary text-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export CSV
          </a>
        </div>
      </div>

      {!loading && clients.length === 0 ? (
        <div className="bg-white border border-beige p-12 text-center">
          <p className="font-sans text-stone-mid">No clients yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())).map((client) => (
            <div key={client.email} className="bg-white border border-beige p-6">
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">

                {/* Left */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="font-serif text-lg text-stone">{client.name}</h2>
                    <div className="flex gap-1.5 flex-wrap">
                      {client.sources.map(s => (
                        <span key={s} className={`text-[10px] font-sans uppercase tracking-widest px-2 py-0.5 rounded-full ${SOURCE_LABELS[s]?.color ?? 'bg-beige text-stone'}`}>
                          {SOURCE_LABELS[s]?.label ?? s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <a href={`mailto:${client.email}`} className="text-gold hover:underline font-sans text-sm mt-1 block">{client.email}</a>
                  {client.phone && <p className="font-sans text-sm text-stone-mid mt-0.5">{client.phone}</p>}
                </div>

                {/* Middle: address */}
                <div className="lg:w-56">
                  {client.address ? (
                    <div className="font-sans text-sm text-stone-mid leading-relaxed">
                      <p className="text-[10px] uppercase tracking-widest text-stone-pale mb-1">Address</p>
                      <p>{client.address}</p>
                      <p>{client.city}{client.postcode ? `, ${client.postcode}` : ''}</p>
                      <p>{client.country}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-stone-pale font-sans italic">No address on file</p>
                  )}
                </div>

                {/* Right: stats + edit */}
                <div className="lg:w-48 text-right shrink-0">
                  {client.orderCount > 0 ? (
                    <>
                      <p className="font-serif text-xl text-stone">{formatPrice(client.totalSpent, currencyOptions)}</p>
                      <p className="text-xs text-stone-mid font-sans mt-0.5">{client.orderCount} order{client.orderCount !== 1 ? 's' : ''}</p>
                    </>
                  ) : (
                    <p className="text-xs text-stone-pale font-sans italic">No purchases yet</p>
                  )}
                  <p className="text-[10px] text-stone-pale font-sans mt-2">
                    Last seen {new Date(client.lastSeen).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <button
                    onClick={() => openEdit(client)}
                    className="mt-3 text-[10px] font-sans uppercase tracking-widest text-stone-pale hover:text-gold border border-beige hover:border-gold px-3 py-1 transition-colors"
                  >
                    Edit
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone/70 px-4">
          <div className="bg-white w-full max-w-lg border border-beige shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-beige">
              <h2 className="font-serif text-lg text-stone">Edit Client</h2>
              <button onClick={() => setEditingClient(null)} className="text-stone-pale hover:text-stone text-xl leading-none">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="form-label">Email</label>
                  <input className="form-input mt-1" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="form-label">Name</label>
                  <input className="form-input mt-1" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="form-label">Phone</label>
                  <input className="form-input mt-1" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="form-label">Address</label>
                  <input className="form-input mt-1" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">City</label>
                  <input className="form-input mt-1" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Postcode</label>
                  <input className="form-input mt-1" value={form.postcode} onChange={(e) => setForm((f) => ({ ...f, postcode: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="form-label">Country</label>
                  <input className="form-input mt-1" value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                {saveMsg && <span className={`text-xs font-sans ${saveMsg === 'Saved' ? 'text-green-600' : 'text-red-500'}`}>{saveMsg}</span>}
                <button onClick={() => setEditingClient(null)} className="text-xs font-sans uppercase tracking-widest px-4 py-2 border border-beige text-stone-mid hover:border-stone hover:text-stone transition-colors">
                  Cancel
                </button>
                <button onClick={saveEdit} disabled={saving} className="text-xs font-sans uppercase tracking-widest px-4 py-2 bg-stone text-cream hover:bg-stone/90 transition-colors disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
