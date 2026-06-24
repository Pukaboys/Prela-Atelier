import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/db'
import { getSettings } from '@/lib/settings'

export async function GET() {
  await requireAdmin()
  const settings = await getSettings()
  return NextResponse.json(settings)
}

export async function PATCH(request: NextRequest) {
  await requireAdmin()
  const body = await request.json() as Record<string, string>

  await Promise.all(
    Object.entries(body).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    )
  )

  return NextResponse.json({ ok: true })
}
