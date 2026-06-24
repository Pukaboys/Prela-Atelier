import Image from 'next/image'
import Link from 'next/link'
import { formatPrice, productImageUrl, type CurrencyFormatOptions } from '@/lib/helpers'
import type { LanguageCode } from '@/lib/i18n'
import type { ProductRecommendation, RecommendationReason } from '@/server/services/recommendation-service'
import { AddToCartButton } from '@/components/ui/AddToCartButton'

const REASON_LABELS: Record<LanguageCode, Record<RecommendationReason, string>> = {
  en: {
    'same-material': 'Similar stone',
    'cart-match': 'Matches your cart',
    'viewed-match': 'Inspired by views',
    featured: 'Curated pick',
    'price-fit': 'Similar value',
  },
  sq: {
    'same-material': 'Gur i ngjashem',
    'cart-match': 'Pershtatet me shporten',
    'viewed-match': 'Nga shikimet tuaja',
    featured: 'Perzgjedhje',
    'price-fit': 'Vlere e ngjashme',
  },
}

const SECTION_COPY: Record<LanguageCode, { title: string; eyebrow: string; empty: string }> = {
  en: {
    eyebrow: 'Smart Recommendations',
    title: 'You may also like',
    empty: 'No recommendations available yet.',
  },
  sq: {
    eyebrow: 'Rekomandime Inteligjente',
    title: 'Mund t\'ju pelqeje edhe',
    empty: 'Nuk ka ende rekomandime.',
  },
}

export function ProductRecommendations({
  recommendations,
  currencyOptions,
  language,
  className = '',
}: {
  recommendations: ProductRecommendation[]
  currencyOptions?: CurrencyFormatOptions
  language: LanguageCode
  className?: string
}) {
  const copy = SECTION_COPY[language]

  if (recommendations.length === 0) {
    return null
  }

  return (
    <section className={`py-20 px-6 ${className}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <p className="section-eyebrow">{copy.eyebrow}</p>
            <h2 className="font-serif text-4xl text-stone mt-3">{copy.title}</h2>
          </div>
          <p className="font-sans text-sm text-stone-pale max-w-md">
            {language === 'sq'
              ? 'Te zgjedhura sipas produkteve te shikuara, shportes dhe ngjashmerise se materialit.'
              : 'Selected from viewed products, cart context, and material similarity.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {recommendations.map((product) => (
            <div
              key={product.id}
              className="group bg-white border border-beige hover:border-gold transition-colors duration-300 overflow-hidden"
            >
              <Link href={`/product/${product.slug}`}>
                <div className="relative aspect-square bg-beige-light overflow-hidden">
                  <Image
                    src={productImageUrl(product.imagePath)}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 768px) 100vw, 25vw"
                  />
                  {product.reasons[0] ? (
                    <span className="absolute top-3 left-3 bg-cream/95 text-stone text-[10px] font-sans uppercase tracking-widest rounded-full px-3 py-1 border border-gold/30">
                      {REASON_LABELS[language][product.reasons[0]]}
                    </span>
                  ) : null}
                  <div className="img-overlay">
                    <span className="img-overlay-label">
                      {language === 'sq' ? 'Shiko Detajet' : 'View Details'}
                    </span>
                  </div>
                </div>
              </Link>

              <div className="p-5">
                {product.material ? (
                  <p className="font-sans text-xs text-stone-pale uppercase tracking-widest mb-1">
                    {product.material.name}
                    {product.material.origin ? ` - ${product.material.origin}` : ''}
                  </p>
                ) : null}
                <Link href={`/product/${product.slug}`}>
                  <h3 className="font-serif text-lg text-stone hover:text-gold transition-colors mb-1">
                    {product.name}
                  </h3>
                </Link>
                <p className="font-sans text-gold text-base mb-4">
                  {formatPrice(product.priceEur, currencyOptions)}
                </p>
                <AddToCartButton
                  productId={product.id}
                  stock={product.stock}
                  productName={product.name}
                  priceEur={product.priceEur}
                  materialId={product.materialId}
                  materialName={product.materialName ?? product.material?.name ?? null}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
