'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/components/providers/LanguageProvider'

interface Props {
  text: string
  bg: string
  textColor: string
  dismissKey: string
  pinned?: boolean
}

export function SiteBanner({ text, bg, textColor, dismissKey, pinned = false }: Props) {
  const [visible, setVisible] = useState(false)
  const { dictionary } = useLanguage()

  useEffect(() => {
    if (pinned) {
      setVisible(true)
      return
    }

    const dismissed = localStorage.getItem(`banner_dismissed_${dismissKey}`)
    setVisible(!dismissed)
  }, [dismissKey, pinned])

  if (!visible) return null

  function dismiss() {
    if (pinned) return

    localStorage.setItem(`banner_dismissed_${dismissKey}`, '1')
    setVisible(false)
  }

  return (
    <div
      style={{ backgroundColor: bg, color: textColor }}
      className={`relative z-50 w-full text-center py-2.5 ${pinned ? 'px-6' : 'px-10'}`}
    >
      <p className="font-sans text-sm leading-snug">{text}</p>
      {!pinned && (
        <button
          onClick={dismiss}
          aria-label={dictionary.banner.dismiss}
          style={{ color: textColor }}
          className="absolute right-4 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity text-lg leading-none"
        >
          &times;
        </button>
      )}
    </div>
  )
}
