import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Care Guide — Prela Atelier',
  description: 'How to care for your marble accessories — Prela Atelier.',
}

export default function CarePage() {
  return (
    <div>
      {/* Hero */}
      <section className="page-hero">
        <div className="max-w-7xl mx-auto px-6">
          <p className="section-eyebrow" style={{ color: '#b08d57' }}>Caring for Stone</p>
          <h1 className="font-serif text-6xl md:text-7xl text-stone leading-none mt-4 mb-6">
            Care Guide
          </h1>
          <p className="font-sans text-stone-mid max-w-xl text-lg leading-relaxed">
            Natural stone is a living material. With the right care, it will age beautifully —
            developing a patina that only deepens its character over time.
          </p>
        </div>
      </section>

      {/* Materials we work with */}
      <section className="py-24 bg-cream px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <p className="section-eyebrow">What We Work With</p>
            <h2 className="section-title">Our materials</h2>
            <div className="divider-gold mx-auto mb-6" />
            <p className="font-sans text-stone-mid max-w-2xl mx-auto leading-relaxed">
              Every Prela Atelier piece is crafted from authentic natural stone — no composites, no resins.
              Each material has its own personality and requires slightly different attention.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mt-12">
            {[
              {
                color: '#e8e4de',
                name: 'Marble',
                desc: 'Elegant and timelessly veined. Sensitive to acids and requires gentle, pH-neutral cleaning.',
              },
              {
                color: '#c8b89a',
                name: 'Travertine',
                desc: 'Warm and textured with natural voids. Seal regularly to prevent staining in the porous surface.',
              },
              {
                color: '#3d4a3e',
                name: 'Onyx',
                desc: 'Translucent and luminous. The most delicate of our stones — handle with care and avoid impact.',
              },
              {
                color: '#ddd5c0',
                name: 'Limestone',
                desc: 'Soft, matte, and natural. More porous than marble — seal and clean promptly after any spills.',
              },
              {
                color: '#d8d0c8',
                name: 'Quartzite',
                desc: 'The hardest of our range. Resistant to scratching and heat, though sealing is still recommended.',
              },
            ].map((mat) => (
              <div key={mat.name} className="bg-white border border-beige hover:border-gold transition-colors overflow-hidden">
                <div className="w-full h-16" style={{ backgroundColor: mat.color }} />
                <div className="p-4">
                  <h3 className="font-serif text-lg text-stone mb-2">{mat.name}</h3>
                  <p className="font-sans text-xs text-stone-mid leading-relaxed">{mat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Daily care guide — dark section */}
      <section className="py-24 bg-stone text-cream px-6">
        <div className="max-w-5xl mx-auto space-y-16">
          {/* Daily care */}
          <div>
            <div className="flex items-start gap-4 mb-8">
              <span className="text-gold text-3xl mt-1">○</span>
              <div>
                <p className="font-sans text-xs uppercase tracking-widest" style={{ color: '#b08d57' }}>Every Day</p>
                <h2 className="font-serif text-4xl text-cream">Daily Care</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                'Wipe with a soft microfibre cloth — never abrasive sponges or scouring pads.',
                'Use warm water or a pH-neutral stone cleaner for routine cleaning.',
                'Dry the surface after cleaning to prevent water marks and mineral deposits.',
                'Blot spills immediately — do not wipe, as this can spread the stain across the surface.',
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-3 border border-gold/20 p-4">
                  <span className="text-gold flex-shrink-0">✦</span>
                  <p className="font-sans text-sm text-cream/70 leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gold/20" />

          {/* Protection */}
          <div>
            <div className="flex items-start gap-4 mb-8">
              <span className="text-gold text-3xl mt-1">◇</span>
              <div>
                <p className="font-sans text-xs uppercase tracking-widest" style={{ color: '#b08d57' }}>What to Avoid</p>
                <h2 className="font-serif text-4xl text-cream">Protection</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                'Acidic products — vinegar, lemon juice, bleach, and most bathroom cleaners will etch stone.',
                'Placing extremely hot cookware directly on marble or limestone surfaces.',
                'Prolonged contact with oils, wine, or dark liquids — these can penetrate and stain.',
                'Abrasive cleaning tools, steel wool, or harsh powders that scratch the polished finish.',
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-3 border border-red-900/40 bg-red-950/20 p-4">
                  <span className="text-red-400 flex-shrink-0 font-bold">×</span>
                  <p className="font-sans text-sm text-cream/70 leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 border border-gold/30 p-4 flex items-start gap-3">
              <span className="text-lg flex-shrink-0">💡</span>
              <p className="font-sans text-sm text-cream/60">
                Use coasters under beverages and felt pads under decorative objects to protect the surface beneath.
              </p>
            </div>
          </div>

          <div className="border-t border-gold/20" />

          {/* Sealing */}
          <div>
            <div className="flex items-start gap-4 mb-8">
              <span className="text-gold text-3xl mt-1">◻</span>
              <div>
                <p className="font-sans text-xs uppercase tracking-widest" style={{ color: '#b08d57' }}>Periodic Maintenance</p>
                <h2 className="font-serif text-4xl text-cream">Sealing</h2>
              </div>
            </div>
            <p className="font-sans text-cream/60 leading-relaxed mb-8">
              Most natural stones benefit from regular sealing to protect against staining and moisture absorption.
              We recommend using a quality stone impregnator sealer, available at stone care specialists.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { stone: 'Marble & Limestone', freq: 'Every 6–12 months', note: 'Depending on usage and traffic' },
                { stone: 'Travertine', freq: 'Every 6 months', note: 'More porous — seal more frequently' },
                { stone: 'Onyx', freq: 'Annually', note: 'Use a dedicated onyx-safe sealer' },
                { stone: 'Quartzite', freq: 'Every 12–18 months', note: 'More resistant but still benefits from sealing' },
              ].map((item) => (
                <div key={item.stone} className="border border-gold/30 p-5 text-center">
                  <p className="font-sans text-xs uppercase tracking-widest text-cream/40 mb-2">{item.stone}</p>
                  <p className="font-serif text-lg text-gold">{item.freq}</p>
                  <p className="font-sans text-xs text-cream/40 mt-2">{item.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Decorative objects */}
      <section className="py-24 bg-cream px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div>
            <p className="section-eyebrow">Decorative Objects</p>
            <h2 className="section-title">Trays, bowls &amp; candle holders</h2>
            <div className="divider-gold mb-6" />
            <p className="font-sans text-stone-mid leading-relaxed mb-6">
              Our decorative objects — trays, bowls, candle holders, and vessels — are crafted for display and
              light daily use. They are not designed for heavy-duty kitchen work or outdoor environments.
            </p>
            <ul className="space-y-3">
              {[
                'Clean gently after wax spills — allow to cool fully, then lift with a plastic scraper',
                'Avoid submerging in water or leaving standing liquid inside for extended periods',
                'Use a tray liner or felt pad beneath objects placed on polished wooden surfaces',
                'Store in a dry environment away from direct sunlight to preserve colour depth',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 font-sans text-sm text-stone-mid">
                  <span className="text-gold mt-0.5 flex-shrink-0">✦</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-beige p-8">
            <p className="section-eyebrow mb-4">A Note on Ageing</p>
            <p className="font-sans text-stone-mid leading-relaxed mb-6">
              Natural stone changes over time. The patina that develops with use is not damage — it is the
              stone becoming yours. Small variations in tone, a deepened vein, a softened edge: these are the
              marks of a piece that has lived in your home.
            </p>
            <p className="font-serif text-stone text-lg italic">— Prela Atelier</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-stone text-center px-6">
        <div className="max-w-xl mx-auto">
          <p className="section-eyebrow" style={{ color: '#b08d57' }}>Questions?</p>
          <h2 className="font-serif text-5xl text-cream mb-6">We are here to help</h2>
          <p className="font-sans text-cream/60 mb-10 leading-relaxed">
            If you have a question about caring for a specific piece, or something has happened to your stone,
            reach out — we are happy to advise.
          </p>
          <Link href="/contact" className="btn-primary">
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  )
}
