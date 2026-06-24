import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  await requireAdmin()
  const enquiries = await prisma.bespokeEnquiry.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(enquiries)
}
