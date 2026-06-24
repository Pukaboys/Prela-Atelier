import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import prisma from '@/lib/db'

/**
 * Call in admin Server Components/layouts to gate access.
 * If no session or nonce mismatch, redirects to /admin-login.
 */
export async function requireAdmin() {
  const session = await getSession()
  if (!session.adminId) {
    redirect('/admin-login')
  }
  // Validate session nonce — if rotated, all existing sessions are invalidated
  const nonceRow = await prisma.setting.findUnique({ where: { key: 'admin_session_nonce' } })
  const currentNonce = nonceRow?.value ?? ''
  if (currentNonce && session.sessionNonce !== currentNonce) {
    await session.destroy()
    redirect('/admin-login')
  }
  return session
}

/**
 * Returns the admin session or null without redirecting.
 * Useful for conditional UI rendering.
 */
export async function getAdminSession() {
  const session = await getSession()
  if (!session.adminId) return null
  return session
}
