import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { createBespokePaymentLink } from '@/server/services/bespoke-payment-link-service'

const schema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().max(1000).optional().default(''),
  amountEur: z.number().positive().max(100000),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const enquiryId = Number(id)
  if (!Number.isInteger(enquiryId) || enquiryId <= 0) {
    return NextResponse.json({ error: 'Invalid enquiry id.' }, { status: 400 })
  }

  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please enter a title and valid amount.' }, { status: 400 })
  }

  try {
    const link = await createBespokePaymentLink({ enquiryId, ...parsed.data })
    return NextResponse.json({ link }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not create payment link.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
