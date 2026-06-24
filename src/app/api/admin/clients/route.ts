import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  await requireAdmin()

  const [orders, contacts, bespokeList] = await Promise.all([
    prisma.order.findMany({
      select: {
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        address: true,
        city: true,
        postcode: true,
        country: true,
        total: true,
        orderCode: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.contactMessage.findMany({
      select: { name: true, email: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.bespokeEnquiry.findMany({
      select: { name: true, email: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  // Build a map keyed by lowercase email
  const map = new Map<string, {
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
    lastSeen: Date
  }>()

  function upsert(email: string, name: string, date: Date, source: string, extra?: {
    phone?: string | null
    address?: string
    city?: string
    postcode?: string
    country?: string
    total?: number
    orderCode?: string
  }) {
    const key = email.toLowerCase()
    const existing = map.get(key)
    if (existing) {
      if (date > existing.lastSeen) {
        existing.lastSeen = date
        existing.name = name // use most recent name
      }
      if (!existing.sources.includes(source)) existing.sources.push(source)
      if (extra?.phone && !existing.phone) existing.phone = extra.phone
      if (extra?.address && !existing.address) {
        existing.address = extra.address
        existing.city = extra.city ?? null
        existing.postcode = extra.postcode ?? null
        existing.country = extra.country ?? null
      }
      if (extra?.total) existing.totalSpent += extra.total
      if (extra?.orderCode) {
        existing.orderCount++
        existing.orderCodes.push(extra.orderCode)
      }
    } else {
      map.set(key, {
        name,
        email,
        phone: extra?.phone ?? null,
        address: extra?.address ?? null,
        city: extra?.city ?? null,
        postcode: extra?.postcode ?? null,
        country: extra?.country ?? null,
        totalSpent: extra?.total ?? 0,
        orderCount: extra?.orderCode ? 1 : 0,
        orderCodes: extra?.orderCode ? [extra.orderCode] : [],
        sources: [source],
        lastSeen: date,
      })
    }
  }

  for (const o of orders) {
    upsert(o.customerEmail, o.customerName, o.createdAt, 'order', {
      phone: o.customerPhone,
      address: o.address,
      city: o.city,
      postcode: o.postcode,
      country: o.country,
      total: Number(o.total),
      orderCode: o.orderCode,
    })
  }
  for (const c of contacts) {
    upsert(c.email, c.name, c.createdAt, 'contact')
  }
  for (const b of bespokeList) {
    upsert(b.email, b.name, b.createdAt, 'bespoke')
  }

  const clients = Array.from(map.values()).sort(
    (a, b) => b.lastSeen.getTime() - a.lastSeen.getTime()
  )

  return NextResponse.json(clients)
}
