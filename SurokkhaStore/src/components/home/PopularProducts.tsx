import { ProductGrid } from '@/components/shop/ProductGrid'
import { useShowcaseProducts } from '@/hooks/useShowcaseProducts'

// 4 columns × 2 rows on desktop
const MAX_PRODUCTS = 8

const phrases = ['Private care for everyone', 'Safe and judgement-free']

/** Big slow-moving text band; the content is doubled so the loop is seamless. */
function Marquee() {
  return (
    <div className="mt-16 overflow-hidden whitespace-nowrap" aria-hidden="true">
      <div className="animate-marquee inline-flex gap-16 text-5xl font-bold leading-none motion-reduce:animate-none md:text-8xl">
        {[0, 1].flatMap((copy) =>
          phrases.map((phrase, i) => (
            <span key={`${copy}-${phrase}`} className={i % 2 === 0 ? 'text-primary/80' : 'text-foreground/15'}>
              {phrase}
            </span>
          )),
        )}
      </div>
    </div>
  )
}

/** Dashboard "On Sale" picks (Settings → Products Showcases) in a 4×2 grid, with the marquee band below. */
export function PopularProducts() {
  const { products, loading } = useShowcaseProducts('onSale')
  if (loading || products.length === 0) return null

  return (
    <section id="on-sale" className="bg-secondary/40 pb-14 pt-16 md:pt-24" aria-label="On sale products">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">On sale now</h2>
          <p className="mt-3 text-muted-foreground">Hand-picked offers from our store</p>
        </div>
        <ProductGrid products={products.slice(0, MAX_PRODUCTS)} />
      </div>
      <Marquee />
    </section>
  )
}
