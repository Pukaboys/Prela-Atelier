'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

type Material = {
  id: number
  name: string
  origin: string
  description: string
  hardness: string | null
  tone: string | null
  veining: string | null
  pricePerM2Eur: number | null
  imagePath: string | null
  sortOrder: number
  visible: boolean
}

const EMPTY_FORM = {
  name: '',
  origin: '',
  description: '',
  hardness: '',
  tone: '',
  veining: '',
  pricePerM2Eur: '',
  imagePath: '',
  sortOrder: '0',
  visible: true,
}

export default function AdminMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Material | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/materials')
    if (res.ok) setMaterials(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError('')
    setModalOpen(true)
  }

  function openEdit(material: Material) {
    setEditing(material)
    setForm({
      name: material.name,
      origin: material.origin,
      description: material.description ?? '',
      hardness: material.hardness ?? '',
      tone: material.tone ?? '',
      veining: material.veining ?? '',
      pricePerM2Eur: material.pricePerM2Eur != null ? String(material.pricePerM2Eur) : '',
      imagePath: material.imagePath ?? '',
      sortOrder: String(material.sortOrder),
      visible: material.visible,
    })
    setError('')
    setModalOpen(true)
  }

  function set(field: keyof typeof form, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as { error?: string }).error ?? 'Upload failed.')
      } else {
        set('imagePath', (data as { path: string }).path)
      }
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.name.trim() || !form.origin.trim()) {
      setError('Name and origin are required.')
      return
    }

    const pricePerM2Eur = form.pricePerM2Eur.trim() === '' ? null : parseFloat(form.pricePerM2Eur)
    if (pricePerM2Eur !== null && Number.isNaN(pricePerM2Eur)) {
      setError('Private price must be a valid number.')
      return
    }

    setSaving(true)
    const payload = {
      name: form.name.trim(),
      origin: form.origin.trim(),
      description: form.description.trim(),
      hardness: form.hardness.trim(),
      tone: form.tone.trim(),
      veining: form.veining.trim(),
      pricePerM2Eur,
      imagePath: form.imagePath.trim(),
      sortOrder: parseInt(form.sortOrder) || 0,
      visible: form.visible,
    }
    const url = editing ? `/api/admin/materials/${editing.id}` : '/api/admin/materials'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(typeof data.error === 'string' ? data.error : 'Failed to save material.')
    } else {
      setModalOpen(false)
      load()
    }
    setSaving(false)
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/admin/materials/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setDeleteId(null)
      load()
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-stone">Materials</h1>
          <p className="text-stone-mid text-sm font-sans mt-1">
            Manage the stone library shown on the public materials page.
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary text-sm px-5 py-2.5">
          + New Material
        </button>
      </div>

      {loading ? (
        <p className="text-stone-mid font-sans text-sm">Loading...</p>
      ) : materials.length === 0 ? (
        <div className="bg-white border border-beige p-12 text-center">
          <p className="font-sans text-stone-mid text-sm">No materials yet.</p>
          <button onClick={openCreate} className="btn-ghost mt-4 text-sm">Add the first material</button>
        </div>
      ) : (
        <div className="bg-white border border-beige overflow-hidden">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Order</th>
                  <th>Name</th>
                  <th>Origin</th>
                  <th>Hardness</th>
                  <th>Tone</th>
                  <th>Veining</th>
                  <th>Price / m2</th>
                  <th>Visible</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((material) => (
                  <tr key={material.id}>
                    <td>
                      {material.imagePath ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={material.imagePath} alt={material.name} className="w-12 h-12 object-cover border border-beige" />
                      ) : (
                        <div className="w-12 h-12 bg-beige border border-beige flex items-center justify-center">
                          <span className="text-stone-pale text-xs">-</span>
                        </div>
                      )}
                    </td>
                    <td className="text-stone-mid text-xs">{material.sortOrder}</td>
                    <td className="font-serif text-stone">{material.name}</td>
                    <td className="text-stone-mid text-sm">{material.origin}</td>
                    <td className="text-xs text-stone-mid">{material.hardness || '-'}</td>
                    <td className="text-xs text-stone-mid">{material.tone || '-'}</td>
                    <td className="text-xs text-stone-mid">{material.veining || '-'}</td>
                    <td className="text-xs text-stone-mid">
                      {material.pricePerM2Eur != null ? `EUR ${material.pricePerM2Eur.toFixed(2)}` : '-'}
                    </td>
                    <td>
                      {material.visible
                        ? <span className="text-gold text-xs">Visible</span>
                        : <span className="text-stone-pale text-xs">Hidden</span>}
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <button onClick={() => openEdit(material)} className="text-xs text-gold hover:text-gold-dark font-sans uppercase tracking-wider">
                          Edit
                        </button>
                        <button onClick={() => setDeleteId(material.id)} className="text-xs text-red-500 hover:text-red-700 font-sans uppercase tracking-wider">
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

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone/70 px-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto border border-beige shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-beige">
              <h2 className="font-serif text-xl text-stone">{editing ? 'Edit Material' : 'New Material'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-stone-pale hover:text-stone text-xl leading-none">×</button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Name *</label>
                  <input className="form-input" value={form.name} onChange={(e) => set('name', e.target.value)} required />
                </div>
                <div>
                  <label className="form-label">Origin *</label>
                  <input className="form-input" value={form.origin} onChange={(e) => set('origin', e.target.value)} required placeholder="e.g. Italy" />
                </div>
              </div>

              <div>
                <label className="form-label">Description</label>
                <textarea className="form-textarea" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Hardness</label>
                  <input className="form-input" value={form.hardness} onChange={(e) => set('hardness', e.target.value)} placeholder="e.g. 3 Mohs" />
                </div>
                <div>
                  <label className="form-label">Tone</label>
                  <input className="form-input" value={form.tone} onChange={(e) => set('tone', e.target.value)} placeholder="e.g. Cool white" />
                </div>
                <div>
                  <label className="form-label">Veining</label>
                  <input className="form-input" value={form.veining} onChange={(e) => set('veining', e.target.value)} placeholder="e.g. Fine grey" />
                </div>
              </div>

              <div>
                <label className="form-label">Private Price per m2 (EUR)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-input"
                  value={form.pricePerM2Eur}
                  onChange={(e) => set('pricePerM2Eur', e.target.value)}
                  placeholder="950.00"
                />
                <p className="text-xs text-stone-pale font-sans mt-1">
                  Used only in admin materials and internal custom-order quote calculations.
                </p>
              </div>

              <div>
                <label className="form-label">Material Image</label>
                {form.imagePath && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.imagePath} alt="preview" className="w-24 h-24 object-cover border border-beige mb-2" />
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  ref={fileRef}
                  onChange={handleUpload}
                  className="block text-sm text-stone-mid font-sans"
                />
                {uploading && <p className="text-xs text-stone-mid mt-1 font-sans">Uploading...</p>}
                {form.imagePath && <p className="text-xs text-stone-mid mt-1 font-mono break-all">{form.imagePath}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Sort Order</label>
                  <input type="number" className="form-input" value={form.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.visible}
                      onChange={(e) => set('visible', e.target.checked)}
                      className="w-4 h-4 accent-gold"
                    />
                    <span className="form-label mb-0">Visible on public page</span>
                  </label>
                </div>
              </div>

              {error && <div className="flash-error">{error}</div>}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving || uploading} className="btn-primary flex-1 disabled:opacity-60">
                  {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Material'}
                </button>
                <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost flex-1">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone/70 px-4">
          <div className="bg-white border border-beige p-8 max-w-sm w-full shadow-xl text-center">
            <p className="font-serif text-xl text-stone mb-3">Delete this material?</p>
            <p className="font-sans text-sm text-stone-mid mb-6">This action cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => handleDelete(deleteId)} className="bg-red-600 text-white text-sm font-sans uppercase tracking-widest px-5 py-2 hover:bg-red-700">
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
