import { useCallback, useEffect, useRef, useState } from 'react'
import { Eye, ShoppingCart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ProductArtIcon } from '@/components/icons/ArtIcons'
import { catLabel, type Product } from '@/data/products'
import { useCart } from '@/context/CartContext'
import { useProducts } from '@/hooks/useProducts'
import { useShowcaseProducts } from '@/hooks/useShowcaseProducts'
import { taka } from '@/lib/bn'
import { navigate, productPath } from '@/lib/router'
import { SectionHeading } from '@/components/SectionHeading'

const AUTOPLAY_MS = 3500
const GAP_PX = 24

function IntroProductCard({ product }: { product: Product }) {
  const { add } = useCart()
  const onSale = !!product.regularPrice && product.regularPrice > product.price
  const discount = onSale ? Math.round((1 - product.price / product.regularPrice!) * 100) : 0
  const open = () => product.slug && navigate(productPath(product.slug))

  return (
    <article className="group">
      <div
        role={product.slug ? 'link' : undefined}
        tabIndex={product.slug ? 0 : undefined}
        onClick={open}
        onKeyDown={(e) => e.key === 'Enter' && open()}
        className={`relative aspect-[4/5] overflow-hidden rounded-2xl bg-secondary ${product.slug ? 'cursor-pointer' : ''}`}
      >
        {discount > 0 && (
          <Badge className="absolute left-3 top-3 z-10 bg-primary text-primary-foreground hover:bg-primary">-{discount}%</Badge>
        )}
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="h-3/5 w-3/5">
              <ProductArtIcon art={product.art} c1={product.c1} c2={product.c2} />
            </div>
          </div>
        )}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-foreground shadow-lg">
            <Eye className="h-5 w-5" />
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-white/60">{catLabel[product.cat]}</p>
          <h3 className="mt-0.5 text-[15px] font-semibold leading-snug">{product.name}</h3>
          <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
            <span className="font-display text-lg font-bold text-price">{taka(product.price)}</span>
            {onSale && <s className="text-sm text-muted-foreground">{taka(product.regularPrice!)}</s>}
          </p>
        </div>
        <Button
          size="icon"
          variant="outline"
          className="size-9 shrink-0 rounded-full"
          onClick={() => add(product)}
          aria-label={`Add ${product.name} to cart`}
        >
          <ShoppingCart className="h-4 w-4" />
        </Button>
      </div>
    </article>
  )
}

/** Dark band right under the trust strip: the products on sale now, four at a time, moving on their own. */
export function IntroProducts() {
  const { products: showcase, loading } = useShowcaseProducts('onSale')
  const { products: all } = useProducts()

  // Dashboard "On Sale" picks first, then anything else with a sale price, so at least four are always shown
  const onSale = all.filter((p) => p.inStock !== false && !!p.regularPrice && p.regularPrice > p.price)
  const seen = new Set<string>()
  const picks: Product[] = [...showcase, ...onSale].filter((p) => {
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
    <section id="on-sale" className="bg-background py-14 text-white md:py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading invert title="On sale now" subtitle="Our best offers right now, delivered discreetly." />
          <Button
            size="lg"
            className="h-11 rounded-full bg-background px-7 text-foreground hover:bg-accent"
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
                <IntroProductCard product={product} />
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
                  className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-accent' : 'w-2 bg-white/30 hover:bg-white/50'}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
