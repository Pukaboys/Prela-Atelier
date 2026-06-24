import { cookies } from 'next/headers'
import { LANGUAGE_COOKIE, normalizeLanguage, type LanguageCode } from '@/lib/i18n'

export async function getCurrentLanguage(): Promise<LanguageCode> {
  const cookieStore = await cookies()
  return normalizeLanguage(cookieStore.get(LANGUAGE_COOKIE)?.value)
}
