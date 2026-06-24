'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { ProductVariationEditor, type ProductVariationFormValue } from '@/components/admin/ProductVariationEditor'
import { formatPrice, type CurrencyFormatOptions } from '@/lib/helpers'

type MaterialOption = { id: number; name: string; imagePath: string | null }
type ProductImage = { id: number; url: string; sortOrder: number }

type Product = {
  id: number
  name: string
  slug: string
  description: string
  priceEur: number
  stock: number
  featured: boolean
  badge: string
  imagePath: string
  materialId: number | null
  material: MaterialOption | null
  materialVariations?: Array<{
    materialId: number
    materialName: string
    priceEUR: number | null
    images: string[]
    isDefault: boolean
  }>
  variationCount?: number
  createdAt: string
}

const LOW_STOCK_THRESHOLD = 3

function getStockPresentation(stock: number) {
  if (stock <= 0) {
    return {
      dotClass: 'bg-red-500',
      textClass: 'text-red-600',
      label: 'Out of stock',
    }
  }

  if (stock < LOW_STOCK_THRESHOLD) {
    return {
      dotClass: 'bg-amber-400',
      textClass: 'text-amber-700',
      label: 'Low stock',
    }
  }

  return {
    dotClass: 'bg-green-500',
    textClass: 'text-green-700',
    label: 'Healthy stock',
  }
}

const EMPTY_FORM = {
  name: '',
  slug: '',
  description: '',
  priceEur: '',
  imagePath: '',
  badge: '',
  stock: '0',
  featured: false,
  materialId: '',
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [materials, setMaterials] = useState<MaterialOption[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [variationUploading, setVariationUploading] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [currencyOptions, setCurrencyOptions] = useState<CurrencyFormatOptions>()
  const [materialVariations, setMaterialVariations] = useState<ProductVariationFormValue[]>([])

  // Extra images state
  const [extraImages, setExtraImages] = useState<ProductImage[]>([])
  const [extraUploading, setExtraUploading] = useState(false)

  const mainFileRef = useRef<HTMLInputElement>(null)
  const extraFileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [pRes, mRes] = await Promise.all([
      fetch('/api/admin/products'),
      fetch('/api/admin/materials/public'),
    ])
    if (pRes.ok) setProducts(await pRes.json())
    if (mRes.ok) setMaterials(await mRes.json())
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

  async function loadExtraImages(productId: number) {
    const res = await fetch(`/api/admin/products/${productId}/images`)
    if (res.ok) setExtraImages(await res.json())
    else setExtraImages([])
  }

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setMaterialVariations([])
    setExtraImages([])
    setError('')
    setModalOpen(true)
  }

  function openEdit(p: Product) {
    setEditing(p)
    setForm({
      name: p.name,
      slug: p.slug,
      description: p.description ?? '',
      priceEur: String(p.priceEur),
      imagePath: p.imagePath ?? '',
      badge: p.badge ?? '',
      stock: String(p.stock),
      featured: p.featured,
      materialId: p.materialId != null ? String(p.materialId) : '',
    })
    setMaterialVariations((p.materialVariations ?? []).map((variation) => ({
      materialId: String(variation.materialId),
      materialName: variation.materialName,
      priceEUR: variation.priceEUR != null ? String(variation.priceEUR) : '',
      images: variation.images,
      isDefault: variation.isDefault,
    })))
    setError('')
    setModalOpen(true)
    loadExtraImages(p.id)
  }

  function set(field: keyof typeof form, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleNameChange(v: string) {
    set('name', v)
    if (!editing) {
      set('slug', v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
    }
  }

  function handleMaterialChange(matId: string) {
    set('materialId', matId)
    if (!form.imagePath && matId) {
      const mat = materials.find(m => m.id === parseInt(matId))
      if (mat?.imagePath) set('imagePath', mat.imagePath)
    }
  }

  function useMaterialImage() {
    if (!form.materialId) return
    const mat = materials.find(m => m.id === parseInt(form.materialId))
    if (mat?.imagePath) set('imagePath', mat.imagePath)
  }

  async function uploadFile(file: File): Promise<string | null> {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError((data as { error?: string }).error ?? 'Upload failed.')
      return null
    }
    return (data as { path: string }).path
  }

  async function handleMainUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const path = await uploadFile(file)
      if (path) set('imagePath', path)
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
      if (mainFileRef.current) mainFileRef.current.value = ''
    }
  }

  async function handleExtraUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setExtraUploading(true)
    setError('')
    try {
      const path = await uploadFile(file)
      if (!path) return
      if (editing) {
        // Product already saved — persist immediately
        const res = await fetch(`/api/admin/products/${editing.id}/images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: path }),
        })
        if (res.ok) {
          const img = await res.json()
          setExtraImages(prev => [...prev, img])
        }
      } else {
        // New product — queue locally until saved
        setExtraImages(prev => [...prev, { id: -(Date.now()), url: path, sortOrder: prev.length }])
      }
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setExtraUploading(false)
      if (extraFileRef.current) extraFileRef.current.value = ''
    }
  }

  async function handleDeleteExtra(img: ProductImage) {
    if (img.id < 0) {
      // Local only (new product not yet saved)
      setExtraImages(prev => prev.filter(i => i.id !== img.id))
      return
    }
    const res = await fetch(`/api/admin/products/${editing!.id}/images/${img.id}`, { method: 'DELETE' })
    if (res.ok) setExtraImages(prev => prev.filter(i => i.id !== img.id))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const price = parseFloat(form.priceEur)
    const stock = parseInt(form.stock)
    if (!form.name.trim() || !form.slug.trim() || isNaN(price) || isNaN(stock)) {
      setError('Name, slug, price and stock are required.')
      return
    }
    setSaving(true)
    const parsedVariations = materialVariations
      .map((variation) => ({
        materialId: Number.parseInt(variation.materialId, 10),
        materialName: variation.materialName.trim(),
        priceEUR: variation.priceEUR.trim() ? Number.parseFloat(variation.priceEUR) : null,
        images: variation.images,
        isDefault: variation.isDefault,
      }))
      .filter((variation) => Number.isInteger(variation.materialId) && variation.materialId > 0)

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
      priceEur: price,
      imagePath: form.imagePath.trim(),
      badge: form.badge.trim(),
      stock,
      featured: form.featured,
      materialId: form.materialId ? parseInt(form.materialId) : null,
      materialVariations: parsedVariations,
    }
    const url = editing ? `/api/admin/products/${editing.id}` : '/api/admin/products'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(typeof data.error === 'string' ? data.error : 'Failed to save product.')
      setSaving(false)
      return
    }

    // For new products, persist any queued extra images
    if (!editing && extraImages.length > 0) {
      const newId = (data as { id: number }).id
      await Promise.all(extraImages.map(img =>
        fetch(`/api/admin/products/${newId}/images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: img.url }),
        })
      ))
    }

    setModalOpen(false)
    load()
    setSaving(false)
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setDeleteId(null)
      load()
    }
  }

  const selectedMat = form.materialId ? materials.find(m => m.id === parseInt(form.materialId)) : null
  const filteredProducts = search ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())) : products
  const outOfStockProducts = products.filter((product) => product.stock <= 0)
  const lowStockProducts = products.filter((product) => product.stock > 0 && product.stock < LOW_STOCK_THRESHOLD)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-stone">Products</h1>
          <p className="text-stone-mid text-sm font-sans mt-1">Manage your product catalogue.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="search"
            className="form-input text-sm w-56"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button onClick={openCreate} className="btn-primary text-sm px-5 py-2.5">
            + New Product
          </button>
        </div>
      </div>

      {!loading && (outOfStockProducts.length > 0 || lowStockProducts.length > 0) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {outOfStockProducts.length > 0 ? (
            <div className="border border-red-200 bg-red-50 px-5 py-4">
              <p className="text-[10px] uppercase tracking-[0.22em] text-red-700 font-sans">Inventory Alert</p>
              <p className="font-serif text-xl text-stone mt-2">{outOfStockProducts.length} out of stock</p>
              <p className="text-sm text-stone-mid font-sans mt-2">
                {outOfStockProducts.slice(0, 3).map((product) => product.name).join(', ')}
                {outOfStockProducts.length > 3 ? '...' : ''}
              </p>
            </div>
          ) : null}

          {lowStockProducts.length > 0 ? (
            <div className="border border-amber-200 bg-amber-50 px-5 py-4">
              <p className="text-[10px] uppercase tracking-[0.22em] text-amber-700 font-sans">Low Stock Warning</p>
              <p className="font-serif text-xl text-stone mt-2">
                {lowStockProducts.length} products below {LOW_STOCK_THRESHOLD}
              </p>
              <p className="text-sm text-stone-mid font-sans mt-2">
                {lowStockProducts.slice(0, 3).map((product) => product.name).join(', ')}
                {lowStockProducts.length > 3 ? '...' : ''}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {loading ? (
        <p className="text-stone-mid font-sans text-sm">Loading…</p>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white border border-beige p-12 text-center">
          <p className="font-sans text-stone-mid text-sm">No products yet.</p>
          <button onClick={openCreate} className="btn-ghost mt-4 text-sm">Add your first product</button>
        </div>
      ) : (
        <div className="bg-white border border-beige overflow-hidden">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Material</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Badge</th>
                  <th>Featured</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const stockUi = getStockPresentation(p.stock)

                  return (
                  <tr key={p.id}>
                    <td>
                      {p.imagePath ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imagePath} alt={p.name} className="w-12 h-12 object-cover border border-beige" />
                      ) : (
                        <div className="w-12 h-12 bg-beige border border-beige flex items-center justify-center">
                          <span className="text-stone-pale text-xs">—</span>
                        </div>
                      )}
                    </td>
                    <td className="font-serif text-stone">{p.name}</td>
                    <td className="text-xs text-stone-mid">
                      {p.variationCount && p.variationCount > 1
                        ? `${p.variationCount} variations`
                        : p.material?.name || '—'}
                    </td>
                    <td>{formatPrice(p.priceEur, currencyOptions)}</td>
                    <td>
                      <div className="inline-flex flex-col gap-1">
                        <span className="inline-flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${stockUi.dotClass}`} />
                          <span className={`font-medium ${stockUi.textClass}`}>{p.stock}</span>
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.16em] text-stone-pale">
                          {stockUi.label}
                        </span>
                      </div>
                    </td>
                    <td className="text-xs text-stone-mid">{p.badge || '—'}</td>
                    <td>{p.featured ? <span className="text-gold">✦</span> : <span className="text-stone-pale">—</span>}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <button onClick={() => openEdit(p)} className="text-xs text-gold hover:text-gold-dark font-sans uppercase tracking-wider">Edit</button>
                        <button onClick={() => setDeleteId(p.id)} className="text-xs text-red-500 hover:text-red-700 font-sans uppercase tracking-wider">Delete</button>
                      </div>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone/70 px-4">
          <div className="bg-white w-full max-w-xl max-h-[90vh] overflow-y-auto border border-beige shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-beige">
              <h2 className="font-serif text-xl text-stone">{editing ? 'Edit Product' : 'New Product'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-stone-pale hover:text-stone text-xl leading-none">×</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="form-label">Name *</label>
                <input className="form-input" value={form.name} onChange={(e) => handleNameChange(e.target.value)} required />
              </div>
              <div>
                <label className="form-label">Slug *</label>
                <input className="form-input font-mono text-sm" value={form.slug} onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} required />
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea className="form-textarea" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Price (€) *</label>
                  <input type="number" min="0" step="0.01" className="form-input" value={form.priceEur} onChange={(e) => set('priceEur', e.target.value)} required />
                </div>
                <div>
                  <label className="form-label">Stock *</label>
                  <input type="number" min="0" step="1" className="form-input" value={form.stock} onChange={(e) => set('stock', e.target.value)} required />
                </div>
              </div>

              {/* Material */}
              <div>
                <label className="form-label">Material</label>
                <select className="form-select" value={form.materialId} onChange={(e) => handleMaterialChange(e.target.value)}>
                  <option value="">— None —</option>
                  {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                {selectedMat?.imagePath && (
                  <div className="flex items-center gap-3 mt-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={selectedMat.imagePath} alt={selectedMat.name} className="w-10 h-10 object-cover border border-beige" />
                    <button type="button" onClick={useMaterialImage} className="text-xs font-sans text-gold border border-gold px-3 py-1 hover:bg-gold hover:text-white transition-colors">
                      Use material image
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="form-label">Badge</label>
                <select className="form-select" value={form.badge} onChange={(e) => set('badge', e.target.value)}>
                  <option value="">— None —</option>
                  <option value="New">New</option>
                  <option value="Limited">Limited</option>
                  <option value="Bestseller">Bestseller</option>
                  <option value="Sale">Sale</option>
                  <option value="Featured">Featured</option>
                  <option value="Exclusive">Exclusive</option>
                </select>
              </div>

              <ProductVariationEditor
                materials={materials}
                value={materialVariations}
                onChange={setMaterialVariations}
                uploadFile={uploadFile}
                onUploadingChange={setVariationUploading}
              />

              {/* Main image */}
              <div>
                <label className="form-label">Main Image</label>
                {form.imagePath && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.imagePath} alt="main" className="w-24 h-24 object-cover border border-beige mb-2" />
                )}
                <input type="file" accept="image/jpeg,image/png,image/webp" ref={mainFileRef} onChange={handleMainUpload} className="block text-sm text-stone-mid font-sans" />
                {uploading && <p className="text-xs text-stone-mid mt-1 font-sans">Uploading…</p>}
              </div>

              {/* Extra images */}
              <div>
                <label className="form-label">Additional Images</label>
                {extraImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {extraImages.map((img) => (
                      <div key={img.id} className="relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt="" className="w-16 h-16 object-cover border border-beige" />
                        <button
                          type="button"
                          onClick={() => handleDeleteExtra(img)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <input type="file" accept="image/jpeg,image/png,image/webp" ref={extraFileRef} onChange={handleExtraUpload} className="block text-sm text-stone-mid font-sans" />
                {extraUploading && <p className="text-xs text-stone-mid mt-1 font-sans">Uploading…</p>}
                <p className="text-xs text-stone-pale font-sans mt-1">Hover a thumbnail and click × to remove it.</p>
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" id="featured" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} className="w-4 h-4 accent-gold" />
                <label htmlFor="featured" className="form-label mb-0 cursor-pointer">Featured on homepage</label>
              </div>

              {error && <div className="flash-error">{error}</div>}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving || uploading || extraUploading || variationUploading} className="btn-primary flex-1 disabled:opacity-60">
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Product'}
                </button>
                <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone/70 px-4">
          <div className="bg-white border border-beige p-8 max-w-sm w-full shadow-xl text-center">
            <p className="font-serif text-xl text-stone mb-3">Delete this product?</p>
            <p className="font-sans text-sm text-stone-mid mb-6">This action cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => handleDelete(deleteId)} className="bg-red-600 text-white text-sm font-sans uppercase tracking-widest px-5 py-2 hover:bg-red-700">Delete</button>
              <button onClick={() => setDeleteId(null)} className="btn-ghost text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
