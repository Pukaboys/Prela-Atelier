import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { calculateCustomOrderQuote } from '@/server/services/custom-order-service'
import { customOrderCalculationSchema } from '@/server/validations/custom-order'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = customOrderCalculationSchema.safeParse({
      widthCm: Number(body.widthCm),
      heightCm: Number(body.heightCm),
      thicknessCm:
        body.thicknessCm === '' || body.thicknessCm === null || body.thicknessCm === undefined
          ? null
          : Number(body.thicknessCm),
      quantity: body.quantity === undefined ? 1 : Number(body.quantity),
      materialId: Number(body.materialId),
    })

    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message ?? 'Invalid custom order details.'
      return NextResponse.json({ ok: false, error: message }, { status: 400 })
    }

    const quote = await calculateCustomOrderQuote(parsed.data)
    const session = await getSession()
    session.customOrderQuote = quote
    await session.save()

    return NextResponse.json({ ok: true, success: true, quote, data: quote })
  } catch (err) {
    console.error('[custom-order/calculate]', err)
    return NextResponse.json(
      { ok: false, error: 'Unable to calculate a custom quote right now.' },
      { status: 500 },
    )
  }
}
