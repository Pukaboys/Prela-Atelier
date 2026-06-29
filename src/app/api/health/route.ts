import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const hasVisaCert = Boolean(process.env.VISA_CLIENT_CERT_PEM || process.env.VISA_CLIENT_CERT_PATH)
  const hasVisaKey = Boolean(process.env.VISA_CLIENT_KEY_PEM || process.env.VISA_CLIENT_KEY_PATH)
  const hasVisaCaBundle = Boolean(process.env.VISA_CA_BUNDLE_PEM || process.env.VISA_CA_BUNDLE_PATH)

  const checks: Record<string, string> = {
    DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'MISSING',
    SESSION_SECRET: process.env.SESSION_SECRET ? 'set' : 'MISSING (using fallback)',
    VISA_API_BASE_URL: process.env.VISA_API_BASE_URL ? 'set' : 'MISSING',
    VISA_API_USERNAME: process.env.VISA_API_USERNAME ? 'set' : 'MISSING',
    VISA_CLIENT_CERT: hasVisaCert ? 'set' : 'MISSING',
    VISA_CLIENT_KEY: hasVisaKey ? 'set' : 'MISSING',
    VISA_CA_BUNDLE: hasVisaCaBundle ? 'set' : 'MISSING',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? '(using localhost default)',
    NODE_ENV: process.env.NODE_ENV ?? 'not set',
  }

  let dbStatus = 'not tested'
  if (process.env.DATABASE_URL) {
    try {
      const prisma = (await import('@/lib/db')).default
      await prisma.$queryRaw`SELECT 1`
      dbStatus = 'connected'
    } catch (err) {
      dbStatus = `error: ${err instanceof Error ? err.message : String(err)}`
    }
  }

  const allRequired =
    process.env.DATABASE_URL &&
    process.env.VISA_API_BASE_URL &&
    process.env.VISA_API_USERNAME &&
    hasVisaCert &&
    hasVisaKey
  return NextResponse.json(
    { status: allRequired ? 'ok' : 'degraded', env: checks, db: dbStatus },
    { status: allRequired ? 200 : 503 }
  )
}
