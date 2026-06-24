import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

function csvRow(fields: (string | number | null | undefined)[]) {
  return fields.map((f) => {
    const s = f == null ? '' : String(f)
    return `"${s.replace(/"/g, '""')}"`
  }).join(',')
}

export async function GET() {
  await requireAdmin()

  const [orders, contacts, bespokeList] = await Promise.all([
    prisma.order.findMany({
      select: {
        customerName: true, customerEmail: true, customerPhone: true,
        address: true, city: true, postcode: true, country: true,
        total: true, orderCode: true, createdAt: true,
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

  const map = new Map<string, {
    name: string; email: string; phone: string | null
    address: string | null; city: string | null; postcode: string | null; country: string | null
    totalSpent: number; orderCount: number; orderCodes: string[]
    sources: string[]; lastSeen: Date
  }>()

  function upsert(email: string, name: string, date: Date, source: string, extra?: {
    phone?: string | null; address?: string; city?: string; postcode?: string; country?: string
    total?: number; orderCode?: string
  }) {
    const key = email.toLowerCase()
    const ex = map.get(key)
    if (ex) {
      if (date > ex.lastSeen) { ex.lastSeen = date; ex.name = name }
      if (!ex.sources.includes(source)) ex.sources.push(source)
      if (extra?.phone && !ex.phone) ex.phone = extra.phone
      if (extra?.address && !ex.address) {
        ex.address = extra.address; ex.city = extra.city ?? null
        ex.postcode = extra.postcode ?? null; ex.country = extra.country ?? null
      }
      if (extra?.total) ex.totalSpent += extra.total
      if (extra?.orderCode) { ex.orderCount++; ex.orderCodes.push(extra.orderCode) }
    } else {
      map.set(key, {
        name, email,
        phone: extra?.phone ?? null,
        address: extra?.address ?? null, city: extra?.city ?? null,
        postcode: extra?.postcode ?? null, country: extra?.country ?? null,
        totalSpent: extra?.total ?? 0,
        orderCount: extra?.orderCode ? 1 : 0,
        orderCodes: extra?.orderCode ? [extra.orderCode] : [],
        sources: [source], lastSeen: date,
      })
    }
  }

  for (const o of orders) {
    upsert(o.customerEmail, o.customerName, o.createdAt, 'order', {
      phone: o.customerPhone, address: o.address, city: o.city,
      postcode: o.postcode, country: o.country,
      total: Number(o.total), orderCode: o.orderCode,
    })
  }
  for (const c of contacts) upsert(c.email, c.name, c.createdAt, 'contact')
  for (const b of bespokeList) upsert(b.email, b.name, b.createdAt, 'bespoke')

  const clients = Array.from(map.values()).sort(
    (a, b) => b.lastSeen.getTime() - a.lastSeen.getTime()
  )

  const header = csvRow(['Name', 'Email', 'Phone', 'Address', 'City', 'Postcode', 'Country', 'Sources', 'Orders', 'Total Spent (EUR)', 'Order Codes', 'Last Seen'])
  const rows = clients.map((c) =>
    csvRow([
      c.name, c.email, c.phone, c.address, c.city, c.postcode, c.country,
      c.sources.join(' | '),
      c.orderCount,
      c.totalSpent.toFixed(2),
      c.orderCodes.join(' | '),
      c.lastSeen.toISOString().slice(0, 10),
    ])
  )

  const csv = [header, ...rows].join('\r\n')
  const date = new Date().toISOString().slice(0, 10)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="prela-clients-${date}.csv"`,
    },
  })
}
