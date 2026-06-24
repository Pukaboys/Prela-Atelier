import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyCustomerLoginCode } from '@/lib/customer-auth'

const schema = z.object({
  email: z.string().email().max(255),
  code: z.string().regex(/^\d{6}$/),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Please enter the 6-digit code.' }, { status: 400 })
    }

    const session = await verifyCustomerLoginCode(parsed.data.email, parsed.data.code)
    if (!session) {
      return NextResponse.json({ error: 'Invalid or expired confirmation code.' }, { status: 401 })
    }

    return NextResponse.json({ success: true, data: session })
  } catch (err) {
    console.error('[auth/mobile/verify-code]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
