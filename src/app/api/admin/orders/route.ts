import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { listOrdersForAdmin } from '@/server/services/order-service'

export async function GET() {
  await requireAdmin()

  return NextResponse.json(await listOrdersForAdmin())
}
