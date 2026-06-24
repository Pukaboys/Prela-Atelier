import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import prisma from '@/lib/db'
import { formatPrice, productImageUrl } from '@/lib/helpers'
import { AddToCartButton } from '@/components/ui/AddToCartButton'
import { getDisplayCurrencyOptions } from '@/server/services/currency-service'
import { getCurrentLanguage } from '@/server/services/language-service'
import { getPublicPageCopy } from '@/lib/public-page-copy'
import {
  collectProductVariationMaterialIds,
  getProductVariationMaterialsMap,
  getStoredProductVariationConfigMap,
  resolveProductMaterialVariations,
} from '@/server/services/product-variation-service'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Prela Atelier - Luxury Marble Accessories',
  description:
    'Handcrafted marble accessories of timeless beauty, sourced from the finest quarries of the world.',
}

function getSwatchColor(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('bianco') || lower.includes('white') || lower.includes('carrara') || lower.includes('calacatta')) return '#f0eeea'
  if (lower.includes('nero') || lower.includes('black') || lower.includes('marquina')) return '#2a2422'
  if (lower.includes('onyx') || lower.includes('verde') || lower.includes('green')) return '#3d4a3e'
  if (lower.includes('travertine') || lower.includes('beige') || lower.includes('emperador')) return '#c8b89a'
  if (lower.includes('albanian')) return '#c8bfb0'
  if (lower.includes('italian')) return '#e8e4de'
  return '#b08d57'
}

export default async function HomePage() {
  let featuredProducts: {
    id: number
    name: string
    slug: string
    priceEur: number
    badge: string | null
    stock: number
    imagePath: string | null
    materialId: number | null
    materialName: string | null
    variationOptions: Array<{
      materialId: number
      materialName: string
      priceEur: number
      imagePath: string | null
      origin: string | null
    }>
  }[] = []
  let materials: { id: number; name: string; description: string; imagePath: string | null }[] = []
  const [currencyOptions, language] = await Promise.all([getDisplayCurrencyOptions(), getCurrentLanguage()])
  const copy = getPublicPageCopy(language).home

  try {
    const [productRows, materialRows] = await Promise.all([
      prisma.product.findMany({
        where: { featured: true },
        select: {
          id: true,
          name: true,
          slug: true,
          priceEur: true,
          badge: true,
          stock: true,
          imagePath: true,
          materialId: true,
          material: { select: { id: true, name: true, origin: true, imagePath: true } },
        },
        orderBy: { id: 'asc' },
        take: 3,
      }),
      prisma.material.findMany({
        where: { visible: true },
        select: { id: true, name: true, description: true, imagePath: true },
        orderBy: { sortOrder: 'asc' },
      }),
    ])
    const configMap = await getStoredProductVariationConfigMap(productRows.map((product) => product.id))
    const materialsById = await getProductVariationMaterialsMap(
      collectProductVariationMaterialIds(productRows, configMap),
    )

    featuredProducts = productRows.map((product) => {
      const resolved = resolveProductMaterialVariations({
        productId: product.id,
        basePriceEUR: product.priceEur,
        productImagePath: product.imagePath ?? product.material?.imagePath ?? null,
        baseMaterialId: product.materialId,
        baseMaterial: product.material,
        storedConfig: configMap.get(product.id),
        materialsById,
      })
      const activeVariation = resolved.defaultVariation
      const activeMaterial = activeVariation?.material ?? product.material

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        priceEur: activeVariation?.priceEUR ?? Number(product.priceEur),
        badge: product.badge,
        stock: product.stock,
        imagePath: activeVariation?.images[0] ?? product.imagePath ?? product.material?.imagePath ?? null,
        materialId: activeVariation?.materialId ?? product.materialId ?? null,
        materialName: activeVariation?.materialName ?? activeMaterial?.name ?? null,
        variationOptions: resolved.variations.map((variation) => ({
          materialId: variation.materialId,
          materialName: variation.materialName,
          priceEur: variation.priceEUR,
          imagePath: variation.images[0] ?? variation.material?.imagePath ?? null,
          origin: variation.material?.origin ?? null,
        })),
      }
    })
    materials = materialRows
  } catch {
    // DB unavailable: page still renders without dynamic content.
  }

  return (
    <div>
      <section className="relative min-h-screen flex items-center justify-center bg-beige-light overflow-hidden">
        <div className="absolute top-24 left-8 md:left-16 w-16 h-16 border-t border-l border-gold/40 pointer-events-none" />
        <div className="absolute top-24 right-8 md:right-16 w-16 h-16 border-t border-r border-gold/40 pointer-events-none" />
        <div className="absolute bottom-20 left-8 md:left-16 w-16 h-16 border-b border-l border-gold/40 pointer-events-none" />
        <div className="absolute bottom-20 right-8 md:right-16 w-16 h-16 border-b border-r border-gold/40 pointer-events-none" />

        <div className="relative z-10 text-center max-w-3xl mx-auto px-6">
          <div className="flex justify-center mb-6">
            <Image
              src="/logo.svg"
              alt="Prela Atelier"
              width={80}
              height={80}
              className="opacity-80"
              priority
            />
          </div>
          <p className="section-eyebrow" style={{ letterSpacing: '0.3em' }}>
            {copy.heroEyebrow}
          </p>
          <h1 className="font-serif text-7xl md:text-9xl text-stone mb-6 leading-none mt-4">
            {copy.heroTitleLine1}<br />
            <em className="italic font-light text-gold">{copy.heroAccent}</em>
          </h1>
          <p className="text-stone-mid font-sans text-lg mb-12 leading-relaxed max-w-xl mx-auto">
            {copy.heroSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/collections" className="btn-primary">
              {copy.exploreCollection}
            </Link>
            <Link href="#story" className="btn-outline">
              {copy.ourStory}
            </Link>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-gold/60 text-[10px] font-sans tracking-widest uppercase">{copy.scroll}</span>
          <span className="text-gold/70 animate-bounce text-lg leading-none">v</span>
        </div>
      </section>

      <div className="bg-stone border-y border-gold/30 py-4 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap flex">
          {[...Array(3)].map((_, i) => (
            <span key={i} className="inline-block text-gold font-sans text-sm tracking-widest uppercase mr-0">
              {(materials.length > 0 ? materials.map((material) => material.name) : ['Carrara', 'Calacatta', 'Albanian Marble', 'Travertine', 'Onyx', 'Marquina', 'Emperador']).join(' *  ')} *&nbsp;&nbsp;&nbsp;
            </span>
          ))}
        </div>
      </div>

      <section className="py-24 bg-cream px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16" data-reveal>
            <p className="section-eyebrow">{copy.curatedSelection}</p>
            <h2 className="section-title">{copy.featuredPieces}</h2>
            <div className="divider-gold mx-auto" />
          </div>

          {featuredProducts.length === 0 ? (
            <p className="text-center text-stone-mid font-sans">{copy.noFeaturedProducts}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredProducts.map((product, idx) => (
                <div
                  key={product.id}
                  data-reveal
                  data-delay={String(idx * 150)}
                  className="group bg-white rounded-xl shadow-sm overflow-hidden"
                >
                  <Link href={`/product/${product.slug}`}>
                    <div className="relative aspect-square overflow-hidden bg-beige-light">
                      <Image
                        src={productImageUrl(product.imagePath)}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      {product.badge && (
                        <span className="absolute top-3 left-3 bg-gold text-white text-[10px] font-sans uppercase tracking-widest rounded-full px-3 py-1 z-10">
                          {product.badge}
                        </span>
                      )}
                      <div className="img-overlay">
                        <span className="img-overlay-label">{copy.viewDetails}</span>
                      </div>
                    </div>
                  </Link>

                  <div className="p-5">
                    {product.materialName ? (
                      <p className="font-sans text-xs text-stone-pale uppercase tracking-widest mb-1">
                        {product.materialName}
                      </p>
                    ) : null}
                    <Link href={`/product/${product.slug}`}>
                      <h3 className="font-serif text-lg text-stone hover:text-gold transition-colors mb-1">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="font-sans text-gold text-base mb-4">
                      {formatPrice(Number(product.priceEur), currencyOptions)}
                    </p>
                    <AddToCartButton
                      productId={product.id}
                      stock={product.stock}
                      productName={product.name}
                      priceEur={product.priceEur}
                      materialId={product.materialId}
                      materialName={product.materialName}
                      variationOptions={product.variationOptions}
                      currencyOptions={currencyOptions}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12" data-reveal>
            <Link href="/collections" className="btn-ghost">
              {copy.viewAllPieces} {'->'}
            </Link>
          </div>
        </div>
      </section>

      <section id="story" className="py-24 bg-stone text-cream px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div data-reveal>
            <p className="section-eyebrow" style={{ color: '#b08d57' }}>{copy.atelierEyebrow}</p>
            <h2 className="font-serif text-5xl text-cream mb-8 leading-tight">
              {copy.atelierTitleLine1}<br />{copy.atelierTitleLine2}
            </h2>
            <p className="text-cream/70 font-sans leading-relaxed mb-5">
              {copy.atelierTextOne}
            </p>
            <p className="text-cream/70 font-sans leading-relaxed mb-8">
              {copy.atelierTextTwo}
            </p>
            <Link href="/bespoke" className="btn-primary">
              {copy.commissionBespoke} {'->'}
            </Link>
          </div>
          <div data-reveal data-delay="200">
            <div className="bg-stone-mid/50 border border-gold/30 p-10 text-center">
              <span className="text-gold text-5xl">*</span>
              <p className="font-serif text-3xl text-cream mt-4 mb-2">Prela Atelier</p>
              <p className="font-sans text-xs text-cream/50 uppercase tracking-widest">Est. Lac, Albania</p>
              <div className="border-t border-gold/30 my-6" />
              <p className="font-sans text-cream/60 text-sm leading-relaxed">
                {copy.atelierCardText}
              </p>
            </div>
          </div>
        </div>
      </section>

      {materials.length > 0 && (
        <section className="py-24 bg-beige px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16" data-reveal>
              <p className="section-eyebrow">{copy.stonesEyebrow}</p>
              <h2 className="section-title">{copy.materialsTitle}</h2>
              <div className="divider-gold mx-auto" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {materials.slice(0, 4).map((material, idx) => (
                <div
                  key={material.id}
                  data-reveal
                  data-delay={String(idx * 100)}
                  className="bg-white border border-beige p-6 hover:border-gold transition-colors"
                >
                  {material.imagePath ? (
                    <div className="relative w-full h-36 mb-4 overflow-hidden">
                      <Image
                        src={material.imagePath}
                        alt={material.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    </div>
                  ) : (
                    <div
                      className="w-full h-20 mb-4"
                      style={{ backgroundColor: getSwatchColor(material.name) }}
                    />
                  )}
                  <h3 className="font-serif text-lg text-stone mb-2">{material.name}</h3>
                  <p className="font-sans text-sm text-stone-mid leading-relaxed">
                    {material.description.length > 90
                      ? `${material.description.slice(0, 90)}...`
                      : material.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="text-center mt-12" data-reveal>
              <Link href="/materials" className="btn-outline">
                {copy.exploreAllMaterials}
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="py-16 bg-cream border-t border-beige px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { icon: '*', label: copy.trustItems[0] },
            { icon: '*', label: copy.trustItems[1] },
            { icon: '*', label: copy.trustItems[2] },
            { icon: '*', label: copy.trustItems[3] },
          ].map((item, idx) => (
            <div key={item.label} data-reveal data-delay={String(idx * 100)}>
              <span className="text-gold text-2xl block mb-3">{item.icon}</span>
              <p className="font-sans text-sm text-stone uppercase tracking-widest leading-relaxed">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
