import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  const session = await requireAdmin()
  const admin = await prisma.admin.findUnique({
    where: { id: session.adminId },
    select: { id: true, username: true },
  })
  if (!admin) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const emailSetting = await prisma.setting.findUnique({ where: { key: 'admin_email' } })

  return NextResponse.json({ ...admin, email: emailSetting?.value ?? '' })
}
