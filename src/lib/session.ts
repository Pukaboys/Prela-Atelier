import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import type { SessionData } from '@/types'

export const sessionOptions = {
  password:
    process.env.SESSION_SECRET ?? 'prela-atelier-fallback-secret-key-32chars!!',
  cookieName: 'prela_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
}

export async function getSession() {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, sessionOptions)
}
