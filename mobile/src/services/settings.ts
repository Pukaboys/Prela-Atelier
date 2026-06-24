import api from './api';
import type { ApiResponse, Currency } from '../types';
import { setExchangeRates } from '../utils/currency';

interface CurrencySettings {
  usdRate?: number | string;
  gbpRate?: number | string;
}

function unwrapSettings(payload: ApiResponse<CurrencySettings> | CurrencySettings) {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data;
  }

  return payload as CurrencySettings;
}

function toRate(value: number | string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export async function fetchCurrencySettings(): Promise<void> {
  try {
    const { data } = await api.get<ApiResponse<CurrencySettings> | CurrencySettings>(
      '/api/settings/currency',
    );
    const settings = unwrapSettings(data);

    const usdRate = toRate(settings?.usdRate);
    const gbpRate = toRate(settings?.gbpRate);
    const rates: Partial<Record<Currency, number>> = {};

    if (usdRate) rates.USD = usdRate;
    if (gbpRate) rates.GBP = gbpRate;

    setExchangeRates(rates);
  } catch {
    // Currency rates have local fallbacks, so browsing can continue offline.
  }
}

export async function postDisplayCurrency(currency: Currency): Promise<void> {
  try {
    await api.post('/api/display-currency', { currency });
  } catch {
    // Non-critical preference sync.
  }
}
