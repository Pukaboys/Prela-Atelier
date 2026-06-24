import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import { buildProductionManagementSummary } from '@/lib/production-workflow'
import {
  getCustomerOrderNotes,
  getProductionStage,
} from '@/server/services/order-service'

const schema = z.object({
  orderCode: z.string().min(1).max(50),
  email: z.string().email().max(255),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please enter a valid order code and email.' }, { status: 400 })
    }

    const { orderCode, email } = parsed.data

    const order = await prisma.order.findFirst({
      where: {
        orderCode: { equals: orderCode, mode: 'insensitive' },
        customerEmail: { equals: email, mode: 'insensitive' },
      },
      include: {
        items: {
          select: { name: true, quantity: true, subtotal: true },
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'No order found with that code and email. Please check and try again.' },
        { status: 404 }
      )
    }

    const shippingAddress = [order.address, order.city, order.postcode, order.country].filter(Boolean).join(', ')
    const production = buildProductionManagementSummary(order)
    const mobileOrder = {
      orderCode: order.orderCode,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.createdAt.toISOString(),
      items: order.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        price: Number(i.subtotal),
      })),
      shippingAddress,
      total: Number(order.total),
      currency: 'EUR',
      productionStage: production.stage,
      estimatedCompletionAt: production.estimatedCompletionAt,
    }

    return NextResponse.json({
      success: true,
      data: mobileOrder,
      order: {
        orderCode: order.orderCode,
        status: order.status,
        customerName: order.customerName,
        address: order.address,
        city: order.city,
        postcode: order.postcode,
        country: order.country,
        subtotal: Number(order.subtotal),
        shipping: Number(order.shipping),
        total: Number(order.total),
        notes: getCustomerOrderNotes(order),
        productionStage: getProductionStage(order),
        production,
        estimatedCompletionAt: production.estimatedCompletionAt,
        createdAt: order.createdAt.toISOString(),
        items: order.items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          subtotal: Number(i.subtotal),
        })),
      },
    })
  } catch (err) {
    console.error('[track-order]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
