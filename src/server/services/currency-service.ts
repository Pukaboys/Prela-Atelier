import { cookies } from 'next/headers'
import {
  getCurrencyFormatOptions,
  normalizeCurrencyCode,
  type CurrencyCode,
  type CurrencyFormatOptions,
} from '@/lib/helpers'
import { getSettings } from '@/lib/settings'
import { USER_CURRENCY_COOKIE } from '@/lib/currency-preferences'

function parseCurrency(value: string | undefined): CurrencyCode | null {
  const upper = value?.toUpperCase()
  if (upper === 'EUR' || upper === 'USD' || upper === 'GBP') return upper
  return null
}

export async function getDisplayCurrencyOptions(
  settingsOverride?: Record<string, string>
): Promise<CurrencyFormatOptions & { currency: CurrencyCode }> {
  const settings = settingsOverride ?? await getSettings()
  const baseOptions = getCurrencyFormatOptions(settings)
  const cookieStore = await cookies()
  const selectedCurrency = parseCurrency(cookieStore.get(USER_CURRENCY_COOKIE)?.value)

  return {
    ...baseOptions,
    currency: selectedCurrency ?? normalizeCurrencyCode(String(baseOptions.currency)),
  }
}
