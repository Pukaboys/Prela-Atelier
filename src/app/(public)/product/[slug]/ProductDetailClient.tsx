'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { formatPrice, type CurrencyFormatOptions } from '@/lib/helpers'
import { useLanguage } from '@/components/providers/LanguageProvider'
import type { ProductImage, ProductMaterialDetails, ProductMaterialVariation } from '@/types'
import { ProductActions } from './ProductActions'
import { ProductGallery } from './ProductGallery'

type ProductDetailClientProduct = {
  id: number
  name: string
  badge: string | null
  stock: number
  description: string | null
  priceEur: number
  images: ProductImage[]
  material: ProductMaterialDetails | null
  defaultVariation: ProductMaterialVariation | null
  variations: ProductMaterialVariation[]
}

export function ProductDetailClient({
  product,
  currencyOptions,
}: {
  product: ProductDetailClientProduct
  currencyOptions?: CurrencyFormatOptions
}) {
  const { dictionary } = useLanguage()
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(
    product.defaultVariation?.materialId ?? product.variations[0]?.materialId ?? null,
  )

  const selectedVariation = useMemo(
    () =>
      product.variations.find((variation) => variation.materialId === selectedMaterialId) ??
      product.defaultVariation,
    [product.defaultVariation, product.variations, selectedMaterialId],
  )

  const currentMaterial = selectedVariation?.material ?? product.material
  const currentPrice = selectedVariation?.priceEur ?? product.priceEur
  const currentImages = selectedVariation?.images.length
    ? selectedVariation.images
    : product.images
  const mainImage = currentImages[0]?.path ?? '/assets/img/placeholder.svg'
  const extraImages = currentImages.slice(1).map((image) => image.path)
  const showMaterialSelector = product.variations.length > 1

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
      <div>
        {product.badge ? (
          <div className="mb-4">
            <span className="inline-block text-xs font-sans uppercase tracking-widest text-gold border border-gold px-2 py-0.5">
              {product.badge}
            </span>
          </div>
        ) : null}
        <ProductGallery main={mainImage} extras={extraImages} name={product.name} />
      </div>

      <div className="lg:pt-4">
        {currentMaterial ? (
          <p className="section-eyebrow mb-3">
            {currentMaterial.name}
            {currentMaterial.origin ? ` - ${currentMaterial.origin}` : ''}
          </p>
        ) : (
          <p className="section-eyebrow mb-3">{dictionary.product.defaultEyebrow}</p>
        )}

        <h1 className="font-serif text-5xl text-stone leading-tight mb-4">
          {product.name}
        </h1>

        <p className="font-sans text-3xl text-gold mb-6">
          {formatPrice(currentPrice, currencyOptions)}
        </p>

        <div className="divider-gold mb-6" />

        {showMaterialSelector ? (
          <div className="mb-6">
            <p className="font-sans text-xs uppercase tracking-widest text-stone-pale mb-3">
              {dictionary.product.selectMaterial}
            </p>
            <div className="flex flex-wrap gap-2">
              {product.variations.map((variation) => (
                <button
                  key={variation.materialId}
                  type="button"
                  onClick={() => setSelectedMaterialId(variation.materialId)}
                  className={`px-4 py-2 border text-sm font-sans transition-colors ${
                    selectedVariation?.materialId === variation.materialId
                      ? 'border-gold bg-gold text-white'
                      : 'border-beige text-stone hover:border-gold'
                  }`}
                >
                  {variation.materialName}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {product.description ? (
          <div className="font-sans text-stone-mid leading-relaxed whitespace-pre-wrap mb-6">
            {product.description}
          </div>
        ) : null}

        {currentMaterial?.description ? (
          <div className="mb-6">
            <p className="font-sans text-xs uppercase tracking-widest text-stone-pale mb-3">
              {dictionary.product.material}
            </p>
            <p className="font-sans text-stone-mid leading-relaxed">
              {currentMaterial.description}
            </p>
          </div>
        ) : null}

        {currentMaterial && (currentMaterial.hardness || currentMaterial.tone || currentMaterial.veining) ? (
          <div className="mb-6">
            <p className="font-sans text-xs uppercase tracking-widest text-stone-pale mb-3">
              {dictionary.product.stoneProperties}
            </p>
            <div className="flex flex-wrap gap-2">
              {currentMaterial.hardness ? (
                <span className="text-xs font-sans bg-beige text-stone-mid px-3 py-1 border border-beige">
                  {dictionary.product.hardness}: {currentMaterial.hardness}
                </span>
              ) : null}
              {currentMaterial.tone ? (
                <span className="text-xs font-sans bg-beige text-stone-mid px-3 py-1 border border-beige">
                  {dictionary.product.tone}: {currentMaterial.tone}
                </span>
              ) : null}
              {currentMaterial.veining ? (
                <span className="text-xs font-sans bg-beige text-stone-mid px-3 py-1 border border-beige">
                  {dictionary.product.veining}: {currentMaterial.veining}
                </span>
              ) : null}
            </div>
            <Link href="/materials" className="inline-block mt-3 text-xs font-sans text-gold hover:underline">
              {dictionary.product.learnMoreAbout(currentMaterial.name)} {'->'}
            </Link>
          </div>
        ) : null}

        <div className="divider-gold mb-8" />

        <ProductActions
          productId={product.id}
          productName={product.name}
          stock={product.stock}
          priceEur={currentPrice}
          materialId={selectedVariation?.materialId ?? null}
          materialName={selectedVariation?.materialName ?? currentMaterial?.name ?? null}
        />

        <div className="mt-8 pt-8 border-t border-beige space-y-3">
          <div className="flex items-center gap-3 font-sans text-sm text-stone-mid">
            <span className="text-gold">*</span>
            <span>{dictionary.product.freeShippingOver(formatPrice(500, currencyOptions))}</span>
          </div>
          <div className="flex items-center gap-3 font-sans text-sm text-stone-mid">
            <span className="text-gold">*</span>
            <span>{dictionary.product.estimatedDelivery}</span>
          </div>
          <div className="flex items-center gap-3 font-sans text-sm text-stone-mid">
            <span className="text-gold">*</span>
            <span>{dictionary.product.certificateIncluded}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
