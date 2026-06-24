'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { SiteBanner } from './SiteBanner'
import { CurrencySelector } from './CurrencySelector'
import { LanguageSwitcher } from './LanguageSwitcher'
import type { CurrencyCode } from '@/lib/helpers'
import { useLanguage } from '@/components/providers/LanguageProvider'

interface NavProps {
  cartCount: number
  currency: CurrencyCode
  banner?: { text: string; bg: string; textColor: string; dismissKey: string; pinned: boolean }
}

export function Nav({ cartCount, currency, banner }: NavProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const { dictionary } = useLanguage()

  const navLinks = [
    { href: '/collections', label: dictionary.nav.collections },
    { href: '/materials', label: dictionary.nav.materials },
    { href: '/bespoke', label: dictionary.nav.bespoke },
    { href: '/about', label: dictionary.nav.about },
  ]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ${
        scrolled || menuOpen
          ? 'bg-cream/96 backdrop-blur-sm border-b border-beige shadow-card'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-serif text-xl md:text-2xl tracking-[0.2em] text-stone hover:text-gold transition-colors duration-300"
          >
            <Image src="/logo.svg" alt="" width={28} height={28} className="opacity-80" />
            PRELA ATELIER
          </Link>

          <nav className="hidden md:flex items-center gap-10" aria-label={dictionary.nav.mainNavigation}>
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`text-[11px] tracking-widest uppercase font-sans transition-colors duration-200 relative group ${
                  pathname === href ? 'text-gold' : 'text-stone hover:text-gold'
                }`}
              >
                {label}
                <span
                  className={`absolute -bottom-1 left-0 h-px bg-gold transition-all duration-300 ${
                    pathname === href ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}
                />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-5">
            <LanguageSwitcher className="hidden sm:inline-flex" />
            <CurrencySelector value={currency} className="hidden sm:inline-flex" />

            <Link
              href="/cart"
              className="relative text-stone hover:text-gold transition-colors duration-200"
              aria-label={dictionary.nav.cartAria(cartCount)}
            >
              <CartIcon />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-gold text-white text-[10px] rounded-full flex items-center justify-center font-sans font-medium">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden text-stone hover:text-gold transition-colors duration-200 p-1"
              aria-label={menuOpen ? dictionary.nav.closeMenu : dictionary.nav.openMenu}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav
            className="md:hidden pb-8 border-t border-beige pt-6 flex flex-col gap-5"
            aria-label={dictionary.nav.mobileNavigation}
          >
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`text-[11px] tracking-widest uppercase font-sans transition-colors duration-200 ${
                  pathname === href ? 'text-gold' : 'text-stone hover:text-gold'
                }`}
              >
                {label}
              </Link>
            ))}
            <Link
              href="/cart"
              className="text-[11px] tracking-widest uppercase font-sans text-stone hover:text-gold transition-colors duration-200"
            >
              {dictionary.nav.cart} {cartCount > 0 && `(${cartCount})`}
            </Link>
            <div className="pt-1">
              <p className="text-[10px] tracking-widest uppercase font-sans text-stone-pale mb-2">
                {dictionary.nav.language}
              </p>
              <LanguageSwitcher />
            </div>
            <div className="pt-1">
              <p className="text-[10px] tracking-widest uppercase font-sans text-stone-pale mb-2">
                {dictionary.currency.label}
              </p>
              <CurrencySelector value={currency} />
            </div>
          </nav>
        )}
      </div>
      {banner && (
        <SiteBanner
          text={banner.text}
          bg={banner.bg}
          textColor={banner.textColor}
          dismissKey={banner.dismissKey}
          pinned={banner.pinned}
        />
      )}
    </header>
  )
}

function CartIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
