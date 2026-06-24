import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/session'
import { rememberViewedProductId } from '@/server/services/recommendation-service'

const schema = z.object({
  productId: z.coerce.number().int().positive(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const session = await getSession()
    session.viewedProductIds = rememberViewedProductId(session.viewedProductIds, parsed.data.productId)
    await session.save()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[recommendations/viewed]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
