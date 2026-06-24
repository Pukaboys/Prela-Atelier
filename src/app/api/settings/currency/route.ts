import { NextResponse } from 'next/server'
import { getCurrencyFormatOptions } from '@/lib/helpers'
import { getSettings } from '@/lib/settings'

export const dynamic = 'force-dynamic'

export async function GET() {
  const settings = await getSettings()
  return NextResponse.json(getCurrencyFormatOptions(settings))
}
