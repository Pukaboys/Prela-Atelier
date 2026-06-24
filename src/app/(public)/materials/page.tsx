import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import prisma from '@/lib/db'
import { getCurrentLanguage } from '@/server/services/language-service'
import { getPublicPageCopy } from '@/lib/public-page-copy'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Our Stones - Prela Atelier',
  description: 'Discover the marble and stone materials used by Prela Atelier.',
}

function getSwatchColor(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('bianco') || lower.includes('white') || lower.includes('carrara') || lower.includes('calacatta')) return '#f0eeea'
  if (lower.includes('nero') || lower.includes('black') || lower.includes('marquina')) return '#2a2422'
  if (lower.includes('onyx') || lower.includes('verde') || lower.includes('green')) return '#3d4a3e'
  if (lower.includes('travertine') || lower.includes('beige') || lower.includes('noce')) return '#c8b89a'
  if (lower.includes('emperor') || lower.includes('emperador')) return '#6b4c3b'
  if (lower.includes('rosso') || lower.includes('red') || lower.includes('rojo')) return '#8b3a2e'
  if (lower.includes('albanian')) return '#c8bfb0'
  if (lower.includes('italian')) return '#e8e4de'
  if (lower.includes('quartzite') || lower.includes('quartz')) return '#d8d0c8'
  if (lower.includes('limestone') || lower.includes('lime')) return '#ddd5c0'
  return '#b08d57'
}

const MATERIAL_MARQUEE = ['Carrara', 'Calacatta', 'Albanian Marble', 'Travertine', 'Onyx', 'Marquina', 'Emperador', 'Quartzite', 'Limestone']

export default async function MaterialsPage() {
  const language = await getCurrentLanguage()
  const copy = getPublicPageCopy(language).materials
  let materials: { id: number; name: string; origin: string; description: string; hardness: string | null; tone: string | null; veining: string | null; imagePath: string | null }[] = []
  try {
    materials = await prisma.material.findMany({
      where: { visible: true },
      select: { id: true, name: true, origin: true, description: true, hardness: true, tone: true, veining: true, imagePath: true },
      orderBy: { sortOrder: 'asc' },
    })
  } catch {
    // DB unavailable
  }

  return (
    <div>
      <section className="page-hero">
        <div className="max-w-7xl mx-auto px-6">
          <p className="section-eyebrow" style={{ color: '#b08d57' }}>{copy.eyebrow}</p>
          <h1 className="font-serif text-6xl md:text-7xl text-stone leading-none mt-4 mb-6">
            {copy.titleLine1}<br />{copy.titleLine2}
          </h1>
          <p className="font-sans text-stone-mid max-w-xl text-lg leading-relaxed">
            {copy.intro}
          </p>
        </div>
      </section>

      <div className="bg-stone border-y border-gold/30 py-4 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap flex">
          {[...Array(3)].map((_, i) => (
            <span key={i} className="inline-block text-gold font-sans text-sm tracking-widest uppercase mr-0">
              {MATERIAL_MARQUEE.join(' *  ')} *&nbsp;&nbsp;&nbsp;
            </span>
          ))}
        </div>
      </div>

      <section className="py-24 bg-cream px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-20">
            <div>
              <p className="section-eyebrow">{copy.philosophyEyebrow}</p>
              <h2 className="section-title">{copy.philosophyTitleLine1}<br />{copy.philosophyTitleLine2}</h2>
              <div className="divider-gold mb-6" />
              <p className="font-sans text-stone-mid leading-relaxed mb-4">
                {copy.philosophyTextOne}
              </p>
              <p className="font-sans text-stone-mid leading-relaxed">
                {copy.philosophyTextTwo}
              </p>
            </div>
            <div className="bg-stone p-10 text-center">
              <div className="grid grid-cols-2 gap-6">
                <div className="border-b border-gold/20 pb-6">
                  <p className="font-serif text-4xl text-cream">100%</p>
                  <p className="font-sans text-xs text-cream/50 uppercase tracking-widest mt-1">{copy.naturalStone}</p>
                </div>
                <div className="border-b border-gold/20 pb-6">
                  <p className="font-serif text-4xl text-cream">4+</p>
                  <p className="font-sans text-xs text-cream/50 uppercase tracking-widest mt-1">{copy.stoneOrigins}</p>
                </div>
                <div>
                  <p className="font-serif text-4xl text-cream">Ltd.</p>
                  <p className="font-sans text-xs text-cream/50 uppercase tracking-widest mt-1">{copy.production}</p>
                </div>
                <div>
                  <p className="font-serif text-4xl text-cream">1/1</p>
                  <p className="font-sans text-xs text-cream/50 uppercase tracking-widest mt-1">{copy.uniquePieces}</p>
                </div>
              </div>
            </div>
          </div>

          {materials.length === 0 ? (
            <p className="text-center text-stone-mid font-sans py-12">{copy.noMaterials}</p>
          ) : (
            <>
              <div className="text-center mb-12">
                <p className="section-eyebrow">{copy.rangeEyebrow}</p>
                <h2 className="section-title">{copy.rangeTitle}</h2>
                <div className="divider-gold mx-auto" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {materials.map((material) => (
                  <div
                    key={material.id}
                    className="bg-white border border-beige hover:border-gold transition-colors duration-300 overflow-hidden"
                  >
                    {material.imagePath ? (
                      <div className="relative w-full h-48 overflow-hidden">
                        <Image
                          src={material.imagePath}
                          alt={material.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                    ) : (
                      <div
                        className="w-full h-28"
                        style={{ backgroundColor: getSwatchColor(material.name) }}
                      />
                    )}

                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-serif text-xl text-stone">{material.name}</h3>
                        <span className="text-xs font-sans text-stone-pale border border-beige px-2 py-0.5 whitespace-nowrap ml-2">
                          {material.origin}
                        </span>
                      </div>

                      <p className="font-sans text-sm text-stone-mid leading-relaxed mb-4">
                        {material.description}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {material.hardness && (
                          <span className="text-xs font-sans bg-beige text-stone-mid px-2 py-0.5">
                            {copy.hardness}: {material.hardness}
                          </span>
                        )}
                        {material.tone && (
                          <span className="text-xs font-sans bg-beige text-stone-mid px-2 py-0.5">
                            {copy.tone}: {material.tone}
                          </span>
                        )}
                        {material.veining && (
                          <span className="text-xs font-sans bg-beige text-stone-mid px-2 py-0.5">
                            {copy.veining}: {material.veining}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="py-24 bg-stone text-cream px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="section-eyebrow" style={{ color: '#b08d57' }}>{copy.careEyebrow}</p>
            <h2 className="font-serif text-5xl text-cream">{copy.careTitle}</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {copy.careTips.map((tip) => (
              <div key={tip.title} className="border border-gold/30 p-6">
                <span className="text-gold text-xl block mb-3">*</span>
                <h3 className="font-serif text-lg text-cream mb-2">{tip.title}</h3>
                <p className="font-sans text-sm text-cream/60 leading-relaxed">{tip.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/care" className="btn-outline" style={{ borderColor: '#b08d57', color: '#faf8f4' }}>
              {copy.fullCareGuide} {'->'}
            </Link>
          </div>
        </div>
      </section>

      <section className="py-24 bg-cream text-center px-6">
        <div className="max-w-xl mx-auto">
          <p className="section-eyebrow">{copy.ctaEyebrow}</p>
          <h2 className="section-title">{copy.ctaTitle}</h2>
          <div className="divider-gold mx-auto mb-8" />
          <p className="font-sans text-stone-mid mb-8 leading-relaxed">
            {copy.ctaText}
          </p>
          <Link href="/collections" className="btn-primary">
            {copy.exploreCollections}
          </Link>
        </div>
      </section>
    </div>
  )
}
