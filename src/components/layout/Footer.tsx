import Link from 'next/link'
import { type LanguageCode } from '@/lib/i18n'

export function Footer({ language }: { language: LanguageCode }) {
  const copy = language === 'sq'
    ? {
        brandDescription: 'Aksesore mermeri te punuar me dore, me bukuri te perjetshme, te zgjedhur nga guroret me te mira ne bote.',
        navigate: 'Navigo',
        customer: 'Klienti',
        collections: 'Koleksione',
        stones: 'Guret Tane',
        bespoke: 'Me Porosi',
        about: 'Rreth Nesh',
        careGuide: 'Udhezuesi i Kujdesit',
        contact: 'Kontakt',
        trackOrder: 'Gjurmo Porosine',
        yourCart: 'Shporta Juaj',
        shippingPolicy: 'Politika e Dergeses',
        returnsRefunds: 'Kthime & Rimbursime',
        faq: 'Pyetje te Shpeshta',
        privacyPolicy: 'Politika e Privatesise',
        termsConditions: 'Termat & Kushtet',
        albaniaFree: 'Shqiperi: Falas',
        freeShipping: 'Falas per porosi mbi EUR 500',
        rightsReserved: `(c) ${new Date().getFullYear()} Prela Atelier. Te gjitha te drejtat e rezervuara.`,
        craftedWithPrecision: 'I punuar me precizion',
      }
    : {
        brandDescription: 'Handcrafted marble accessories of timeless beauty, sourced from the finest quarries of the world.',
        navigate: 'Navigate',
        customer: 'Customer',
        collections: 'Collections',
        stones: 'Our Stones',
        bespoke: 'Bespoke',
        about: 'About',
        careGuide: 'Care Guide',
        contact: 'Contact',
        trackOrder: 'Track Your Order',
        yourCart: 'Your Cart',
        shippingPolicy: 'Shipping Policy',
        returnsRefunds: 'Returns & Refunds',
        faq: 'FAQ',
        privacyPolicy: 'Privacy Policy',
        termsConditions: 'Terms & Conditions',
        albaniaFree: 'Albania: Free',
        freeShipping: 'Free on orders over EUR 500',
        rightsReserved: `(c) ${new Date().getFullYear()} Prela Atelier. All rights reserved.`,
        craftedWithPrecision: 'Crafted with precision',
      }

  return (
    <footer className="bg-stone text-beige">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-14">
          <div>
            <p className="font-serif text-2xl tracking-[0.2em] text-beige-light mb-4">
              PRELA ATELIER
            </p>
            <div className="w-8 h-px bg-gold mb-5" />
            <p className="text-sm text-stone-pale leading-relaxed max-w-xs">
              {copy.brandDescription}
            </p>
          </div>

          <div>
            <p className="text-[10px] tracking-widest uppercase text-gold font-sans mb-6">
              {copy.navigate}
            </p>
            <nav className="flex flex-col gap-3">
              {[
                { href: '/collections', label: copy.collections },
                { href: '/materials', label: copy.stones },
                { href: '/bespoke', label: copy.bespoke },
                { href: '/about', label: copy.about },
                { href: '/care', label: copy.careGuide },
                { href: '/contact', label: copy.contact },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-sm text-stone-pale hover:text-gold transition-colors duration-200 font-sans"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <p className="text-[10px] tracking-widest uppercase text-gold font-sans mb-6">
              {copy.customer}
            </p>
            <div className="flex flex-col gap-3">
              {[
                { href: '/track-order', label: copy.trackOrder },
                { href: '/cart', label: copy.yourCart },
                { href: '/shipping', label: copy.shippingPolicy },
                { href: '/returns', label: copy.returnsRefunds },
                { href: '/faq', label: copy.faq },
                { href: '/privacy', label: copy.privacyPolicy },
                { href: '/terms', label: copy.termsConditions },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-sm text-stone-pale hover:text-gold transition-colors duration-200 font-sans"
                >
                  {label}
                </Link>
              ))}
              <p className="text-sm text-stone-pale font-sans mt-2">
                {copy.albaniaFree}
              </p>
              <p className="text-sm text-stone-pale font-sans">
                {copy.freeShipping}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-stone-light pt-8 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs text-stone-pale font-sans">
            {copy.rightsReserved}
          </p>
          <p className="text-xs text-stone-pale font-sans tracking-widest uppercase">
            {copy.craftedWithPrecision}
          </p>
        </div>
      </div>
    </footer>
  )
}
