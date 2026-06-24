import { randomBytes } from 'crypto'

// ── Image URL ────────────────────────────────────────────────────────
export function productImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) return '/assets/img/placeholder.svg'
  if (imagePath.startsWith('http')) return imagePath     // Vercel Blob or external URL
  if (imagePath.startsWith('/')) return imagePath        // absolute path
  return `/images/products/${imagePath}`                 // legacy bare filename
}

// ── Price formatting ─────────────────────────────────────────────────
export type CurrencyCode = 'EUR' | 'USD' | 'GBP'

export interface CurrencyFormatOptions {
  currency?: CurrencyCode | string
  usdRate?: number | string
  gbpRate?: number | string
  locale?: string
}

const CURRENCY_LOCALES: Record<CurrencyCode, string> = {
  EUR: 'fr-FR',
  USD: 'en-US',
  GBP: 'en-GB',
}

export function normalizeCurrencyCode(value: string | undefined): CurrencyCode {
  const upper = value?.toUpperCase()
  if (upper === 'USD' || upper === 'GBP') return upper
  return 'EUR'
}

export function getCurrencyFormatOptions(settings: Record<string, string>): CurrencyFormatOptions {
  return {
    currency: normalizeCurrencyCode(settings.display_currency),
    usdRate: settings.currency_usd_rate,
    gbpRate: settings.currency_gbp_rate,
  }
}

export function convertFromEur(price: number, options: CurrencyFormatOptions = {}) {
  const currency = normalizeCurrencyCode(options.currency)
  if (currency === 'USD') return price * (Number(options.usdRate) || 1)
  if (currency === 'GBP') return price * (Number(options.gbpRate) || 1)
  return price
}

export function formatPrice(
  price: number | string | { toNumber: () => number },
  options: CurrencyFormatOptions = {}
): string {
  let num: number
  if (typeof price === 'object' && 'toNumber' in price) {
    num = price.toNumber()
  } else {
    num = Number(price)
  }
  const currency = normalizeCurrencyCode(options.currency)
  return new Intl.NumberFormat(options.locale ?? CURRENCY_LOCALES[currency], {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(convertFromEur(num, options))
}

// ── Order code generation ────────────────────────────────────────────
export function generateOrderCode(): string {
  return `PRL-${randomBytes(4).toString('hex').toUpperCase()}`
}

// ── Slug generation ───────────────────────────────────────────────────
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ── Shipping calculation ─────────────────────────────────────────────
export const SHIPPING_FREE_THRESHOLD = 500
export const SHIPPING_EU = 95
export const SHIPPING_INTL = 45

/** Countries that qualify for the EU shipping rate */
const EU_COUNTRIES = new Set([
  'Albania','Andorra','Austria','Belarus','Belgium','Bosnia and Herzegovina',
  'Bulgaria','Croatia','Cyprus','Czech Republic','Denmark','Estonia','Finland',
  'France','Germany','Greece','Hungary','Iceland','Ireland','Italy','Kosovo',
  'Latvia','Liechtenstein','Lithuania','Luxembourg','Malta','Moldova','Monaco',
  'Montenegro','Netherlands','North Macedonia','Norway','Poland','Portugal',
  'Romania','San Marino','Serbia','Slovakia','Slovenia','Spain','Sweden',
  'Switzerland','Ukraine','United Kingdom','Vatican City',
])

export function calculateShipping(
  subtotal: number,
  country = 'France',
  rates?: { freeThreshold?: number; euRate?: number; intlRate?: number }
): number {
  const freeThreshold = rates?.freeThreshold ?? SHIPPING_FREE_THRESHOLD
  const euRate = rates?.euRate ?? SHIPPING_EU
  const intlRate = rates?.intlRate ?? SHIPPING_INTL
  if (subtotal >= freeThreshold) return 0
  if (country === 'Albania') return 0
  return EU_COUNTRIES.has(country) ? euRate : intlRate
}

// ── Sanitize string for output ────────────────────────────────────────
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
