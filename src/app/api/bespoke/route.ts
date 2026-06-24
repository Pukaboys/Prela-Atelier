import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { createBespokeEnquiry } from '@/server/services/bespoke-service'
import { formatCustomOrderQuoteSummary } from '@/server/services/custom-order-service'
import { bespokeEnquirySchema } from '@/server/validations/bespoke'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = bespokeEnquirySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Please fill in all required fields.' }, { status: 400 })
    }

    const session = await getSession()
    const quoteSummary = session.customOrderQuote
      ? formatCustomOrderQuoteSummary(session.customOrderQuote)
      : undefined

    await createBespokeEnquiry({
      ...parsed.data,
      notes: quoteSummary,
      quoteSummary,
    })

    session.customOrderQuote = undefined
    await session.save()

    return NextResponse.json({ ok: true, success: true })
  } catch (err) {
    console.error('[bespoke]', err)
    return NextResponse.json({ ok: false, error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
