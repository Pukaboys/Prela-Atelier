import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateCustomerLoginCode, storeCustomerLoginCode } from '@/lib/customer-auth'
import { sendCustomerLoginCode } from '@/lib/mailer'

const schema = z.object({
  email: z.string().email().max(255),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Please enter a valid email.' }, { status: 400 })
    }

    const email = parsed.data.email.trim().toLowerCase()
    const code = generateCustomerLoginCode()

    await storeCustomerLoginCode(email, code)
    await sendCustomerLoginCode({ to: email, code })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[auth/mobile/request-code]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
