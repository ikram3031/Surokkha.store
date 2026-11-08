import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductCard } from '@/components/shop/ProductCard'
import type { Product } from '@/data/products'
import { SectionHeading } from '@/components/SectionHeading'

const AUTOPLAY_MS = 3500

/** Titled row of products, four at a time on desktop; moves on its own and has arrow buttons. */
export function ProductCarousel({
  id,
  title,
  subtitle,
  products,
  className = '',
}: {
  id?: string
  title: string
  subtitle?: string
  products: Product[]
  className?: string
}) {
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
    if (paused || products.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = setInterval(() => step(1), AUTOPLAY_MS)
    return () => clearInterval(timer)
  }, [paused, products.length, step])

  if (products.length === 0) return null

  return (
    <section
      id={id}
      className={`mx-auto max-w-7xl px-4 py-12 md:py-16 ${className}`}
      aria-label={title}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div className="flex items-end justify-between gap-4">
        <SectionHeading title={title} subtitle={subtitle} />
        <div className="hidden gap-2 sm:flex">
          <Button variant="outline" size="icon" className="rounded-full border-gold/60 bg-transparent text-gold hover:bg-gold hover:text-wine" aria-label="Previous" onClick={() => step(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="icon" className="rounded-full border-gold/60 bg-transparent text-gold hover:bg-gold hover:text-wine" aria-label="Next" onClick={() => step(1)}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product) => (
          <div key={product.id} className="w-[calc(50%-0.5rem)] shrink-0 snap-start lg:w-[calc(25%-0.75rem)]">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  )
}
