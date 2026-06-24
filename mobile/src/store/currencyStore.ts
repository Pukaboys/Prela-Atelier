import { create } from 'zustand';
import { storageGet, storageSet, STORAGE_KEYS } from '../utils/storage';
import { postDisplayCurrency } from '../services/settings';
import type { Currency } from '../types';

interface CurrencyState {
  currency: Currency;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setCurrency: (currency: Currency) => void;
}

export const useCurrencyStore = create<CurrencyState>((set) => ({
  currency: 'EUR',
  isHydrated: false,

  hydrate: async () => {
    const saved = await storageGet<Currency>(STORAGE_KEYS.CURRENCY);
    set({ currency: saved ?? 'EUR', isHydrated: true });
  },

  setCurrency: (currency) => {
    storageSet(STORAGE_KEYS.CURRENCY, currency);
    postDisplayCurrency(currency);
    set({ currency });
  },
}));
