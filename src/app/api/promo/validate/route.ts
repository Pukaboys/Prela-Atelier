import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import { getSession } from '@/lib/session'

const schema = z.object({
  code: z.string().min(1).max(50),
  subtotal: z.number().positive(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { code, subtotal } = parsed.data
    const upper = code.trim().toUpperCase()

    const promo = await prisma.promoCode.findUnique({ where: { code: upper } })

    if (!promo || !promo.active) {
      return NextResponse.json({ error: 'Invalid promo code' }, { status: 404 })
    }

    if (promo.expiresAt && promo.expiresAt < new Date()) {
      return NextResponse.json({ error: 'This promo code has expired' }, { status: 410 })
    }

    if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
      return NextResponse.json({ error: 'This promo code has reached its usage limit' }, { status: 410 })
    }

    const minOrder = Number(promo.minOrder)
    if (subtotal < minOrder) {
      return NextResponse.json(
        { error: `Minimum order of €${minOrder.toFixed(0)} required for this code` },
        { status: 422 }
      )
    }

    const value = Number(promo.value)
    const type = promo.type as 'percentage' | 'fixed'
    let discount: number
    if (type === 'percentage') {
      discount = Math.round((value / 100) * subtotal * 100) / 100
    } else {
      discount = Math.min(value, subtotal)
    }

    const session = await getSession()
    session.appliedPromo = { code: upper, type, value, discount }
    await session.save()

    return NextResponse.json({
      success: true,
      data: {
        valid: true,
        code: upper,
        type,
        value,
        discount,
      },
      code: upper,
      type,
      value,
      discount,
    })
  } catch (err) {
    console.error('[promo/validate]', err)
    return NextResponse.json({ error: 'Failed to validate promo code' }, { status: 500 })
  }
}
