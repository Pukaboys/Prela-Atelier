import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { getMaterialPriceMap, setMaterialPrice } from '@/lib/material-pricing'

const MaterialSchema = z.object({
  name: z.string().min(1),
  origin: z.string().min(1),
  description: z.string().optional().default(''),
  hardness: z.string().optional().default(''),
  tone: z.string().optional().default(''),
  veining: z.string().optional().default(''),
  pricePerM2Eur: z.number().min(0).nullable().optional().default(null),
  imagePath: z.string().optional().default(''),
  sortOrder: z.number().int().default(0),
  visible: z.boolean().default(true),
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

export async function GET() {
  await requireAdmin()
  const materials = await prisma.material.findMany({
    orderBy: { sortOrder: 'asc' },
    select: adminMaterialSelect,
  })

  const priceMap = await getMaterialPriceMap(materials.map((material) => material.id))

  return NextResponse.json(
    materials.map((material) => serializeMaterial(material, priceMap.get(material.id) ?? null)),
  )
}

export async function POST(req: NextRequest) {
  await requireAdmin()
  const body = await req.json()
  const parsed = MaterialSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 422 })
  }
  const { name, origin, description, hardness, tone, veining, pricePerM2Eur, imagePath, sortOrder, visible } = parsed.data
  try {
    const material = await prisma.material.create({
      data: {
        name,
        origin,
        description,
        hardness: hardness || null,
        tone: tone || null,
        veining: veining || null,
        imagePath: imagePath || null,
        sortOrder,
        visible,
      },
      select: adminMaterialSelect,
    })
    await setMaterialPrice(material.id, pricePerM2Eur)

    return NextResponse.json(serializeMaterial(material, pricePerM2Eur), { status: 201 })
  } catch (error) {
    console.error('[api/admin/materials][POST]', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'A material with this data already exists.' }, { status: 409 })
    }

    return NextResponse.json({ error: 'Unable to create material.' }, { status: 500 })
  }
}
