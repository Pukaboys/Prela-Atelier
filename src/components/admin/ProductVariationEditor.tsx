'use client'

import { useState } from 'react'

export type ProductVariationFormValue = {
  materialId: string
  materialName: string
  priceEUR: string
  images: string[]
  isDefault: boolean
}

type MaterialOption = {
  id: number
  name: string
  imagePath: string | null
}

type Props = {
  materials: MaterialOption[]
  value: ProductVariationFormValue[]
  onChange: (next: ProductVariationFormValue[]) => void
  uploadFile: (file: File) => Promise<string | null>
  onUploadingChange: (uploading: boolean) => void
}

const EMPTY_VARIATION: ProductVariationFormValue = {
  materialId: '',
  materialName: '',
  priceEUR: '',
  images: [],
  isDefault: false,
}

function uniqueImages(images: string[]) {
  return [...new Set(images.map((image) => image.trim()).filter(Boolean))]
}

export function ProductVariationEditor({
  materials,
  value,
  onChange,
  uploadFile,
  onUploadingChange,
}: Props) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)

  function updateVariation(index: number, next: Partial<ProductVariationFormValue>) {
    onChange(value.map((variation, currentIndex) => {
      if (currentIndex !== index) return variation

      const nextVariation = { ...variation, ...next }
      if ('materialId' in next) {
        const material = materials.find((entry) => entry.id === Number.parseInt(nextVariation.materialId, 10))
        nextVariation.materialName = material?.name ?? ''
      }
      return nextVariation
    }))
  }

  function addVariation() {
    onChange([
      ...value,
      {
        ...EMPTY_VARIATION,
        isDefault: value.length === 0,
      },
    ])
  }

  function removeVariation(index: number) {
    const filtered = value.filter((_, currentIndex) => currentIndex !== index)
    const hasDefault = filtered.some((variation) => variation.isDefault)

    onChange(filtered.map((variation, currentIndex) => ({
      ...variation,
      isDefault: hasDefault ? variation.isDefault : currentIndex === 0,
    })))
  }

  function setDefault(index: number) {
    onChange(value.map((variation, currentIndex) => ({
      ...variation,
      isDefault: currentIndex === index,
    })))
  }

  async function handleUpload(index: number, files: FileList | null) {
    const nextFiles = Array.from(files ?? [])
    if (nextFiles.length === 0) return

    setUploadingIndex(index)
    onUploadingChange(true)

    try {
      const uploaded = (await Promise.all(nextFiles.map((file) => uploadFile(file))))
        .filter((path): path is string => Boolean(path))

      if (uploaded.length === 0) return

      updateVariation(index, {
        images: uniqueImages([...value[index].images, ...uploaded]),
      })
    } finally {
      setUploadingIndex(null)
      onUploadingChange(false)
    }
  }

  return (
    <div className="border border-beige p-4 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <label className="form-label">Material Variations</label>
          <p className="text-xs font-sans text-stone-pale">
            Add optional stone-specific pricing and galleries without changing the product schema.
          </p>
        </div>
        <button type="button" onClick={addVariation} className="btn-outline text-xs px-4 py-2 whitespace-nowrap">
          + Add Material
        </button>
      </div>

      {value.length === 0 ? (
        <div className="border border-dashed border-beige px-4 py-6 text-center">
          <p className="text-sm font-sans text-stone-mid">No material variations yet. The product will use its main material and gallery.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {value.map((variation, index) => {
            const selectedMaterialId = Number.parseInt(variation.materialId, 10)
            const selectedMaterial = Number.isInteger(selectedMaterialId)
              ? materials.find((material) => material.id === selectedMaterialId)
              : null

            return (
              <div key={`${variation.materialId || 'new'}-${index}`} className="border border-beige p-4 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-sans uppercase tracking-[0.22em] text-stone-pale">
                    Variation {index + 1}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDefault(index)}
                      className={`text-xs font-sans uppercase tracking-widest px-3 py-1 border ${
                        variation.isDefault
                          ? 'border-gold bg-gold text-white'
                          : 'border-beige text-stone hover:border-gold'
                      }`}
                    >
                      {variation.isDefault ? 'Default' : 'Set Default'}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeVariation(index)}
                      className="text-xs font-sans uppercase tracking-widest text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Material</label>
                    <select
                      className="form-select"
                      value={variation.materialId}
                      onChange={(event) => updateVariation(index, { materialId: event.target.value })}
                    >
                      <option value="">-- Select material --</option>
                      {materials.map((material) => {
                        const usedElsewhere = value.some((entry, entryIndex) => (
                          entryIndex !== index && entry.materialId === String(material.id)
                        ))

                        return (
                          <option key={material.id} value={material.id} disabled={usedElsewhere}>
                            {material.name}
                          </option>
                        )
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Variation Price (EUR)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="form-input"
                      value={variation.priceEUR}
                      onChange={(event) => updateVariation(index, { priceEUR: event.target.value })}
                      placeholder="Leave blank to use product price"
                    />
                  </div>
                </div>

                {selectedMaterial?.imagePath ? (
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={selectedMaterial.imagePath} alt={selectedMaterial.name} className="w-12 h-12 object-cover border border-beige" />
                    <button
                      type="button"
                      onClick={() => updateVariation(index, {
                        images: uniqueImages([selectedMaterial.imagePath ?? '', ...variation.images]),
                      })}
                      className="text-xs font-sans text-gold border border-gold px-3 py-1 hover:bg-gold hover:text-white transition-colors"
                    >
                      Use material image
                    </button>
                  </div>
                ) : null}

                <div>
                  <label className="form-label">Variation Images</label>
                  {variation.images.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {variation.images.map((image, imageIndex) => (
                        <div key={`${image}-${imageIndex}`} className="relative group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={image} alt="" className="w-16 h-16 object-cover border border-beige" />
                          <button
                            type="button"
                            onClick={() => updateVariation(index, {
                              images: variation.images.filter((_, currentImageIndex) => currentImageIndex !== imageIndex),
                            })}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            x
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs font-sans text-stone-pale mb-3">
                      No variation-specific images yet. The public page will fall back to the product gallery.
                    </p>
                  )}
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={async (event) => {
                      await handleUpload(index, event.target.files)
                      event.currentTarget.value = ''
                    }}
                    className="block text-sm text-stone-mid font-sans"
                  />
                  {uploadingIndex === index ? (
                    <p className="text-xs text-stone-mid mt-1 font-sans">Uploading variation images...</p>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
