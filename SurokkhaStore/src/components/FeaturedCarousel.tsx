import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductCard } from '@/components/shop/ProductCard'
import { useShowcaseProducts } from '@/hooks/useShowcaseProducts'

const AUTOPLAY_MS = 3500

/** Auto-moving carousel of the products curated as "Featured" in the dashboard. */
export function FeaturedCarousel() {
  const { products: featured, loading } = useShowcaseProducts('featured')
  const trackRef = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)

  const step = useCallback((dir: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    const card = el.firstElementChild as HTMLElement | null
    const amount = card ? card.offsetWidth + 16 : el.clientWidth
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4
    const atStart = el.scrollLeft <= 4
    if (dir === 1 && atEnd) el.scrollTo({ left: 0, behavior: 'smooth' })
    else if (dir === -1 && atStart) el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' })
    else el.scrollBy({ left: dir * amount, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (paused || featured.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => step(1), AUTOPLAY_MS)
    return () => clearInterval(id)
  }, [paused, featured.length, step])

  if (loading || featured.length === 0) return null

  return (
    <section
      id="featured"
      className="mx-auto max-w-7xl px-4 pt-14"
      aria-label="ফিচারড পণ্য"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-display text-3xl font-bold">ফিচারড পণ্য</h2>
        <div className="hidden gap-2 sm:flex">
          <Button variant="outline" size="icon" className="rounded-full" aria-label="আগেরটি" onClick={() => step(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="icon" className="rounded-full" aria-label="পরেরটি" onClick={() => step(1)}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {featured.map((product) => (
          <div
            key={product.id}
            className="w-[calc(50%-0.5rem)] shrink-0 snap-start md:w-[calc(33.333%-0.667rem)] lg:w-[calc(25%-0.75rem)]"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  )
}
