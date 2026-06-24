'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { gtagEvent } from '@/lib/gtag'
import { formatPrice, productImageUrl, type CurrencyFormatOptions } from '@/lib/helpers'
import { useLanguage } from '@/components/providers/LanguageProvider'

type MaterialOption = {
  id: number
  name: string
  origin: string
  description: string
  tone: string | null
  veining: string | null
  imagePath: string | null
}

type Quote = {
  widthCm: number
  heightCm: number
  thicknessCm: number | null
  quantity: number
  materialId: number
  materialName: string
  materialImagePath: string | null
  materialOrigin: string | null
  areaM2: number
  totalAreaM2: number
  thicknessFactor: number
  estimatedMaterialCost: number
  estimatedProductionCost: number
  totalEstimatedPrice: number
  generatedAt: string
}

export function CustomOrderBuilder({
  materials,
  currencyOptions,
}: {
  materials: MaterialOption[]
  currencyOptions?: CurrencyFormatOptions
}) {
  const [step, setStep] = useState(0)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loadingQuote, setLoadingQuote] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    widthCm: '',
    heightCm: '',
    thicknessCm: '',
    quantity: '1',
    materialId: '',
    name: '',
    email: '',
    type: '',
    budget: '',
    description: '',
    timeline: '',
  })
  const { language, dictionary } = useLanguage()
  const copy = dictionary.customOrderBuilder
  const steps = copy.steps

  const selectedMaterial = materials.find((item) => String(item.id) === form.materialId) ?? null
  const widthCm = Number(form.widthCm) || 0
  const heightCm = Number(form.heightCm) || 0
  const quantity = Number(form.quantity) || 0
  const maxDim = Math.max(widthCm, heightCm, 1)
  const previewWidth = Math.max(96, (widthCm / maxDim) * 260 || 96)
  const previewHeight = Math.max(96, (heightCm / maxDim) * 260 || 96)
  const money = (value: number) => formatPrice(value, currencyOptions)

  function setField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (field === 'widthCm' || field === 'heightCm' || field === 'thicknessCm' || field === 'quantity' || field === 'materialId') {
      setQuote(null)
    }
  }

  function validate(currentStep: number) {
    if (currentStep === 0) {
      if (widthCm < 5 || heightCm < 5) return copy.validationDimensions
      if (quantity < 1) return copy.validationQuantity
    }
    if (currentStep === 1 && !selectedMaterial) return copy.validationMaterial
    if (currentStep === 3 && (!form.name.trim() || !form.email.trim() || !form.description.trim())) {
      return copy.validationContact
    }
    return ''
  }

  function next() {
    const validationError = validate(step)
    if (validationError) return setError(validationError)
    setError('')
    setStep((value) => Math.min(value + 1, steps.length - 1))
  }

  function back() {
    setError('')
    setStep((value) => Math.max(value - 1, 0))
  }

  async function calculate() {
    const validationError = validate(0) || validate(1)
    if (validationError) return setError(validationError)
    setError('')
    setLoadingQuote(true)
    try {
      const res = await fetch('/api/custom-order/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widthCm,
          heightCm,
          thicknessCm: form.thicknessCm ? Number(form.thicknessCm) : null,
          quantity,
          materialId: Number(form.materialId),
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) return setError(data.error ?? copy.unableToCalculate)
      setQuote(data.quote as Quote)
      setStep(3)
    } catch {
      setError(copy.networkCalculate)
    } finally {
      setLoadingQuote(false)
    }
  }

  async function submit() {
    const validationError = validate(3)
    if (validationError) return setError(validationError)
    if (!quote) return setError(copy.calculateFirst)
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/bespoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          type: form.type,
          budget: form.budget,
          description: form.description,
          timeline: form.timeline,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) return setError(data.error ?? copy.networkError)
      setSuccess(true)
      gtagEvent('generate_lead', { method: 'custom_order_builder' })
    } catch {
      setError(copy.networkError)
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="bg-white border border-beige p-10 text-center">
        <h3 className="font-serif text-2xl text-stone mb-3">{copy.successTitle}</h3>
        <p className="font-sans text-stone-mid mb-6">
          {copy.successText}
        </p>
        <Link href="/collections" className="btn-ghost">{dictionary.common.browseCollections}</Link>
      </div>
    )
  }

  return (
    <div className="bg-white border border-beige">
      <div className="px-6 py-5 border-b border-beige">
        <p className="section-eyebrow mb-2">{copy.structuredBuilder}</p>
        <h2 className="font-serif text-3xl text-stone">{copy.title}</h2>
      </div>
      <div className="px-6 pt-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {steps.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => index <= step && setStep(index)}
              className={`border px-4 py-3 text-left ${index === step ? 'border-gold bg-gold/5' : 'border-beige'}`}
            >
              <p className="text-[10px] uppercase tracking-[0.25em] text-stone-pale font-sans">{dictionary.common.step(index + 1)}</p>
              <p className="font-serif text-lg text-stone mt-1">{label}</p>
            </button>
          ))}
        </div>
      </div>
      <div className="p-6">
        {step === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">{copy.width}</label>
              <input type="number" min="5" step="0.1" className="form-input mt-1" value={form.widthCm} onChange={(e) => setField('widthCm', e.target.value)} />
            </div>
            <div>
              <label className="form-label">{copy.height}</label>
              <input type="number" min="5" step="0.1" className="form-input mt-1" value={form.heightCm} onChange={(e) => setField('heightCm', e.target.value)} />
            </div>
            <div>
              <label className="form-label">{copy.thickness}</label>
              <input type="number" min="0.5" step="0.1" className="form-input mt-1" value={form.thicknessCm} onChange={(e) => setField('thicknessCm', e.target.value)} placeholder="2" />
            </div>
            <div>
              <label className="form-label">{copy.quantity}</label>
              <input type="number" min="1" step="1" className="form-input mt-1" value={form.quantity} onChange={(e) => setField('quantity', e.target.value)} />
            </div>
          </div>
        )}
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {materials.map((material) => {
              const active = selectedMaterial?.id === material.id
              return (
                <button key={material.id} type="button" onClick={() => setField('materialId', String(material.id))} className={`text-left border overflow-hidden ${active ? 'border-gold bg-gold/5' : 'border-beige hover:border-gold/50'}`}>
                  <div className="relative h-40 bg-beige-light">
                    {material.imagePath ? <Image src={productImageUrl(material.imagePath)} alt={material.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" /> : null}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-serif text-2xl text-stone">{material.name}</h3>
                      {active ? <span className="text-gold text-xs uppercase tracking-[0.25em] font-sans">{dictionary.common.selected}</span> : null}
                    </div>
                    <p className="font-sans text-xs uppercase tracking-[0.25em] text-stone-pale mt-1">{material.origin}</p>
                    <p className="font-sans text-sm text-stone-mid mt-3">{material.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr,0.8fr] gap-8 items-start">
            <div className="border border-beige bg-cream p-6">
              <p className="form-label mb-4">{copy.preview2d}</p>
              <div className="relative h-[340px] border border-beige bg-white flex items-center justify-center overflow-hidden">
                {selectedMaterial?.imagePath ? <div className="absolute inset-0 opacity-[0.14] bg-cover bg-center" style={{ backgroundImage: `url(${productImageUrl(selectedMaterial.imagePath)})` }} /> : null}
                <div className="relative flex items-center justify-center">
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white border border-beige px-3 py-1 text-xs font-sans tracking-[0.2em] uppercase text-stone-mid">{widthCm || 0} cm</div>
                  <div className="absolute top-1/2 -left-14 -translate-y-1/2 -rotate-90 bg-white border border-beige px-3 py-1 text-xs font-sans tracking-[0.2em] uppercase text-stone-mid">{heightCm || 0} cm</div>
                  <div className="relative border-2 border-stone/60" style={{ width: `${previewWidth}px`, height: `${previewHeight}px`, backgroundImage: selectedMaterial?.imagePath ? `url(${productImageUrl(selectedMaterial.imagePath)})` : 'linear-gradient(135deg, #e9dcc6 0%, #faf8f4 100%)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                    <div className="absolute inset-3 border border-white/60" />
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white border border-beige p-6 space-y-3 font-sans text-sm text-stone-mid">
              <div className="flex justify-between gap-4"><span>{copy.material}</span><span className="text-stone text-right">{selectedMaterial?.name ?? dictionary.common.notSelected}</span></div>
              <div className="flex justify-between gap-4"><span>{copy.dimensions}</span><span className="text-stone text-right">{widthCm || 0} x {heightCm || 0} cm</span></div>
              <div className="flex justify-between gap-4"><span>{copy.thickness}</span><span className="text-stone text-right">{form.thicknessCm ? `${form.thicknessCm} cm` : copy.standardThickness}</span></div>
              <div className="flex justify-between gap-4"><span>{copy.quantity}</span><span className="text-stone text-right">{quantity || 1}</span></div>
            </div>
          </div>
        )}
        {step === 3 && quote ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr,0.95fr] gap-8">
            <div className="bg-cream border border-beige p-6">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="section-eyebrow mb-2">{copy.calculatedQuote}</p>
                  <h3 className="font-serif text-3xl text-stone">{quote.materialName}</h3>
                  <p className="font-sans text-sm text-stone-pale mt-1">{copy.estimateGenerated(new Date(quote.generatedAt).toLocaleDateString(language === 'sq' ? 'sq-AL' : 'en-GB'))}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.25em] font-sans text-stone-pale">{copy.estimatedTotal}</p>
                  <p className="font-serif text-3xl text-stone mt-2">{money(quote.totalEstimatedPrice)}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <div className="border border-beige bg-white p-4"><p className="text-[10px] uppercase tracking-[0.25em] font-sans text-stone-pale">{copy.areaPerPiece}</p><p className="font-serif text-2xl text-stone mt-2">{quote.areaM2.toFixed(2)} m2</p></div>
                <div className="border border-beige bg-white p-4"><p className="text-[10px] uppercase tracking-[0.25em] font-sans text-stone-pale">{copy.totalArea}</p><p className="font-serif text-2xl text-stone mt-2">{quote.totalAreaM2.toFixed(2)} m2</p></div>
                <div className="border border-beige bg-white p-4"><p className="text-[10px] uppercase tracking-[0.25em] font-sans text-stone-pale">{copy.materialCost}</p><p className="font-serif text-2xl text-stone mt-2">{money(quote.estimatedMaterialCost)}</p></div>
                <div className="border border-beige bg-white p-4"><p className="text-[10px] uppercase tracking-[0.25em] font-sans text-stone-pale">{copy.productionCost}</p><p className="font-serif text-2xl text-stone mt-2">{money(quote.estimatedProductionCost)}</p></div>
              </div>
              <div className="mt-6 border border-beige bg-white p-5 space-y-3 font-sans text-sm text-stone-mid">
                <div className="flex justify-between gap-4"><span>{copy.dimensions}</span><span className="text-stone text-right">{quote.widthCm} x {quote.heightCm} cm</span></div>
                <div className="flex justify-between gap-4"><span>{copy.thickness}</span><span className="text-stone text-right">{quote.thicknessCm ? `${quote.thicknessCm} cm` : copy.standardThickness}</span></div>
                <div className="flex justify-between gap-4"><span>{copy.quantity}</span><span className="text-stone text-right">{quote.quantity}</span></div>
                <div className="flex justify-between gap-4"><span>{copy.materialOrigin}</span><span className="text-stone text-right">{quote.materialOrigin ?? copy.selectedStone}</span></div>
                <div className="flex justify-between gap-4"><span>{copy.thicknessFactor}</span><span className="text-stone text-right">{quote.thicknessFactor.toFixed(2)}x</span></div>
              </div>
            </div>
            <div className="bg-white border border-beige p-6 space-y-5">
              <div><label className="form-label">{copy.fullName}</label><input type="text" className="form-input mt-1" value={form.name} onChange={(e) => setField('name', e.target.value)} /></div>
              <div><label className="form-label">{copy.emailAddress}</label><input type="email" className="form-input mt-1" value={form.email} onChange={(e) => setField('email', e.target.value)} /></div>
              <div><label className="form-label">{copy.typeOfPiece}</label><select className="form-select mt-1" value={form.type} onChange={(e) => setField('type', e.target.value)}><option value="">{copy.typePlaceholder}</option>{copy.typeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
              <div><label className="form-label">{copy.budgetRange}</label><select className="form-select mt-1" value={form.budget} onChange={(e) => setField('budget', e.target.value)}><option value="">{copy.budgetPlaceholder}</option>{copy.budgetOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
              <div><label className="form-label">{copy.describeVision}</label><textarea className="form-textarea mt-1" rows={5} value={form.description} onChange={(e) => setField('description', e.target.value)} /></div>
              <div><label className="form-label">{copy.timelineDeadline}</label><input type="text" className="form-input mt-1" value={form.timeline} onChange={(e) => setField('timeline', e.target.value)} placeholder={copy.deadlinePlaceholder} /></div>
            </div>
          </div>
        ) : null}
        {error ? <div className="flash-error mt-6">{error}</div> : null}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center border-t border-beige mt-8 pt-6">
          <div className="font-sans text-xs text-stone-pale">{dictionary.common.stepOf(step + 1, steps.length)}</div>
          <div className="flex gap-3">
            {step > 0 ? <button type="button" onClick={back} className="btn-ghost text-sm">{dictionary.common.back}</button> : null}
            {step < 2 ? <button type="button" onClick={next} className="btn-primary text-sm">{dictionary.common.continue}</button> : null}
            {step === 2 ? <button type="button" onClick={calculate} disabled={loadingQuote} className="btn-primary text-sm disabled:opacity-60">{loadingQuote ? copy.calculating : copy.calculateQuote}</button> : null}
            {step === 3 && quote ? <button type="button" onClick={submit} disabled={submitting} className="btn-primary text-sm disabled:opacity-60">{submitting ? copy.sending : copy.sendEnquiryWithQuote}</button> : null}
          </div>
        </div>
      </div>
    </div>
  )
}
