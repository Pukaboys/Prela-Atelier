declare global {
  interface Window {
    gtag: (...args: unknown[]) => void
  }
}

export function gtagEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', name, params)
  }
}
