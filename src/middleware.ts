import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Edge middleware: checks for the existence of the session cookie before
 * reaching admin routes. The actual session decryption + validation happens
 * in the admin layout (Server Component) via requireAdmin().
 *
 * This provides a fast first line of defense without Edge Runtime crypto concerns.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isAdminRoute =
    pathname === '/admin' ||
    (pathname.startsWith('/admin/') && !pathname.startsWith('/admin-login'))

  if (isAdminRoute) {
    const sessionCookie = request.cookies.get('prela_session')
    if (!sessionCookie?.value) {
      const loginUrl = new URL('/admin-login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
}
