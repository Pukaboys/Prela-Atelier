import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import { sendContactConfirmation, sendContactNotification } from '@/lib/mailer'

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  subject: z.string().max(100).optional().default(''),
  message: z.string().min(1).max(5000),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Please fill in all required fields.' }, { status: 400 })
    }
    const { name, email, subject, message } = parsed.data
    await prisma.contactMessage.create({
      data: {
        name,
        email,
        subject: subject || null,
        message,
      },
    })

    await Promise.allSettled([
      sendContactConfirmation({ to: email, name, subject, message }),
      sendContactNotification({ name, email, subject, message }),
    ])

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[contact]', err)
    return NextResponse.json({ ok: false, error: 'Something went wrong.' }, { status: 500 })
  }
}
