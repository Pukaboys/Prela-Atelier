'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { gtagEvent } from '@/lib/gtag'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { formatPrice, productImageUrl, type CurrencyFormatOptions } from '@/lib/helpers'

type QuickAddVariationOption = {
  materialId: number
  materialName: string
  priceEur: number
  imagePath?: string | null
  origin?: string | null
}

export function AddToCartButton({
  productId,
  stock,
  quantity = 1,
  productName,
  priceEur,
  materialId = null,
  materialName = null,
  variationOptions = [],
  currencyOptions,
}: {
  productId: number
  stock: number
  quantity?: number
  productName?: string
  priceEur?: number
  materialId?: number | null
  materialName?: string | null
  variationOptions?: QuickAddVariationOption[]
  currencyOptions?: CurrencyFormatOptions
}) {
  const [loading, setLoading] = useState(false)
  const [loadingVariationId, setLoadingVariationId] = useState<number | null>(null)
  const [added, setAdded] = useState(false)
  const [variationModalOpen, setVariationModalOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { dictionary } = useLanguage()

  const hasVariationChoice = variationOptions.length > 1
  const defaultVariation = variationOptions[0] ?? null

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const previousOverflow = document.body.style.overflow

    if (variationModalOpen) {
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [mounted, variationModalOpen])

  async function performAdd(selectedVariation?: QuickAddVariationOption | null) {
    setLoading(true)
    setLoadingVariationId(selectedVariation?.materialId ?? null)

    try {
      const nextMaterialId = selectedVariation?.materialId ?? materialId
      const nextMaterialName = selectedVariation?.materialName ?? materialName
      const nextPriceEur = selectedVariation?.priceEur ?? priceEur

      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity, materialId: nextMaterialId }),
      })

      if (res.ok) {
        setVariationModalOpen(false)
        setAdded(true)
        router.refresh()
        setTimeout(() => setAdded(false), 2000)

        if (productName && nextPriceEur !== undefined) {
          gtagEvent('add_to_cart', {
            currency: 'EUR',
            value: nextPriceEur * quantity,
            items: [{
              item_id: String(productId),
              item_name: productName,
              item_variant: nextMaterialName ?? undefined,
              price: nextPriceEur,
              quantity,
            }],
          })
        }
      }
    } finally {
      setLoading(false)
      setLoadingVariationId(null)
    }
  }

  async function handleAdd() {
    if (hasVariationChoice) {
      setVariationModalOpen(true)
      return
    }

    await performAdd(defaultVariation)
  }

  const modalContent = variationModalOpen ? (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-stone/75 p-4"
      role="dialog"
      aria-modal="true"
      onClick={() => setVariationModalOpen(false)}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-cream border border-beige shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-beige px-6 py-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-gold font-sans">
              {dictionary.product.addToCart}
            </p>
            <h3 className="font-serif text-3xl text-stone mt-2">
              {dictionary.product.selectMaterial}
            </h3>
            {productName ? (
              <p className="text-sm text-stone-mid font-sans mt-2">
                {productName}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setVariationModalOpen(false)}
            className="text-xs uppercase tracking-[0.22em] text-stone-mid hover:text-stone font-sans"
          >
            {dictionary.nav.closeMenu}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
          {variationOptions.map((variation) => {
            const variationImage = productImageUrl(variation.imagePath)
            const isLoadingVariation = loading && loadingVariationId === variation.materialId

            return (
              <button
                key={variation.materialId}
                type="button"
                onClick={() => performAdd(variation)}
                disabled={loading}
                className="text-left border border-beige bg-white hover:border-gold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="aspect-[5/4] bg-beige-light overflow-hidden">
                  {variation.imagePath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={variationImage} alt={variation.materialName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gold text-3xl">*</div>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-serif text-xl text-stone">
                    {variation.materialName}
                  </p>
                  {variation.origin ? (
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-pale font-sans mt-2">
                      {variation.origin}
                    </p>
                  ) : null}
                  <div className="flex items-center justify-between gap-3 mt-4">
                    <span className="text-gold font-sans text-sm">
                      {formatPrice(variation.priceEur, currencyOptions)}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.24em] text-stone-mid font-sans">
                      {isLoadingVariation ? dictionary.product.adding : dictionary.product.addToCart}
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  ) : null

  return (
    <>
      <button
        onClick={handleAdd}
        disabled={loading}
        className="w-full border border-stone/25 text-stone text-[11px] tracking-widest uppercase py-3 font-sans rounded hover:border-gold hover:text-gold transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? dictionary.product.adding : added ? `${dictionary.product.addedToCart} +` : dictionary.product.addToCart}
      </button>

      {mounted && modalContent ? createPortal(modalContent, document.body) : null}
    </>
  )
}
