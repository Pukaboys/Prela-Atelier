import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import {
  generateBusinessReport,
  parseReportRequest,
} from '@/server/services/report-service'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  await requireAdmin()

  const { type: rawType } = await params
  const { type, format, filters } = parseReportRequest(
    rawType,
    request.nextUrl.searchParams.get('format'),
    request.nextUrl.searchParams.get('from'),
    request.nextUrl.searchParams.get('to'),
  )

  if (!type) {
    return NextResponse.json({ error: 'Unknown report type.' }, { status: 404 })
  }

  const report = await generateBusinessReport(type, format, filters)

  return new NextResponse(report.body, {
    headers: {
      'Content-Type': report.contentType,
      'Content-Disposition': `attachment; filename="${report.filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
