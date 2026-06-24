'use client'
import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'

interface Props {
  main: string
  extras: string[]
  name: string
}

export function ProductGallery({ main, extras, name }: Props) {
  const all = useMemo(() => [main, ...extras], [main, extras])
  const [active, setActive] = useState(0)

  useEffect(() => {
    setActive(0)
  }, [all])

  return (
    <div>
      {/* Main display */}
      <div className="relative aspect-square overflow-hidden bg-beige-light mb-3">
        <Image
          key={active}
          src={all[active]}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority={active === 0}
        />
      </div>

      {/* Thumbnails — only shown when there are extras */}
      {all.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {all.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={`relative w-16 h-16 overflow-hidden border-2 transition-colors ${
                i === active ? 'border-gold' : 'border-beige hover:border-stone-pale'
              }`}
            >
              <Image
                src={src}
                alt={`${name} ${i + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
