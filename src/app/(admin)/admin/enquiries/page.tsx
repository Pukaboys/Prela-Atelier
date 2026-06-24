'use client'
import { useEffect, useState, useCallback } from 'react'

type Enquiry = {
  id: number
  name: string
  email: string
  type: string
  budget: string
  description: string
  timeline: string
  status: string
  notes: string
  createdAt: string
}

const ALL_STATUSES = ['new', 'read', 'replied', 'closed'] as const
type EnquiryStatus = typeof ALL_STATUSES[number]

const STATUS_COLORS: Record<EnquiryStatus, string> = {
  new: 'bg-gold/10 text-gold border border-gold/30 px-2 py-0.5 text-xs font-sans uppercase tracking-wider',
  read: 'bg-beige text-stone-mid border border-beige px-2 py-0.5 text-xs font-sans uppercase tracking-wider',
  replied: 'bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-xs font-sans uppercase tracking-wider',
  closed: 'bg-stone/10 text-stone-pale border border-stone/20 px-2 py-0.5 text-xs font-sans uppercase tracking-wider',
}

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Enquiry | null>(null)
  const [filterStatus, setFilterStatus] = useState<EnquiryStatus | ''>('')
  const [search, setSearch] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/enquiries')
    if (res.ok) setEnquiries(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openDetail(e: Enquiry) {
    setSelected(e)
    setNotes(e.notes ?? '')
    // Auto-mark as read if new
    if (e.status === 'new') {
      updateEnquiry(e.id, { status: 'read' })
    }
  }

  async function updateEnquiry(id: number, payload: { status?: EnquiryStatus; notes?: string }) {
    setSaving(true)
    const res = await fetch(`/api/admin/enquiries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      const updated = await res.json()
      setEnquiries((prev) => prev.map((e) => (e.id === id ? updated : e)))
      if (selected?.id === id) setSelected(updated)
    }
    setSaving(false)
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/admin/enquiries/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setDeleteId(null)
      setSelected(null)
      load()
    }
  }

  const q = search.toLowerCase()
  const filtered = enquiries.filter((e) =>
    (!filterStatus || e.status === filterStatus) &&
    (!q || e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q))
  )
  const newCount = enquiries.filter((e) => e.status === 'new').length

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-stone">Bespoke Enquiries</h1>
          <p className="text-stone-mid text-sm font-sans mt-1">
            {enquiries.length} enquir{enquiries.length !== 1 ? 'ies' : 'y'} total
            {newCount > 0 && (
              <span className="ml-2 bg-gold text-white text-xs px-2 py-0.5 font-sans">
                {newCount} new
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="search"
            className="form-input text-sm w-56"
            placeholder="Search enquiries…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="form-select w-auto text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as EnquiryStatus | '')}
          >
            <option value="">All statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-stone-mid font-sans text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-beige p-12 text-center">
          <p className="font-sans text-stone-mid text-sm">No enquiries found.</p>
        </div>
      ) : (
        <div className="bg-white border border-beige overflow-hidden">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Type</th>
                  <th>Budget</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className={e.status === 'new' ? 'bg-gold/5' : ''}>
                    <td className="font-serif text-stone">{e.name}</td>
                    <td className="font-sans text-xs text-stone-mid">{e.email}</td>
                    <td className="text-xs text-stone-mid">{e.type || '—'}</td>
                    <td className="text-xs text-stone-mid">{e.budget || '—'}</td>
                    <td>
                      <span className={STATUS_COLORS[e.status as EnquiryStatus] ?? 'badge'}>
                        {e.status}
                      </span>
                    </td>
                    <td className="text-xs text-stone-mid">
                      {new Date(e.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td>
                      <button
                        onClick={() => openDetail(e)}
                        className="text-xs text-gold hover:text-gold-dark font-sans uppercase tracking-wider"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone/70 px-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-beige shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-beige">
              <div>
                <h2 className="font-serif text-xl text-stone">Enquiry from {selected.name}</h2>
                <p className="font-sans text-xs text-stone-mid mt-0.5">
                  {new Date(selected.createdAt).toLocaleString('fr-FR')}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-stone-pale hover:text-stone text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3 text-sm font-sans">
                <div><span className="text-stone-pale text-xs uppercase tracking-wider">Name</span><br /><span className="text-stone">{selected.name}</span></div>
                <div><span className="text-stone-pale text-xs uppercase tracking-wider">Email</span><br /><a href={`mailto:${selected.email}`} className="text-gold hover:underline">{selected.email}</a></div>
                {selected.type && <div><span className="text-stone-pale text-xs uppercase tracking-wider">Type</span><br /><span className="text-stone">{selected.type}</span></div>}
                {selected.budget && <div><span className="text-stone-pale text-xs uppercase tracking-wider">Budget</span><br /><span className="text-stone">{selected.budget}</span></div>}
                {selected.timeline && <div className="col-span-2"><span className="text-stone-pale text-xs uppercase tracking-wider">Timeline</span><br /><span className="text-stone">{selected.timeline}</span></div>}
              </div>

              {/* Description */}
              <div>
                <p className="text-stone-pale text-xs uppercase tracking-wider mb-2">Vision / Description</p>
                <p className="font-sans text-sm text-stone leading-relaxed bg-beige/40 p-4 border border-beige whitespace-pre-wrap">
                  {selected.description}
                </p>
              </div>

              {/* Status */}
              <div>
                <p className="text-stone-pale text-xs uppercase tracking-wider mb-2">Status</p>
                <div className="flex flex-wrap gap-2">
                  {ALL_STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => updateEnquiry(selected.id, { status: s })}
                      disabled={saving || selected.status === s}
                      className={`px-4 py-1.5 text-xs font-sans uppercase tracking-widest border transition-colors ${
                        selected.status === s
                          ? 'bg-stone text-cream border-stone cursor-default'
                          : 'border-beige text-stone-mid hover:border-gold hover:text-gold'
                      } disabled:opacity-60`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <p className="text-stone-pale text-xs uppercase tracking-wider mb-2">Internal Notes</p>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Private notes (not shown to client)…"
                />
                <button
                  onClick={() => updateEnquiry(selected.id, { notes })}
                  disabled={saving}
                  className="btn-ghost text-sm mt-2 disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save Notes'}
                </button>
              </div>

              {/* Delete */}
              <div className="border-t border-beige pt-4">
                <button
                  onClick={() => setDeleteId(selected.id)}
                  className="text-xs text-red-500 hover:text-red-700 font-sans uppercase tracking-wider"
                >
                  Delete Enquiry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone/70 px-4">
          <div className="bg-white border border-beige p-8 max-w-sm w-full shadow-xl text-center">
            <p className="font-serif text-xl text-stone mb-3">Delete this enquiry?</p>
            <p className="font-sans text-sm text-stone-mid mb-6">This action cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => handleDelete(deleteId)}
                className="bg-red-600 text-white text-sm font-sans uppercase tracking-widest px-5 py-2 hover:bg-red-700"
              >
                Delete
              </button>
              <button onClick={() => setDeleteId(null)} className="btn-ghost text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
