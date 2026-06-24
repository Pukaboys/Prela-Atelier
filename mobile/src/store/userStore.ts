import { create } from 'zustand';
import { storageGet, storageSet, storageRemove, STORAGE_KEYS } from '../utils/storage';

interface UserState {
  email: string | null;
  token: string | null;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setUser: (email: string, token: string) => void;
  clearUser: () => void;
  isAuthenticated: () => boolean;
}

export const useUserStore = create<UserState>((set, get) => ({
  email: null,
  token: null,
  isHydrated: false,

  hydrate: async () => {
    const email = await storageGet<string>(STORAGE_KEYS.USER_EMAIL);
    const token = await storageGet<string>(STORAGE_KEYS.USER_TOKEN);
    set({ email, token, isHydrated: true });
  },

  setUser: (email, token) => {
    storageSet(STORAGE_KEYS.USER_EMAIL, email);
    storageSet(STORAGE_KEYS.USER_TOKEN, token);
    set({ email, token });
  },

  clearUser: () => {
    storageRemove(STORAGE_KEYS.USER_EMAIL);
    storageRemove(STORAGE_KEYS.USER_TOKEN);
    set({ email: null, token: null });
  },

  isAuthenticated: () => Boolean(get().token),
}));
