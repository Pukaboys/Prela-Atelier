import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

const UpdateSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  type: z.enum(['percentage', 'fixed']).optional(),
  value: z.number().positive().optional(),
  minOrder: z.number().min(0).optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  active: z.boolean().optional(),
})

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await req.json()
    const parsed = UpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 422 })
    }

    const d = parsed.data
    const data: Record<string, unknown> = {}
    if (d.code !== undefined)      data.code      = d.code.trim().toUpperCase()
    if (d.type !== undefined)      data.type      = d.type
    if (d.value !== undefined)     data.value     = d.value
    if (d.minOrder !== undefined)  data.minOrder  = d.minOrder
    if (d.maxUses !== undefined)   data.maxUses   = d.maxUses
    if (d.expiresAt !== undefined) data.expiresAt = d.expiresAt ? new Date(d.expiresAt) : null
    if (d.active !== undefined)    data.active    = d.active
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 })
    }

    const promo = await prisma.promoCode.update({
      where: { id: parseInt(id) },
      data,
    })

    return NextResponse.json({
      id: promo.id,
      code: promo.code,
      type: promo.type,
      value: Number(promo.value),
      minOrder: Number(promo.minOrder),
      maxUses: promo.maxUses,
      usedCount: promo.usedCount,
      expiresAt: promo.expiresAt?.toISOString() ?? null,
      active: promo.active,
      createdAt: promo.createdAt.toISOString(),
    })
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Promo code not found.' }, { status: 404 })
    }
    console.error('[admin/promo-codes PUT]', err)
    return NextResponse.json({ error: 'Failed to update promo code' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params
    await prisma.promoCode.delete({ where: { id: parseInt(id) } })
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Promo code not found.' }, { status: 404 })
    }
    console.error('[admin/promo-codes DELETE]', err)
    return NextResponse.json({ error: 'Failed to delete promo code' }, { status: 500 })
  }
}
