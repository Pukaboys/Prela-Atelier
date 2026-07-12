'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { gtagEvent } from '@/lib/gtag'
import { useLanguage } from '@/components/providers/LanguageProvider'

interface Props {
  productId: number
  productName: string
  stock: number
  priceEur: number
  materialId?: number | null
  materialName?: string | null
}

export function ProductActions({
  productId,
  productName,
  stock,
  priceEur,
  materialId = null,
  materialName = null,
}: Props) {
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [added, setAdded] = useState(false)
  const router = useRouter()
  const { dictionary } = useLanguage()

  async function handleAdd() {
    setLoading(true)
    try {
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity, materialId }),
      })
      if (res.ok) {
        setAdded(true)
        router.refresh()
        setTimeout(() => setAdded(false), 2000)
        gtagEvent('add_to_cart', {
          currency: 'EUR',
          value: priceEur * quantity,
          items: [{
            item_id: String(productId),
            item_name: productName,
            item_variant: materialName ?? undefined,
            price: priceEur,
            quantity,
          }],
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="form-label">{dictionary.common.quantity}</label>
        <div className="flex items-center gap-3 mt-1">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            className="w-10 h-10 flex items-center justify-center border border-beige text-stone hover:border-gold transition-colors disabled:opacity-40 font-sans text-lg"
          >
            -
          </button>
          <input
            type="number"
            min={1}
            max={99}
            value={quantity}
            onChange={(e) => {
              const v = parseInt(e.target.value)
              if (!isNaN(v) && v >= 1 && v <= 99) setQuantity(v)
            }}
            className="w-16 text-center border border-beige text-stone font-sans py-2 focus:outline-none focus:border-gold"
          />
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(99, q + 1))}
            disabled={quantity >= 99}
            className="w-10 h-10 flex items-center justify-center border border-beige text-stone hover:border-gold transition-colors disabled:opacity-40 font-sans text-lg"
          >
            +
          </button>
          <span className="text-xs font-sans text-stone-pale ml-2">
            {stock > 0 ? dictionary.product.inStock(stock) : dictionary.product.madeToOrder}
          </span>
        </div>
      </div>

      <button
        onClick={handleAdd}
        disabled={loading}
        className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? dictionary.product.adding : added ? `${dictionary.product.addedToCart} ✓` : dictionary.product.addToCart}
      </button>
    </div>
  )
}
