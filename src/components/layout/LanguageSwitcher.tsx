'use client'

import { useLanguage } from '@/components/providers/LanguageProvider'

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { language, setLanguage, dictionary } = useLanguage()

  return (
    <label className={`inline-flex items-center gap-2 ${className}`}>
      <span className="sr-only">{dictionary.nav.language}</span>
      <select
        aria-label={dictionary.nav.language}
        value={language}
        onChange={(event) => setLanguage(event.target.value as 'en' | 'sq')}
        className="bg-transparent border border-gold/30 px-2.5 py-1.5 font-sans text-[11px] tracking-widest uppercase text-stone hover:border-gold focus:border-gold focus:outline-none"
      >
        <option value="en">English</option>
        <option value="sq">Shqip</option>
      </select>
    </label>
  )
}
