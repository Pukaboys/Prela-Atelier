import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getCustomerEmailFromToken } from '@/lib/customer-auth'

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get('authorization') ?? ''
    const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length).trim() : null
    const email = await getCustomerEmailFromToken(token)

    if (!email) {
      return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 })
    }

    const orders = await prisma.order.findMany({
      where: {
        customerEmail: { equals: email, mode: 'insensitive' },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderCode: true,
        status: true,
        total: true,
        createdAt: true,
        items: {
          select: { quantity: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: orders.map((order) => ({
        id: order.id,
        orderCode: order.orderCode,
        status: order.status,
        total: Number(order.total),
        currency: 'EUR',
        createdAt: order.createdAt.toISOString(),
        itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      })),
    })
  } catch (err) {
    console.error('[orders]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
