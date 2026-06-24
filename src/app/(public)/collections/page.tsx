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
  title: 'Collections - Prela Atelier',
  description: 'Browse the full Prela Atelier marble accessories collection.',
}

export default async function CollectionsPage() {
  const [currencyOptions, language] = await Promise.all([getDisplayCurrencyOptions(), getCurrentLanguage()])
  const copy = getPublicPageCopy(language).collections
  let products: {
    id: number
    name: string
    slug: string
    description: string | null
    priceEur: number
    badge: string | null
    stock: number
    imagePath: string | null
    materialId: number | null
    materialName: string | null
    material: { id: number; name: string; origin: string | null; imagePath: string | null } | null
    variationOptions: Array<{
      materialId: number
      materialName: string
      priceEur: number
      imagePath: string | null
      origin: string | null
    }>
  }[] = []

  try {
    const rows = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        priceEur: true,
        badge: true,
        stock: true,
        imagePath: true,
        materialId: true,
        material: { select: { id: true, name: true, origin: true, imagePath: true } },
      },
      orderBy: { id: 'asc' },
    })
    const configMap = await getStoredProductVariationConfigMap(rows.map((product) => product.id))
    const materialsById = await getProductVariationMaterialsMap(
      collectProductVariationMaterialIds(rows, configMap),
    )

    products = rows.map((product) => {
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
        ...product,
        priceEur: activeVariation?.priceEUR ?? Number(product.priceEur),
        imagePath: activeVariation?.images[0] ?? product.imagePath ?? product.material?.imagePath ?? null,
        materialId: activeVariation?.materialId ?? product.materialId ?? null,
        materialName: activeVariation?.materialName ?? activeMaterial?.name ?? null,
        material: activeMaterial
          ? {
              id: activeMaterial.id,
              name: activeMaterial.name,
              origin: activeMaterial.origin ?? null,
              imagePath: activeMaterial.imagePath ?? null,
            }
          : null,
        variationOptions: resolved.variations.map((variation) => ({
          materialId: variation.materialId,
          materialName: variation.materialName,
          priceEur: variation.priceEUR,
          imagePath: variation.images[0] ?? variation.material?.imagePath ?? null,
          origin: variation.material?.origin ?? null,
        })),
      }
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
            {copy.title}
          </h1>
          <div className="flex items-center gap-6">
            <div className="w-12 border-t border-gold" />
            {products.length > 0 && (
              <p className="font-sans text-stone-pale text-xs tracking-widest uppercase">
                {copy.piecesLabel(products.length)}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="py-24 bg-cream px-6">
        <div className="max-w-7xl mx-auto">
          {products.length === 0 ? (
            <div className="text-center py-24" data-reveal>
              <p className="font-serif text-2xl text-stone mb-4">{copy.noProductsTitle}</p>
              <p className="text-stone-mid font-sans mb-8">{copy.noProductsText}</p>
              <Link href="/" className="btn-primary">{copy.returnHome}</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product, idx) => {
                const displayImage = product.imagePath ?? product.material?.imagePath ?? null
                return (
                  <div
                    key={product.id}
                    data-reveal
                    data-delay={String((idx % 3) * 100)}
                    className="group bg-white border border-beige hover:border-gold transition-colors duration-300 overflow-hidden"
                  >
                    <Link href={`/product/${product.slug}`}>
                      <div className="relative aspect-square overflow-hidden bg-beige-light">
                        <Image
                          src={productImageUrl(displayImage)}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
                      {product.material && (
                        <p className="font-sans text-xs text-stone-pale uppercase tracking-widest mb-1">
                          {product.material.name}
                          {product.material.origin ? ` - ${product.material.origin}` : ''}
                        </p>
                      )}
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
                )
              })}
            </div>
          )}
        </div>
      </section>

      {products.length > 0 && (
        <section className="py-20 bg-stone text-center px-6">
          <div className="max-w-xl mx-auto" data-reveal>
            <p className="section-eyebrow" style={{ color: '#b08d57' }}>{copy.somethingUnique}</p>
            <h2 className="font-serif text-4xl text-cream mb-5">{copy.commissionTitle}</h2>
            <p className="font-sans text-cream/60 mb-8 leading-relaxed">
              {copy.commissionText}
            </p>
            <Link href="/bespoke" className="btn-outline" style={{ color: '#faf8f4', borderColor: '#b08d57' }}>
              {copy.beginCommission}
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
