import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const checks: Record<string, string> = {
    DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'MISSING',
    SESSION_SECRET: process.env.SESSION_SECRET ? 'set' : 'MISSING (using fallback)',
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'set' : 'MISSING',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'set' : 'MISSING',
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

  const allRequired = process.env.DATABASE_URL && process.env.STRIPE_SECRET_KEY
  return NextResponse.json(
    { status: allRequired ? 'ok' : 'degraded', env: checks, db: dbStatus },
    { status: allRequired ? 200 : 503 }
  )
}
