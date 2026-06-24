import type { Currency } from '../types';

const SYMBOLS: Record<Currency, string> = {
  EUR: '\u20ac',
  USD: '$',
  GBP: '\u00a3',
};

const FALLBACK_RATES: Record<Currency, number> = {
  EUR: 1.0,
  USD: 1.08,
  GBP: 0.86,
};

let _rates: Record<Currency, number> = { ...FALLBACK_RATES };

export function setExchangeRates(rates: Partial<Record<Currency, number>>) {
  _rates = { ..._rates, ...rates };
}

export function convertFromEur(priceEur: number, currency: Currency): number {
  return priceEur * _rates[currency];
}

export function formatPrice(priceEur: number, currency: Currency): string {
  const converted = convertFromEur(priceEur, currency);
  const symbol = SYMBOLS[currency];
  return `${symbol}${converted.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

export function getCurrencySymbol(currency: Currency): string {
  return SYMBOLS[currency];
}

export const CURRENCY_OPTIONS: { value: Currency; label: string; flag: string }[] = [
  { value: 'EUR', label: 'Euro', flag: 'EU' },
  { value: 'USD', label: 'US Dollar', flag: 'US' },
  { value: 'GBP', label: 'British Pound', flag: 'GB' },
];
