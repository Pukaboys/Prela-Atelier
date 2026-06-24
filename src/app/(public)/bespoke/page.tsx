import prisma from '@/lib/db'
import { CustomOrderBuilder } from '@/components/bespoke/CustomOrderBuilder'
import { getDisplayCurrencyOptions } from '@/server/services/currency-service'
import { getCurrentLanguage } from '@/server/services/language-service'
import { getPublicPageCopy } from '@/lib/public-page-copy'

export const dynamic = 'force-dynamic'

export default async function BespokePage() {
  const [materials, currencyOptions, language] = await Promise.all([
    prisma.material.findMany({
      where: { visible: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        origin: true,
        description: true,
        tone: true,
        veining: true,
        imagePath: true,
      },
    }),
    getDisplayCurrencyOptions(),
    getCurrentLanguage(),
  ])
  const copy = getPublicPageCopy(language).bespoke

  return (
    <div>
      <section className="page-hero">
        <div className="max-w-7xl mx-auto px-6">
          <p className="section-eyebrow" style={{ color: '#b08d57' }}>{copy.eyebrow}</p>
          <h1 className="font-serif text-6xl md:text-7xl text-stone leading-none mt-4 mb-6">
            {copy.title}
          </h1>
          <p className="font-sans text-stone-mid max-w-xl text-lg leading-relaxed">
            {copy.subtitle}
          </p>
        </div>
      </section>

      <section className="py-24 bg-cream px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="section-eyebrow">{copy.processEyebrow}</p>
            <h2 className="section-title">{copy.processTitle}</h2>
            <div className="divider-gold mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-24">
            {copy.process.map((item) => (
              <div key={item.step} className="text-center">
                <p className="font-serif text-5xl text-gold/30 mb-4">{item.step}</p>
                <h3 className="font-serif text-xl text-stone mb-3">{item.title}</h3>
                <p className="font-sans text-sm text-stone-mid leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-24">
            <div>
              <p className="section-eyebrow">{copy.createEyebrow}</p>
              <h2 className="font-serif text-4xl text-stone mb-6 leading-tight">{copy.createTitle}</h2>
              <p className="font-sans text-stone-mid leading-relaxed mb-4">
                {copy.createText}
              </p>
              <ul className="space-y-2 font-sans text-sm text-stone-mid">
                {copy.createItems.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-gold mt-0.5">*</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-stone p-10">
              <p className="section-eyebrow" style={{ color: '#b08d57' }}>{copy.timelineEyebrow}</p>
              <p className="font-serif text-2xl text-cream mt-3 mb-4 leading-tight">{copy.timelineTitle}</p>
              <p className="font-sans text-cream/60 text-sm leading-relaxed mb-4">
                {copy.timelineText}
              </p>
              <div className="border-t border-gold/30 pt-4 mt-4">
                <p className="font-sans text-xs text-cream/40 uppercase tracking-widest">{copy.estimatesLabel}</p>
                <p className="font-serif text-xl text-cream mt-1">{copy.estimatesText}</p>
              </div>
            </div>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <p className="section-eyebrow">{copy.builderEyebrow}</p>
              <h2 className="section-title">{copy.builderTitle}</h2>
              <div className="divider-gold mx-auto" />
            </div>
            <CustomOrderBuilder materials={materials} currencyOptions={currencyOptions} />
          </div>
        </div>
      </section>
    </div>
  )
}
