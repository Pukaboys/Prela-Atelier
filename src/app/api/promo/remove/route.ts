import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

export async function POST() {
  try {
    const session = await getSession()
    session.appliedPromo = undefined
    await session.save()
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[promo/remove]', err)
    return NextResponse.json({ error: 'Failed to remove promo code' }, { status: 500 })
  }
}
