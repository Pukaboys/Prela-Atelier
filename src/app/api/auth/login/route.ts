import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import prisma from '@/lib/db'
import { getSession } from '@/lib/session'
import { isRateLimited, recordFailedAttempt, resetAttempts } from '@/lib/rate-limit'

const schema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(200),
})

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1'
  )
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)

  const { limited, resetIn } = isRateLimited(ip)
  if (limited) {
    return NextResponse.json(
      { error: `Too many login attempts. Try again in ${resetIn} seconds.` },
      { status: 429, headers: { 'Retry-After': String(resetIn) } }
    )
  }

  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const { username, password } = parsed.data

    const admin = await prisma.admin.findUnique({ where: { username } })

    // Always run bcrypt compare to prevent timing-based user enumeration
    const passwordValid = admin
      ? await bcrypt.compare(password, admin.password)
      : await bcrypt.compare(password, '$2b$12$invalidhashpadding000000000000000000000000000000000000') && false

    if (!admin || !passwordValid) {
      recordFailedAttempt(ip)
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
    }

    resetAttempts(ip)

    // Get current session nonce so this session can be validated later
    const nonceRow = await prisma.setting.findUnique({ where: { key: 'admin_session_nonce' } })
    const nonce = nonceRow?.value ?? ''

    const session = await getSession()
    session.adminId = admin.id
    session.sessionNonce = nonce
    await session.save()

    // Log login activity (keep last 20)
    try {
      const ua = request.headers.get('user-agent') ?? ''
      const entry = { ip, ua, at: new Date().toISOString() }
      const existing = await prisma.setting.findUnique({ where: { key: 'login_activity' } })
      const log: typeof entry[] = existing ? JSON.parse(existing.value) : []
      log.unshift(entry)
      if (log.length > 20) log.length = 20
      await prisma.setting.upsert({
        where: { key: 'login_activity' },
        update: { value: JSON.stringify(log) },
        create: { key: 'login_activity', value: JSON.stringify(log) },
      })
    } catch { /* non-fatal */ }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[auth/login]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
