'use client'
import { useEffect } from 'react'
import { gtagEvent } from '@/lib/gtag'

interface Item {
  id: number
  name: string
  quantity: number
  subtotal: number
}

interface Props {
  orderCode: string
  total: number
  shipping: number
  items: Item[]
}

export function PurchaseTracker({ orderCode, total, shipping, items }: Props) {
  useEffect(() => {
    gtagEvent('purchase', {
      transaction_id: orderCode,
      value: total,
      currency: 'EUR',
      shipping,
      items: items.map((item) => ({
        item_id: String(item.id),
        item_name: item.name,
        quantity: item.quantity,
        price: Number((item.subtotal / item.quantity).toFixed(2)),
      })),
    })
  }, [orderCode, total, shipping, items])

  return null
}
