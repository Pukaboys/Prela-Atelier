'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const NAV_ITEMS = [
  {
    href: '/admin',
    label: 'Dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
    exact: true,
  },
  {
    href: '/admin/products',
    label: 'Products',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      </svg>
    ),
    exact: false,
  },
  {
    href: '/admin/orders',
    label: 'Orders',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    exact: false,
  },
  {
    href: '/admin/materials',
    label: 'Materials',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    ),
    exact: false,
  },
  {
    href: '/admin/enquiries',
    label: 'Enquiries',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
    exact: false,
  },
  {
    href: '/admin/clients',
    label: 'Clients',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    exact: false,
  },
  {
    href: '/admin/promo-codes',
    label: 'Promo Codes',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
    exact: false,
  },
  {
    href: '/admin/settings',
    label: 'Settings',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
    exact: false,
  },
]

interface AdminNavProps {
  collapsed: boolean
  onToggleCollapse: () => void
}

export function AdminNav({ collapsed, onToggleCollapse }: AdminNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin-login')
    router.refresh()
  }

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-stone/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-stone flex flex-col z-40 transition-all duration-300
          ${collapsed ? 'w-16' : 'w-60'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo row */}
        <div className="px-4 py-5 border-b border-stone-light flex items-center min-h-[64px]">
          {collapsed ? (
            <Link href="/admin" className="mx-auto">
              <span className="font-serif text-lg text-gold">P</span>
            </Link>
          ) : (
            <Link href="/admin" className="flex-1 min-w-0">
              <p className="font-serif text-xl tracking-[0.15em] text-beige-light">PRELA</p>
              <p className="text-[10px] tracking-widest uppercase text-gold mt-0.5 font-sans">Admin Panel</p>
            </Link>
          )}
          {/* Desktop collapse toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center text-stone-pale hover:text-beige transition-colors shrink-0 ml-2"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              {collapsed ? (
                <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
              ) : (
                <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 5 5 12 12 19"/></>
              )}
            </svg>
          </button>
          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden flex items-center justify-center text-stone-pale hover:text-beige transition-colors ml-auto"
            aria-label="Close menu"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-2 py-6 flex flex-col gap-1 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-3 px-3 py-3 text-sm font-sans rounded-sm transition-all duration-200
                  ${collapsed ? 'justify-center' : ''}
                  ${isActive ? 'bg-gold text-white' : 'text-stone-pale hover:text-beige hover:bg-stone-light'}
                `}
              >
                <span className={isActive ? 'text-white' : 'text-stone-pale'}>{icon}</span>
                {!collapsed && label}
              </Link>
            )
          })}
        </nav>

        {/* Bottom actions */}
        <div className="px-2 py-5 border-t border-stone-light">
          <Link
            href="/"
            target="_blank"
            title={collapsed ? 'View site' : undefined}
            className={`flex items-center gap-2 text-xs text-stone-pale hover:text-gold transition-colors px-3 py-2 mb-1 font-sans ${collapsed ? 'justify-center' : ''}`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            {!collapsed && 'View site'}
          </Link>
          <button
            onClick={handleLogout}
            title={collapsed ? 'Sign out' : undefined}
            className={`flex items-center gap-2 w-full text-left text-xs text-stone-pale hover:text-red-400 transition-colors px-3 py-2 font-sans ${collapsed ? 'justify-center' : ''}`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {!collapsed && 'Sign out'}
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20 flex items-center gap-3 px-4 h-[52px] bg-stone border-b border-stone-light">
        <button
          onClick={() => setMobileOpen(true)}
          className="text-stone-pale hover:text-beige transition-colors"
          aria-label="Open menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <Link href="/admin">
          <p className="font-serif text-lg tracking-[0.15em] text-beige-light">PRELA</p>
        </Link>
      </div>
    </>
  )
}
