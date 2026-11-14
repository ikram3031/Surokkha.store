import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type Product } from '@/data/products'
import { useBestSellers } from '@/hooks/useBestSellers'
import { useShowcaseProducts } from '@/hooks/useShowcaseProducts'
import { navigate } from '@/lib/router'
import { SectionHeading } from '@/components/SectionHeading'
import { ProductCard } from '@/components/shop/ProductCard'
import { L } from '@/lib/i18n'

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

  const prev = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    if (el.scrollLeft <= 4) el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' })
    else el.scrollBy({ left: -stepWidth(), behavior: 'smooth' })
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
    <section id="featured" className="bg-background py-10 text-foreground md:py-14">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading title={L('Featured products', 'ফিচার্ড প্রোডাক্টস')} subtitle={L('Our best sellers, the packs customers order most.', 'আমাদের বেস্ট সেলার, গ্রাহকরা যে প্যাকগুলো সবচেয়ে বেশি অর্ডার করেন।')} />
          <Button
            size="lg"
            className="h-11 rounded-full border border-foreground/15 bg-transparent px-7 text-foreground hover:bg-foreground/10"
            onClick={() => navigate('/category/combo')}
          >
            {L('See all offers', 'সব অফার দেখুন')}
          </Button>
        </div>

        <div
          className="relative mt-8 min-w-0"
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
            <>
              <button
                type="button"
                onClick={prev}
                aria-label={L('Previous products', 'আগের প্রোডাক্ট')}
                className="absolute left-0 top-[38%] z-10 flex h-10 w-10 -translate-x-1/3 -translate-y-1/2 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-md ring-1 ring-border transition hover:bg-primary hover:text-primary-foreground md:h-11 md:w-11 md:-translate-x-1/2"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label={L('Next products', 'পরের প্রোডাক্ট')}
                className="absolute right-0 top-[38%] z-10 flex h-10 w-10 translate-x-1/3 -translate-y-1/2 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-md ring-1 ring-border transition hover:bg-primary hover:text-primary-foreground md:h-11 md:w-11 md:translate-x-1/2"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {positions > 1 && (
            <div className="mt-6 flex justify-center gap-2" role="group" aria-label={L('Choose product', 'প্রোডাক্ট বেছে নিন')}>
              {Array.from({ length: positions }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`${L('Show slide', 'স্লাইড দেখুন')} ${i + 1}`}
                  aria-current={i === current}
                  className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-brand-accent' : 'w-2 bg-foreground/30 hover:bg-foreground/50'}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
