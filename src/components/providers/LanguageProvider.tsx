'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LANGUAGE_COOKIE, getClientDictionary, normalizeLanguage, type ClientDictionary, type LanguageCode } from '@/lib/i18n'

interface LanguageContextValue {
  language: LanguageCode
  dictionary: ClientDictionary
  setLanguage: (language: LanguageCode) => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({
  initialLanguage,
  children,
}: {
  initialLanguage: LanguageCode
  children: React.ReactNode
}) {
  const [language, setLanguageState] = useState<LanguageCode>(initialLanguage)
  const router = useRouter()

  useEffect(() => {
    setLanguageState(initialLanguage)
  }, [initialLanguage])

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    dictionary: getClientDictionary(language),
    setLanguage: (nextLanguage) => {
      const normalized = normalizeLanguage(nextLanguage)
      setLanguageState(normalized)
      document.cookie = `${LANGUAGE_COOKIE}=${normalized}; Path=/; Max-Age=31536000; SameSite=Lax`
      router.refresh()
    },
  }), [language, router])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within LanguageProvider')
  return context
}
