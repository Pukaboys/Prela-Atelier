import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

const UpdateSchema = z.object({
  status: z.enum(['new', 'read', 'replied', 'closed']).optional(),
  notes: z.string().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const numId = parseInt(id)
  if (isNaN(numId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const body = await req.json()
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 422 })
  }

  if (!parsed.data.status && parsed.data.notes === undefined) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 })
  }

  try {
    const enquiry = await prisma.bespokeEnquiry.update({
      where: { id: numId },
      data: parsed.data,
    })
    return NextResponse.json(enquiry)
  } catch {
    return NextResponse.json({ error: 'Enquiry not found.' }, { status: 404 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const numId = parseInt(id)
  if (isNaN(numId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  try {
    await prisma.bespokeEnquiry.delete({ where: { id: numId } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Enquiry not found.' }, { status: 404 })
  }
}
