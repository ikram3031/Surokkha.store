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

const AUTOPLAY_MS = 3500
const GAP_PX = 24

// The three 10-piece MO packs this carousel shows, in order. `image` is the pack shot in /public/banners.
const TRIO = [
  { slug: 'mo-multi-textured-latex-contraceptive-10-pcs', image: '/banners/mo-dotted-10.webp' }, // Dotted
  { slug: 'mo-micro-thin-latex-contraceptive-10-pcs', image: '/banners/mo-thin-10.webp' }, // Ultra Thin
  { slug: 'mo-micro-ribbed-natural-latex-contraceptive-10-pcs', image: '/banners/mo-ribbed-10.webp' }, // Ultra Ribbed
]

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
          className="pointer-events-none absolute inset-0 flex items-center justify-center bg-foreground/35 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-foreground shadow-lg">
            <Eye className="h-5 w-5" />
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-background/60">{catLabel[product.cat]}</p>
          <h3 className="mt-0.5 text-[15px] font-semibold leading-snug">{product.name}</h3>
          <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
            <span className="font-display text-lg font-bold text-accent">{taka(product.price)}</span>
            {onSale && <s className="text-sm text-background/50">{taka(product.regularPrice!)}</s>}
          </p>
        </div>
        <Button
          size="icon"
          className="shrink-0 rounded-full bg-accent text-foreground hover:bg-background"
          onClick={() => add(product)}
          aria-label={`Add ${product.name} to cart`}
        >
          <ShoppingCart className="h-4 w-4" />
        </Button>
      </div>
    </article>
  )
}

/** Intro copy on the left, an auto-moving carousel of the three 10-piece MO packs on the right. */
export function IntroProducts() {
  const { products: bestSellers, loading } = useShowcaseProducts('bestSeller')
  const { products: all } = useProducts()

  // The three MO packs; if any is missing from the catalog, top up with dashboard best sellers
  const trio: Product[] = TRIO.flatMap(({ slug, image }) => {
    const product = all.find((p) => p.slug === slug)
    return product ? [{ ...product, image }] : []
  })
  const used = new Set(trio.map((p) => p.id))
  const picks = [...trio, ...bestSellers.filter((p) => !used.has(p.id))].slice(0, 3)

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
    <section className="bg-foreground py-16 text-background md:py-24">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 lg:grid-cols-[1fr_1.6fr]">
        <div className="lg:pt-6">
          <h2 className="font-display text-4xl font-bold leading-[1.15] md:text-[2.6rem]">
            Care you can order
            <br />
            without the awkwardness
          </h2>
          <p className="mt-5 max-w-sm leading-relaxed text-background/70">
            Everything you need for safer sex and everyday intimate care, all in one place and delivered discreetly.
          </p>
          <Button
            size="lg"
            className="mt-8 h-12 rounded-full bg-background px-8 text-base text-foreground hover:bg-accent"
            onClick={() => document.getElementById('on-sale')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Shop now
          </Button>
        </div>

        <div
          className="min-w-0"
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
              <div key={product.id} className="w-full shrink-0 snap-start sm:w-[calc(50%-0.75rem)]">
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
                  className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-accent' : 'w-2 bg-background/30 hover:bg-background/50'}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
