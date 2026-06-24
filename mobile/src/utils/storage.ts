import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  CART: 'prela_cart',
  CURRENCY: 'prela_currency',
  USER_TOKEN: 'prela_user_token',
  USER_EMAIL: 'prela_user_email',
  APPLIED_PROMO: 'prela_applied_promo',
} as const;

export async function storageGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function storageSet<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // silently fail — non-critical
  }
}

export async function storageRemove(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // silently fail
  }
}

export async function storageClear(): Promise<void> {
  try {
    await AsyncStorage.clear();
  } catch {
    // silently fail
  }
}
