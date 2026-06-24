import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { z } from 'zod'

const patchSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().optional(),
  country: z.string().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  await requireAdmin()
  const { email } = await params
  const decodedEmail = decodeURIComponent(email)

  const body = await request.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }

  const { email: newEmail, name, phone, address, city, postcode, country } = parsed.data

  await prisma.order.updateMany({
    where: { customerEmail: { equals: decodedEmail, mode: 'insensitive' } },
    data: {
      ...(newEmail ? { customerEmail: newEmail } : {}),
      ...(name ? { customerName: name } : {}),
      ...(phone !== undefined ? { customerPhone: phone } : {}),
      ...(address ? { address } : {}),
      ...(city ? { city } : {}),
      ...(postcode ? { postcode } : {}),
      ...(country ? { country } : {}),
    },
  })

  return NextResponse.json({ ok: true })
}
