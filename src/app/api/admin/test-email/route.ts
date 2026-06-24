import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import nodemailer from 'nodemailer'

export async function GET() {
  await requireAdmin()

  const config = {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    adminEmail: process.env.ADMIN_EMAIL,
  }

  if (!config.host) {
    return NextResponse.json({ ok: false, error: 'SMTP_HOST is not set', config })
  }

  try {
    const transport = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    await transport.verify()

    await transport.sendMail({
      from: `"Prela Atelier" <hello@prela-atelier.com>`,
      to: config.adminEmail ?? 'hello@prela-atelier.com',
      subject: 'Prela Atelier — Email test',
      html: '<p>SMTP is working correctly.</p>',
    })

    return NextResponse.json({ ok: true, message: 'Test email sent', config })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: message, config }, { status: 500 })
  }
}
