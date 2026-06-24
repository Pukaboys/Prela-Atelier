import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { getSession } from '@/lib/session'

export async function DELETE() {
  await requireAdmin()

  const newNonce = randomBytes(16).toString('hex')
  await prisma.setting.upsert({
    where: { key: 'admin_session_nonce' },
    update: { value: newNonce },
    create: { key: 'admin_session_nonce', value: newNonce },
  })

  // Re-stamp the current session with the new nonce so the caller stays logged in
  const session = await getSession()
  session.sessionNonce = newNonce
  await session.save()

  return NextResponse.json({ ok: true })
}
