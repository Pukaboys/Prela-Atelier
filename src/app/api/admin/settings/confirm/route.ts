import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { sendAdminEmailChangeNotification } from '@/lib/mailer'
import { applyAdminSettingsUpdate } from '@/server/services/admin-settings-service'

const schema = z.object({ code: z.string().length(6) })

export async function POST(request: NextRequest) {
  const session = await requireAdmin()
  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid code.' }, { status: 400 })
  }

  const pending = await prisma.setting.findUnique({ where: { key: 'admin_pending_save' } })
  if (!pending) {
    return NextResponse.json({ error: 'No pending changes found.' }, { status: 400 })
  }

  const { code, settings, account, passwordHash, expiresAt } = JSON.parse(pending.value) as {
    code: string
    settings: Record<string, string>
    account: { username?: string; email?: string }
    passwordHash?: string
    expiresAt: string
  }

  if (new Date() > new Date(expiresAt)) {
    await prisma.setting.delete({ where: { key: 'admin_pending_save' } })
    return NextResponse.json({ error: 'Code expired. Please try again.' }, { status: 400 })
  }

  if (parsed.data.code !== code) {
    return NextResponse.json({ error: 'Incorrect code.' }, { status: 400 })
  }

  // Read old email before applying changes
  const oldEmailSetting = await prisma.setting.findUnique({ where: { key: 'admin_email' } })
  const oldEmail = oldEmailSetting?.value ?? ''

  await applyAdminSettingsUpdate(session.adminId!, settings, account, passwordHash)

  // Notify old email if email changed
  if (account.email !== undefined && account.email !== oldEmail && oldEmail) {
    await sendAdminEmailChangeNotification({ oldEmail, newEmail: account.email })
  }

  await prisma.setting.delete({ where: { key: 'admin_pending_save' } })

  return NextResponse.json({ ok: true })
}
