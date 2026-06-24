import Stripe from 'stripe'

// Lazy singleton — instantiated on first use so the build succeeds even without env vars.
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY environment variable is not set')
    _stripe = new Stripe(key, { apiVersion: '2025-02-24.acacia' })
  }
  return _stripe
}

// Keep the named export for backwards compatibility with existing imports.
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
