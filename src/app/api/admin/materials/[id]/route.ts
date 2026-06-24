import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { getMaterialPrice, getMaterialPriceSettingKey, setMaterialPrice } from '@/lib/material-pricing'

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  origin: z.string().min(1).optional(),
  description: z.string().optional(),
  hardness: z.string().optional(),
  tone: z.string().optional(),
  veining: z.string().optional(),
  pricePerM2Eur: z.number().min(0).nullable().optional(),
  imagePath: z.string().optional(),
  sortOrder: z.number().int().optional(),
  visible: z.boolean().optional(),
})

const adminMaterialSelect = {
  id: true,
  name: true,
  origin: true,
  description: true,
  hardness: true,
  tone: true,
  veining: true,
  imagePath: true,
  sortOrder: true,
  visible: true,
} as const

function serializeMaterial(material: Record<string, unknown>, pricePerM2Eur: number | null) {
  return {
    ...material,
    pricePerM2Eur,
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const numId = parseInt(id)
  if (isNaN(numId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const body = await req.json()
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 422 })
  }

  try {
    const { pricePerM2Eur, ...materialData } = parsed.data
    const material = await prisma.material.update({
      where: { id: numId },
      data: materialData,
      select: adminMaterialSelect,
    })

    const shouldUpdatePrice = Object.prototype.hasOwnProperty.call(parsed.data, 'pricePerM2Eur')
    if (shouldUpdatePrice) {
      await setMaterialPrice(numId, pricePerM2Eur ?? null)
    }

    const resolvedPrice = shouldUpdatePrice
      ? pricePerM2Eur ?? null
      : await getMaterialPrice(numId)

    return NextResponse.json(serializeMaterial(material, resolvedPrice))
  } catch (error) {
    console.error('[api/admin/materials][PUT]', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Material not found.' }, { status: 404 })
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'A material with this data already exists.' }, { status: 409 })
    }

    return NextResponse.json({ error: 'Unable to save material.' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const numId = parseInt(id)
  if (isNaN(numId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  try {
    await prisma.material.delete({ where: { id: numId } })
    await prisma.setting.deleteMany({ where: { key: getMaterialPriceSettingKey(numId) } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[api/admin/materials][DELETE]', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Material not found.' }, { status: 404 })
    }

    return NextResponse.json({ error: 'Unable to delete material.' }, { status: 500 })
  }
}
