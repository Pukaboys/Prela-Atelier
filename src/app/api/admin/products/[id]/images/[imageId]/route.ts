import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  await requireAdmin()
  const { imageId } = await params
  const numId = parseInt(imageId)
  if (isNaN(numId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  try {
    await prisma.productImage.delete({ where: { id: numId } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Image not found.' }, { status: 404 })
  }
}
