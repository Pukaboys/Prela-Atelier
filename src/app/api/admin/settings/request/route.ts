import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { sendAdminConfirmCode } from '@/lib/mailer'
import { applyAdminSettingsUpdate } from '@/server/services/admin-settings-service'

const schema = z.object({
  settings: z.record(z.string()),
  username: z.string().min(1).max(100).optional(),
  email: z.string().email().max(255).or(z.literal('')).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).max(200).optional(),
})

export async function POST(request: NextRequest) {
  const session = await requireAdmin()
  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { settings, username, email, currentPassword, newPassword } = parsed.data

  const admin = await prisma.admin.findUnique({ where: { id: session.adminId } })
  if (!admin) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: 'Current password is required to set a new password.' }, { status: 400 })
    }
    const valid = await bcrypt.compare(currentPassword, admin.password)
    if (!valid) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 })
    }
  }

  const emailSetting = await prisma.setting.findUnique({ where: { key: 'admin_email' } })
  const adminEmail = emailSetting?.value ?? ''

  const passwordHash = newPassword ? await bcrypt.hash(newPassword, 12) : undefined
  const code = String(Math.floor(100000 + Math.random() * 900000))
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

  const pending = {
    code,
    settings,
    account: { username, email },
    ...(passwordHash ? { passwordHash } : {}),
    expiresAt,
  }

  if (!adminEmail) {
    // No email configured — apply immediately
    await applyAdminSettingsUpdate(session.adminId!, settings, { username, email }, passwordHash)
    return NextResponse.json({ ok: true, saved: true })
  }

  await prisma.setting.upsert({
    where: { key: 'admin_pending_save' },
    update: { value: JSON.stringify(pending) },
    create: { key: 'admin_pending_save', value: JSON.stringify(pending) },
  })

  await sendAdminConfirmCode({ to: adminEmail, code })

  return NextResponse.json({ ok: true, requiresConfirmation: true })
}
