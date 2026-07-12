'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'

type Product = {
  id: number
  name: string
  slug: string
  stock: number
  imagePath: string | null
  material: { name: string } | null
}

const LOW_STOCK_THRESHOLD = 3

function stockLabel(stock: number) {
  if (stock <= 0) return { label: 'Out of stock', className: 'text-red-700 bg-red-50 border-red-200' }
  if (stock < LOW_STOCK_THRESHOLD) return { label: 'Low stock', className: 'text-amber-700 bg-amber-50 border-amber-200' }
  return { label: 'Healthy', className: 'text-green-700 bg-green-50 border-green-200' }
}

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [drafts, setDrafts] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all')
  const [message, setMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/products')
    if (res.ok) {
      const data = await res.json() as Product[]
      setProducts(data)
      setDrafts(Object.fromEntries(data.map((product) => [product.id, String(product.stock)])))
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function updateStock(product: Product, nextStock: number) {
    const stock = Math.max(0, Math.trunc(nextStock))
    setSavingId(product.id)
    setMessage(null)
    const res = await fetch(`/api/admin/products/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock }),
    })

    if (res.ok) {
      setProducts((prev) => prev.map((item) => (item.id === product.id ? { ...item, stock } : item)))
      setDrafts((prev) => ({ ...prev, [product.id]: String(stock) }))
      setMessage(`${product.name} stock updated.`)
    } else {
      setMessage('Could not update stock. Please try again.')
    }
    setSavingId(null)
  }

  const stats = useMemo(() => {
    const out = products.filter((product) => product.stock <= 0).length
    const low = products.filter((product) => product.stock > 0 && product.stock < LOW_STOCK_THRESHOLD).length
    const totalUnits = products.reduce((sum, product) => sum + product.stock, 0)
    return { out, low, totalUnits }
  }, [products])

  const filtered = products.filter((product) => {
    const q = search.toLowerCase()
    const matchesSearch = !q || product.name.toLowerCase().includes(q) || product.slug.toLowerCase().includes(q)
    const matchesFilter =
      filter === 'all' ||
      (filter === 'out' && product.stock <= 0) ||
      (filter === 'low' && product.stock > 0 && product.stock < LOW_STOCK_THRESHOLD)
    return matchesSearch && matchesFilter
  })

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl text-stone">Inventory</h1>
          <p className="text-stone-mid text-sm font-sans mt-1">Review stock levels and make fast quantity updates.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="search"
            className="form-input text-sm w-full sm:w-64"
            placeholder="Search inventory..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select className="form-select w-full sm:w-auto text-sm" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}>
            <option value="all">All products</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="border border-beige bg-white p-5">
          <p className="text-[10px] uppercase tracking-[0.22em] text-stone-pale font-sans">Total Units</p>
          <p className="font-serif text-3xl text-stone mt-2">{stats.totalUnits}</p>
        </div>
        <button type="button" onClick={() => setFilter('low')} className="text-left border border-amber-200 bg-amber-50 p-5">
          <p className="text-[10px] uppercase tracking-[0.22em] text-amber-700 font-sans">Low Stock</p>
          <p className="font-serif text-3xl text-stone mt-2">{stats.low}</p>
        </button>
        <button type="button" onClick={() => setFilter('out')} className="text-left border border-red-200 bg-red-50 p-5">
          <p className="text-[10px] uppercase tracking-[0.22em] text-red-700 font-sans">Out of Stock</p>
          <p className="font-serif text-3xl text-stone mt-2">{stats.out}</p>
        </button>
      </div>

      {message ? <div className="bg-white border border-beige px-4 py-3 text-sm font-sans text-stone-mid mb-4">{message}</div> : null}

      {loading ? (
        <p className="text-stone-mid font-sans text-sm">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-beige p-12 text-center">
          <p className="font-sans text-stone-mid text-sm">No inventory items found.</p>
        </div>
      ) : (
        <div className="bg-white border border-beige overflow-hidden">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Material</th>
                  <th>Status</th>
                  <th>Stock</th>
                  <th>Adjust</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => {
                  const presentation = stockLabel(product.stock)
                  const draft = drafts[product.id] ?? String(product.stock)
                  const parsedDraft = Number.parseInt(draft, 10)

                  return (
                    <tr key={product.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          {product.imagePath ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={product.imagePath} alt={product.name} className="w-12 h-12 object-cover border border-beige" />
                          ) : (
                            <div className="w-12 h-12 bg-beige border border-beige" />
                          )}
                          <div>
                            <p className="font-serif text-stone">{product.name}</p>
                            <p className="font-mono text-[11px] text-stone-pale">{product.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-xs text-stone-mid">{product.material?.name ?? '-'}</td>
                      <td>
                        <span className={`inline-block border px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] ${presentation.className}`}>
                          {presentation.label}
                        </span>
                      </td>
                      <td className="font-serif text-2xl text-stone">{product.stock}</td>
                      <td>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateStock(product, product.stock - 1)}
                            disabled={savingId === product.id || product.stock <= 0}
                            className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-50"
                          >
                            -1
                          </button>
                          <button
                            type="button"
                            onClick={() => updateStock(product, product.stock + 1)}
                            disabled={savingId === product.id}
                            className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-50"
                          >
                            +1
                          </button>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            className="form-input w-24 text-sm"
                            value={draft}
                            onChange={(event) => setDrafts((prev) => ({ ...prev, [product.id]: event.target.value }))}
                          />
                          <button
                            type="button"
                            onClick={() => updateStock(product, Number.isNaN(parsedDraft) ? product.stock : parsedDraft)}
                            disabled={savingId === product.id || Number.isNaN(parsedDraft) || parsedDraft < 0}
                            className="btn-primary text-xs px-4 py-2 disabled:opacity-50"
                          >
                            {savingId === product.id ? 'Saving...' : 'Set'}
                          </button>
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
    </div>
  )
}
