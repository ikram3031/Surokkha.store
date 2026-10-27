import { ProductGrid } from '@/components/shop/ProductGrid'
import { useShowcaseProducts } from '@/hooks/useShowcaseProducts'

// 4 columns × 2 rows on desktop
const MAX_PRODUCTS = 8

/** Products picked as "On Sale" in the dashboard (Settings → Products Showcases). */
export function OnSaleSection() {
  const { products, loading } = useShowcaseProducts('onSale')
  if (loading || products.length === 0) return null

  return (
    <section id="on-sale" className="mx-auto max-w-7xl px-4 pb-10 pt-4" aria-label="On sale products">
      <h2 className="font-display text-3xl font-bold">On Sale</h2>
      <ProductGrid products={products.slice(0, MAX_PRODUCTS)} />
    </section>
  )
}
