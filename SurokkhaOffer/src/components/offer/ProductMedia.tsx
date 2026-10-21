import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ProductArtIcon } from '@/components/icons/ArtIcons'
import type { OfferProduct } from '@/data/offerProducts'

/** Slides for a product: its photos, or one drawn art per variant colour (or the product's own) */
function slidesOf(p: OfferProduct) {
  if (p.images?.length) return p.images.map((src) => ({ src }))
  const colored = p.variants?.filter((v) => v.c1 && v.c2) ?? []
  return colored.length ? colored.map((v) => ({ c1: v.c1!, c2: v.c2! })) : [{ c1: p.c1, c2: p.c2 }]
}

/** Swipeable image slider (CSS scroll-snap) with arrows and dots */
export function ProductSlider({ product, compact = false }: { product: OfferProduct; compact?: boolean }) {
  const slides = slidesOf(product)
  const ref = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)

  const go = (i: number) => {
    const el = ref.current
    if (!el) return
    el.scrollTo({ left: el.clientWidth * i, behavior: 'smooth' })
  }

  return (
    <div className="relative">
      <div
        ref={ref}
        onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className={`flex aspect-square snap-x snap-mandatory overflow-x-auto bg-white ${compact ? '' : 'rounded-2xl'} [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
      >
        {slides.map((s, i) => (
          <div key={i} className="flex w-full shrink-0 snap-center items-center justify-center">
            {'src' in s ? (
              <img src={s.src} alt={`${product.name} ${i + 1}`} className="h-full w-full object-cover" />
            ) : (
              <div className="h-3/5 w-3/5">
                <ProductArtIcon art={product.art} c1={s.c1} c2={s.c2} />
              </div>
            )}
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(Math.max(0, index - 1))}
            aria-label="আগের ছবি"
            className={`absolute left-2 top-1/2 hidden ${compact ? 'size-7' : 'size-9'} -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow sm:flex`}
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => go(Math.min(slides.length - 1, index + 1))}
            aria-label="পরের ছবি"
            className={`absolute right-2 top-1/2 hidden ${compact ? 'size-7' : 'size-9'} -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow sm:flex`}
          >
            <ChevronRight className="size-5" />
          </button>
          <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-label={`ছবি ${i + 1}`}
                className={`h-2 rounded-full transition-all ${i === index ? 'w-5 bg-primary' : 'w-2 bg-primary/30'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
