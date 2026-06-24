'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CurrencyCode } from '@/lib/helpers'
import { USER_CURRENCY_COOKIE } from '@/lib/currency-preferences'
import { useLanguage } from '@/components/providers/LanguageProvider'

const CURRENCIES: { value: CurrencyCode; label: string }[] = [
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'USD', label: 'USD - Dollar' },
  { value: 'GBP', label: 'GBP - Pound' },
]

function isCurrencyCode(value: string): value is CurrencyCode {
  return value === 'EUR' || value === 'USD' || value === 'GBP'
}

export function CurrencySelector({
  value,
  className = '',
}: {
  value: CurrencyCode
  className?: string
}) {
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(value)
  const router = useRouter()
  const { dictionary } = useLanguage()

  useEffect(() => {
    setSelectedCurrency(value)
  }, [value])

  function handleChange(nextValue: string) {
    if (!isCurrencyCode(nextValue)) return

    setSelectedCurrency(nextValue)
    document.cookie = `${USER_CURRENCY_COOKIE}=${nextValue}; Path=/; Max-Age=31536000; SameSite=Lax`
    router.refresh()
  }

  return (
    <label className={`inline-flex items-center gap-2 ${className}`}>
      <span className="sr-only">{dictionary.currency.ariaLabel}</span>
      <select
        aria-label={dictionary.currency.ariaLabel}
        value={selectedCurrency}
        onChange={(event) => handleChange(event.target.value)}
        className="bg-transparent border border-gold/30 px-2.5 py-1.5 font-sans text-[11px] tracking-widest uppercase text-stone hover:border-gold focus:border-gold focus:outline-none"
      >
        {CURRENCIES.map((currency) => (
          <option key={currency.value} value={currency.value}>
            {dictionary.currency.options[currency.value]}
          </option>
        ))}
      </select>
    </label>
  )
}
