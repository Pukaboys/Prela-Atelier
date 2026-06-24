'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Re-runs on every route change so elements on newly-rendered pages are
 * observed. A 60ms delay lets React finish painting before attaching.
 * Only selects elements that haven't been revealed yet.
 */
export function ScrollReveal() {
  const pathname = usePathname()

  useEffect(() => {
    let observer: IntersectionObserver | null = null

    const timer = setTimeout(() => {
      const elements = document.querySelectorAll<Element>('[data-reveal]:not([data-visible])')
      if (!elements.length) return

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.setAttribute('data-visible', '')
              observer?.unobserve(entry.target)
            }
          })
        },
        { threshold: 0.05, rootMargin: '0px 0px -30px 0px' },
      )

      elements.forEach((el) => observer!.observe(el))
    }, 60)

    return () => {
      clearTimeout(timer)
      observer?.disconnect()
    }
  }, [pathname])

  return null
}
