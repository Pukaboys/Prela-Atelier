'use client'
import { useEffect } from 'react'
import { gtagEvent } from '@/lib/gtag'

interface Props {
  productId: number
  productName: string
  priceEur: number
}

export function ProductViewTracker({ productId, productName, priceEur }: Props) {
  useEffect(() => {
    gtagEvent('view_item', {
      currency: 'EUR',
      value: priceEur,
      items: [{ item_id: String(productId), item_name: productName, price: priceEur, quantity: 1 }],
    })

    void fetch('/api/recommendations/viewed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
      keepalive: true,
    }).catch(() => {
      // Recommendations should never block product browsing.
    })
  }, [productId, productName, priceEur])

  return null
}
