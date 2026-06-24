import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

const AddSchema = z.object({ url: z.string().min(1) })

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const numId = parseInt(id)
  if (isNaN(numId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const images = await prisma.productImage.findMany({
    where: { productId: numId },
    orderBy: { sortOrder: 'asc' },
  })
  return NextResponse.json(images)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const numId = parseInt(id)
  if (isNaN(numId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const body = await req.json()
  const parsed = AddSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'URL required.' }, { status: 422 })

  const count = await prisma.productImage.count({ where: { productId: numId } })
  const image = await prisma.productImage.create({
    data: { productId: numId, url: parsed.data.url, sortOrder: count },
  })
  return NextResponse.json(image, { status: 201 })
}
