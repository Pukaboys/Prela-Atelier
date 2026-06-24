export const dynamic = 'force-dynamic'

import { Nav } from '@/components/layout/Nav'
import { Footer } from '@/components/layout/Footer'
import { TermsConsentPopup } from '@/components/layout/TermsConsentPopup'
import { LanguageProvider } from '@/components/providers/LanguageProvider'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { normalizeCartItems } from '@/lib/cart'
import { getSession } from '@/lib/session'
import { getSettings } from '@/lib/settings'
import { getDisplayCurrencyOptions } from '@/server/services/currency-service'
import { getCurrentLanguage } from '@/server/services/language-service'

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [session, settings, language] = await Promise.all([getSession(), getSettings(), getCurrentLanguage()])
  const currencyOptions = await getDisplayCurrencyOptions(settings)
  const cartCount = normalizeCartItems(session.cart).reduce((sum, item) => sum + item.quantity, 0)

  const bannerEnabled = settings.banner_enabled === 'true'
  const bannerText = settings.banner_text?.trim()

  return (
    <>
      <ScrollReveal />
      <LanguageProvider initialLanguage={language}>
        <Nav
          cartCount={cartCount}
          currency={currencyOptions.currency}
          banner={bannerEnabled && bannerText ? {
            text: bannerText,
            bg: settings.banner_bg,
            textColor: settings.banner_text_color,
            dismissKey: bannerText,
            pinned: settings.banner_pinned === 'true',
          } : undefined}
        />
        <TermsConsentPopup />
        <main>{children}</main>
      </LanguageProvider>
      <Footer language={language} />
    </>
  )
}
