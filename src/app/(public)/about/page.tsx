import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About — Prela Atelier',
  description: 'The story behind Prela Atelier — handcrafted luxury marble accessories from Laç, Albania.',
}

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="page-hero">
        <div className="max-w-7xl mx-auto px-6">
          <p className="section-eyebrow" style={{ color: '#b08d57' }}>Our Story</p>
          <h1 className="font-serif text-6xl md:text-7xl text-stone leading-none mt-4 mb-6">
            Prela Atelier
          </h1>
          <p className="font-sans text-stone-mid max-w-xl text-lg leading-relaxed">
            The artistic evolution of a family stone legacy — rooted in Albania, designed for the world.
          </p>
        </div>
      </section>

      {/* Founders */}
      <section className="py-24 bg-cream px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="section-eyebrow">The Foundation</p>
            <h2 className="font-serif text-5xl text-stone mb-8 leading-tight">
              Born from stone,<br />refined by vision
            </h2>
            <div className="space-y-4 font-sans text-stone-mid leading-relaxed">
              <p>
                Prela Atelier was founded by <strong className="text-stone">Jeorgen Prela</strong> and{' '}
                <strong className="text-stone">Leonard Prela</strong> — brothers, and the second generation
                of a family whose name has long been synonymous with stone in Albania.
              </p>
              <p>
                The atelier grew from the foundations of <em>Prela Mermer Sh.P.K.</em>, their family&apos;s
                stone enterprise, where both founders spent years working intimately with raw marble at an
                industrial level — extraction, processing, architectural applications.
              </p>
              <p>
                But alongside the industrial work, a parallel question was forming: what if marble could be
                something more? Not a building material, but a collected object. Not a surface, but a sculpture
                you live with.
              </p>
              <p className="text-stone font-medium">That question became Prela Atelier.</p>
            </div>
          </div>

          <div>
            <div className="bg-stone p-10 text-center">
              <span className="text-gold text-5xl">✦</span>
              <p className="font-serif text-3xl text-cream mt-4 mb-2">Prela Atelier</p>
              <p className="font-sans text-xs text-cream/40 uppercase tracking-widest">Est. Laç, Albania</p>
              <div className="border-t border-gold/30 my-6" />
              <p className="font-sans text-cream/60 text-sm leading-relaxed">
                Sculptural marble objects for curated interiors, penthouses, and gallery spaces across Europe and beyond.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="py-24 bg-beige px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="section-eyebrow">What We Believe</p>
            <h2 className="section-title">Our Philosophy</h2>
            <div className="divider-gold mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                text: 'Marble is time made solid. Every vein tells a geological story millions of years old.',
              },
              {
                text: 'True luxury is natural — never artificial. We work only with authentic stone, never composites.',
              },
              {
                text: 'Design should feel permanent. Each piece is crafted to outlast the trends around it.',
              },
              {
                text: 'Individuality is the point. No two pieces are ever identical — that is the nature of stone.',
              },
            ].map((belief, idx) => (
              <div key={idx} className="bg-white border border-beige p-8 flex gap-4">
                <span className="text-gold font-serif text-2xl mt-1 flex-shrink-0">—</span>
                <p className="font-sans text-stone-mid leading-relaxed">{belief.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Craftsmanship */}
      <section className="py-24 bg-stone text-cream px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Stats */}
          <div className="border border-gold/30 p-10">
            <div className="space-y-6">
              <div className="border-b border-gold/20 pb-6">
                <p className="font-serif text-5xl text-cream">Limited</p>
                <p className="font-sans text-xs text-cream/40 uppercase tracking-widest mt-1">Production quantities</p>
              </div>
              <div className="border-b border-gold/20 pb-6">
                <p className="font-serif text-5xl text-cream">100%</p>
                <p className="font-sans text-xs text-cream/40 uppercase tracking-widest mt-1">Natural stone, no composites</p>
              </div>
              <div>
                <p className="font-serif text-5xl text-cream">4+</p>
                <p className="font-sans text-xs text-cream/40 uppercase tracking-widest mt-1">Stone origins sourced</p>
              </div>
            </div>
          </div>

          {/* Text */}
          <div>
            <p className="section-eyebrow" style={{ color: '#b08d57' }}>How We Work</p>
            <h2 className="font-serif text-5xl text-cream mb-8 leading-tight">
              Crafted with intention
            </h2>
            <div className="space-y-4 font-sans text-cream/70 leading-relaxed">
              <p>
                Each Prela Atelier piece passes through the hands of craftspeople with generations of stone
                knowledge. We produce in limited quantities — not as a marketing decision, but because quality
                at scale is a contradiction in stone work.
              </p>
              <p>
                We embrace the individuality of natural stone. A vein that runs unexpectedly through a tray.
                A shift in tone across a bowl. These are not imperfections — they are signatures.
              </p>
            </div>
            <ul className="mt-6 space-y-2 font-sans text-sm text-cream/60">
              {[
                'Crafted from authentic natural stone',
                'Produced in limited quantities',
                'Sculpted with intention',
                'Designed to last generations',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="text-gold">✦</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Sourcing */}
      <section className="py-24 bg-cream px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="section-eyebrow">Location &amp; Sourcing</p>
            <h2 className="section-title">Rooted in Laç, reaching across Europe</h2>
            <div className="divider-gold mx-auto mb-6" />
            <p className="font-sans text-stone-mid max-w-2xl mx-auto">
              Based in Laç, Albania, our production is rooted in family-operated marble facilities where
              craftsmanship and precision meet. We hand-select every slab for depth, character, and structural integrity.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                color: '#c8bfb0',
                name: 'Albanian Marble',
                note: 'Our home stone',
              },
              {
                color: '#e8e4de',
                name: 'Italian Marble',
                note: 'Carrara & Calacatta',
              },
              {
                color: '#c4a882',
                name: 'Turkish Marble',
                note: 'Rich tones & character',
              },
              {
                color: '#b8c4c8',
                name: 'European Stones',
                note: 'Selected & rare',
              },
            ].map((origin) => (
              <div key={origin.name} className="text-center">
                <div
                  className="w-full h-24 mb-3 border border-beige"
                  style={{ backgroundColor: origin.color }}
                />
                <p className="font-serif text-base text-stone">{origin.name}</p>
                <p className="font-sans text-xs text-stone-pale mt-0.5">{origin.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-stone text-center px-6">
        <div className="max-w-xl mx-auto">
          <p className="section-eyebrow" style={{ color: '#b08d57' }}>Work With Us</p>
          <h2 className="font-serif text-5xl text-cream mb-6 leading-tight">A piece for your space</h2>
          <p className="font-sans text-cream/60 mb-10 leading-relaxed">
            Whether you are looking for a collection piece or have a bespoke commission in mind, we would be
            glad to hear from you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/collections" className="btn-primary">
              Explore the Collection
            </Link>
            <Link href="/bespoke" className="btn-ghost" style={{ color: '#faf8f4', borderColor: '#b08d57' }}>
              Begin a Commission
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
