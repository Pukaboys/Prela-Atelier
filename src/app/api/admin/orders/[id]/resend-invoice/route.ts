import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { sendOrderConfirmation } from '@/lib/mailer'
import { getCurrencyFormatOptions } from '@/lib/helpers'
import { getSettings } from '@/lib/settings'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin()
  const { id } = await params

  const order = await prisma.order.findUnique({
    where: { id: parseInt(id) },
    include: { items: true },
  })

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const settings = await getSettings()

  await sendOrderConfirmation({
    to: order.customerEmail,
    customerName: order.customerName,
    orderCode: order.orderCode,
    items: order.items.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      subtotal: Number(i.subtotal),
    })),
    shipping: Number(order.shipping),
    total: Number(order.total),
    currencyOptions: getCurrencyFormatOptions(settings),
  })

  return NextResponse.json({ ok: true })
}
