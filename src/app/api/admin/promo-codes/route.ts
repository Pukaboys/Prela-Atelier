import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

const PromoSchema = z.object({
  code: z.string().min(1).max(50),
  type: z.enum(['percentage', 'fixed']),
  value: z.number().positive(),
  minOrder: z.number().min(0).default(0),
  maxUses: z.number().int().positive().nullable().default(null),
  expiresAt: z.string().nullable().default(null),
  active: z.boolean().default(true),
})

function serializePromo(p: {
  id: number
  code: string
  type: string
  value: { toNumber: () => number } | number
  minOrder: { toNumber: () => number } | number
  maxUses: number | null
  usedCount: number
  expiresAt: Date | null
  active: boolean
  createdAt: Date
}) {
  return {
    ...p,
    value: Number(p.value),
    minOrder: Number(p.minOrder),
    expiresAt: p.expiresAt?.toISOString() ?? null,
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
  }
}

export async function GET() {
  try {
    await requireAdmin()
    const codes = await prisma.promoCode.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(codes.map(serializePromo))
  } catch (err) {
    console.error('[admin/promo-codes GET]', err)
    return NextResponse.json({ error: 'Failed to load promo codes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const body = await req.json()
    const parsed = PromoSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 422 })
    }

    const { code, type, value, minOrder, maxUses, expiresAt, active } = parsed.data
    const upper = code.trim().toUpperCase()

    const existing = await prisma.promoCode.findUnique({ where: { code: upper } })
    if (existing) {
      return NextResponse.json({ error: 'A promo code with this name already exists.' }, { status: 409 })
    }

    const promo = await prisma.promoCode.create({
      data: {
        code: upper,
        type,
        value,
        minOrder,
        maxUses,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        active,
      },
    })
    return NextResponse.json(serializePromo(promo), { status: 201 })
  } catch (err) {
    console.error('[admin/promo-codes POST]', err)
    return NextResponse.json({ error: 'Failed to create promo code' }, { status: 500 })
  }
}
