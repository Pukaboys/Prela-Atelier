import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  await requireAdmin()
  const row = await prisma.setting.findUnique({ where: { key: 'login_activity' } })
  const log = row ? JSON.parse(row.value) : []
  return NextResponse.json(log)
}

export async function DELETE() {
  await requireAdmin()
  await prisma.setting.deleteMany({ where: { key: 'login_activity' } })
  return NextResponse.json({ ok: true })
}
