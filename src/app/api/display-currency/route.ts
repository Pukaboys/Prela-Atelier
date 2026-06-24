import { NextResponse } from 'next/server'
import { getDisplayCurrencyOptions } from '@/server/services/currency-service'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(await getDisplayCurrencyOptions())
}
