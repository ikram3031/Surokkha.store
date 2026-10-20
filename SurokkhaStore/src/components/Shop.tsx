import { forwardRef, useMemo } from 'react'
import { catLabel } from '@/data/products'
import { useProducts } from '@/hooks/useProducts'
import { FilterBar, type ShopFilter } from '@/components/shop/FilterBar'
import { ProductGrid } from '@/components/shop/ProductGrid'
import { Button } from '@/components/ui/button'

interface ShopProps {
  query: string
  filter: ShopFilter
  onFilterChange: (filter: ShopFilter) => void
}

export const Shop = forwardRef<HTMLDivElement, ShopProps>(function Shop(
  { query, filter, onFilterChange },
  ref,
) {
  const { products, loading, error } = useProducts()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter(
      (p) =>
        (filter === 'all' || p.cat === filter) &&
        (!q || (p.name + p.desc + catLabel[p.cat]).toLowerCase().includes(q)),
    )
  }, [products, filter, query])

  return (
    <section id="shop" ref={ref} className="mx-auto max-w-6xl px-4 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-display text-3xl font-bold">সব পণ্য</h2>
        <FilterBar value={filter} onChange={onFilterChange} />
      </div>

      {loading && (
        <p className="mt-10 text-center text-muted-foreground">পণ্য লোড হচ্ছে...</p>
      )}

      {!loading && error && (
        <div className="mt-10 text-center">
          <p className="text-muted-foreground">পণ্য লোড করা যায়নি। {error}</p>
          <Button variant="outline" className="mt-4 rounded-full" onClick={() => location.reload()}>
            আবার চেষ্টা করুন
          </Button>
        </div>
      )}

      {!loading && !error && <ProductGrid products={filtered} />}
    </section>
  )
})
