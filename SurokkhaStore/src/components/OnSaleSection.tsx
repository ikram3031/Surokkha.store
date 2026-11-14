import { ProductGrid } from '@/components/shop/ProductGrid'
import { useShowcaseProducts } from '@/hooks/useShowcaseProducts'
import { SectionHeading } from '@/components/SectionHeading'
import { L } from '@/lib/i18n'

// 4 columns × 2 rows on desktop
const MAX_PRODUCTS = 8

/** Products picked as "On Sale" in the dashboard (Settings → Products Showcases). */
export function OnSaleSection() {
  const { products, loading } = useShowcaseProducts('onSale')
  if (loading || products.length === 0) return null

  return (
    <section id="on-sale" className="mx-auto max-w-7xl px-4 pb-10 pt-4" aria-label={L('On sale products', 'ছাড়ের প্রোডাক্ট')}>
      <SectionHeading title={L('On sale', 'ছাড়ে পাচ্ছেন')} />
      <ProductGrid products={products.slice(0, MAX_PRODUCTS)} />
    </section>
  )
}
