import { create } from 'zustand';
import { storageGet, storageSet, storageRemove, STORAGE_KEYS } from '../utils/storage';
import { buildCartItemId } from '../utils/cart';
import type { CartItem, AppliedPromo, Currency } from '../types';
import { convertFromEur } from '../utils/currency';

interface CartState {
  items: CartItem[];
  appliedPromo: AppliedPromo | null;
  isHydrated: boolean;

  hydrate: () => Promise<void>;
  addItem: (item: CartItem) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  setPromo: (promo: AppliedPromo | null) => void;

  totalItems: () => number;
  subtotalEur: () => number;
  totalEur: () => number;
  totalInCurrency: (currency: Currency) => number;
}

function normalizeCartItem(item: CartItem): CartItem {
  return {
    ...item,
    cartItemId: item.cartItemId ?? buildCartItemId(item.productId, item.materialId),
    materialId: item.materialId ?? null,
    materialName: item.materialName ?? null,
  };
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  appliedPromo: null,
  isHydrated: false,

  hydrate: async () => {
    const items = await storageGet<CartItem[]>(STORAGE_KEYS.CART);
    const promo = await storageGet<AppliedPromo>(STORAGE_KEYS.APPLIED_PROMO);
    set({
      items: (items ?? []).map(normalizeCartItem),
      appliedPromo: promo ?? null,
      isHydrated: true,
    });
  },

  addItem: (newItem) => {
    set((state) => {
      const nextItem = normalizeCartItem(newItem);
      const existing = state.items.find((item) => item.cartItemId === nextItem.cartItemId);
      const updated = existing
        ? state.items.map((item) => (
          item.cartItemId === nextItem.cartItemId
            ? { ...item, quantity: item.quantity + nextItem.quantity }
            : item
        ))
        : [...state.items, nextItem];

      storageSet(STORAGE_KEYS.CART, updated);
      return { items: updated };
    });
  },

  removeItem: (cartItemId) => {
    set((state) => {
      const updated = state.items.filter((item) => item.cartItemId !== cartItemId);
      storageSet(STORAGE_KEYS.CART, updated);
      return { items: updated };
    });
  },

  updateQuantity: (cartItemId, quantity) => {
    if (quantity < 1) {
      get().removeItem(cartItemId);
      return;
    }

    set((state) => {
      const updated = state.items.map((item) => (
        item.cartItemId === cartItemId ? { ...item, quantity } : item
      ));
      storageSet(STORAGE_KEYS.CART, updated);
      return { items: updated };
    });
  },

  clearCart: () => {
    storageRemove(STORAGE_KEYS.CART);
    storageRemove(STORAGE_KEYS.APPLIED_PROMO);
    set({ items: [], appliedPromo: null });
  },

  setPromo: (promo) => {
    if (promo) {
      storageSet(STORAGE_KEYS.APPLIED_PROMO, promo);
    } else {
      storageRemove(STORAGE_KEYS.APPLIED_PROMO);
    }
    set({ appliedPromo: promo });
  },

  totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

  subtotalEur: () =>
    get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

  totalEur: () => {
    const sub = get().subtotalEur();
    const promo = get().appliedPromo;
    if (!promo) return sub;
    return Math.max(0, sub - promo.discount);
  },

  totalInCurrency: (currency) => convertFromEur(get().totalEur(), currency),
}));
