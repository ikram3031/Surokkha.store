import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { type Product } from '@/data/products'
import { useBestSellers } from '@/hooks/useBestSellers'
import { useShowcaseProducts } from '@/hooks/useShowcaseProducts'
import { navigate } from '@/lib/router'
import { SectionHeading } from '@/components/SectionHeading'
import { ProductCard } from '@/components/shop/ProductCard'

const AUTOPLAY_MS = 3500
const GAP_PX = 24


/** Band right under the trust strip: "Featured products", the best sellers by completed-order count, moving on their own. */
export function IntroProducts() {
  const { products: bestSellers, loading } = useBestSellers(8)
  const { products: featured } = useShowcaseProducts('featured')

  // Best sellers first, then the dashboard "Featured" picks, so the row is never short
  const seen = new Set<string>()
  const picks: Product[] = [...bestSellers, ...featured].filter((p) => {
    const key = p.slug ?? String(p.id)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const trackRef = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)
  const [current, setCurrent] = useState(0)
  const [positions, setPositions] = useState(picks.length)

  const stepWidth = () => {
    const card = trackRef.current?.firstElementChild as HTMLElement | null
    return card ? card.offsetWidth + GAP_PX : 0
  }

  // How many distinct scroll stops there are (fewer than the card count when several are visible at once)
  const measure = useCallback(() => {
    const el = trackRef.current
    const w = stepWidth()
    if (!el || !w) return
    const stops = Math.round((el.scrollWidth - el.clientWidth) / w) + 1
    setPositions(Math.max(1, stops))
    setCurrent(Math.min(stops - 1, Math.round(el.scrollLeft / w)))
  }, [])

  const goTo = useCallback((index: number) => {
    trackRef.current?.scrollTo({ left: index * stepWidth(), behavior: 'smooth' })
  }, [])

  const next = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4
    if (atEnd) {
      el.scrollTo({ left: 0, behavior: 'smooth' })
      setCurrent(0)
    } else {
      el.scrollBy({ left: stepWidth(), behavior: 'smooth' })
      setCurrent((c) => c + 1)
    }
  }, [])

  useEffect(() => {
    if (paused || positions < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(next, AUTOPLAY_MS)
    return () => clearInterval(id)
  }, [paused, positions, next])

  const cardCount = picks.length
  useEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure, cardCount])

  if (loading && picks.length === 0) return null
  if (picks.length === 0) return null

  return (
    <section id="featured" className="bg-background py-14 text-white md:py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading invert title="Featured products" subtitle="Our best sellers, the packs customers order most." />
          <Button
            size="lg"
            className="h-11 rounded-full border border-gold bg-transparent px-7 text-gold-text hover:bg-gold/10"
            onClick={() => navigate('/category/combo')}
          >
            See all offers
          </Button>
        </div>

        <div
          className="mt-8 min-w-0"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
        >
          <div
            ref={trackRef}
            onScroll={measure}
            className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {picks.map((product) => (
              <div key={product.id} className="w-[calc(50%-0.75rem)] shrink-0 snap-start lg:w-[calc(25%-1.125rem)]">
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          {positions > 1 && (
            <div className="mt-6 flex justify-center gap-2" role="group" aria-label="Choose product">
              {Array.from({ length: positions }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Show slide ${i + 1}`}
                  aria-current={i === current}
                  className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-brand-accent' : 'w-2 bg-white/30 hover:bg-white/50'}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
