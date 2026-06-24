'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useLanguage } from '@/components/providers/LanguageProvider'

const TERMS_CONSENT_KEY = 'prela_terms_consent_v1'

type ConsentChoice = 'accepted' | 'rejected'

export function TermsConsentPopup() {
  const [visible, setVisible] = useState(false)
  const { dictionary } = useLanguage()

  useEffect(() => {
    const existingChoice = localStorage.getItem(TERMS_CONSENT_KEY)
    setVisible(existingChoice !== 'accepted' && existingChoice !== 'rejected')
  }, [])

  function choose(choice: ConsentChoice) {
    localStorage.setItem(TERMS_CONSENT_KEY, choice)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] px-4 pb-4 sm:px-6 sm:pb-6 pointer-events-none">
      <div className="mx-auto max-w-4xl border border-beige bg-cream shadow-2xl pointer-events-auto">
        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr,auto] lg:items-center">
          <div>
            <p className="text-[10px] uppercase tracking-[0.26em] text-gold font-sans">
              {dictionary.termsConsent.eyebrow}
            </p>
            <h2 className="font-serif text-2xl text-stone mt-2">
              {dictionary.termsConsent.title}
            </h2>
            <p className="text-sm font-sans text-stone-mid mt-3 leading-relaxed">
              {dictionary.termsConsent.text}{' '}
              <Link href="/terms" className="text-gold hover:text-gold-dark underline underline-offset-4">
                {dictionary.termsConsent.terms}
              </Link>
              ,{' '}
              <Link href="/privacy" className="text-gold hover:text-gold-dark underline underline-offset-4">
                {dictionary.termsConsent.privacy}
              </Link>
              {' '}
              {dictionary.termsConsent.and}{' '}
              <Link href="/returns" className="text-gold hover:text-gold-dark underline underline-offset-4">
                {dictionary.termsConsent.returns}
              </Link>
              .
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 min-w-[180px]">
            <button
              type="button"
              onClick={() => choose('accepted')}
              className="bg-gold text-white border border-gold px-5 py-3 text-xs font-sans uppercase tracking-[0.2em] hover:bg-gold-dark hover:border-gold-dark transition-colors"
            >
              {dictionary.termsConsent.accept}
            </button>
            <button
              type="button"
              onClick={() => choose('rejected')}
              className="bg-white text-stone-mid border border-beige px-5 py-3 text-xs font-sans uppercase tracking-[0.2em] hover:border-stone hover:text-stone transition-colors"
            >
              {dictionary.termsConsent.reject}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
