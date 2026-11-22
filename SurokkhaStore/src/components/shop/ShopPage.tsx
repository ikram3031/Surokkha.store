import { useMemo, useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { ProductCard } from '@/components/shop/ProductCard'
import { ShopFilters } from '@/components/shop/ShopFilters'
import { HomeHero } from '@/components/home/HomeHero'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { useCategories } from '@/hooks/useCategories'
import { useProducts } from '@/hooks/useProducts'
import { bn } from '@/lib/bn'
import { L } from '@/lib/i18n'
import { navigate, useSearch } from '@/lib/router'

type Sort = 'default' | 'price-asc' | 'price-desc'

const SORTS: Sort[] = ['default', 'price-asc', 'price-desc']

// /shop: every in-stock product with category, price and search filters kept in the URL
export const ShopPage = () => {
  const { products, loading, error } = useProducts()
  const categories = useCategories()
  const search = useSearch()
  const params = useMemo(() => new URLSearchParams(search), [search])

  const category = params.get('cat') || 'all'
  const minPrice = params.get('min') || ''
  const maxPrice = params.get('max') || ''
  const query = params.get('q') || ''
  const sortParam = params.get('sort') as Sort | null
  const sort: Sort = sortParam && SORTS.includes(sortParam) ? sortParam : 'default'

  const [filtersOpen, setFiltersOpen] = useState(false)

  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(window.location.search)
    Object.entries(changes).forEach(([key, value]) => (value && value !== 'all' && value !== 'default' ? next.set(key, value) : next.delete(key)))
    const qs = next.toString()
    navigate(`${window.location.pathname}${qs ? `?${qs}` : ''}`, { replace: true, scroll: false })
  }

  const reset = () => update({ cat: '', min: '', max: '', q: '', sort: '' })

  const categoryOptions = useMemo(
    () =>
      categories
        .map((c) => ({ ...c, count: products.filter((p) => p.categorySlugs?.includes(c.slug)).length }))
        .filter((c) => c.count > 0),
    [categories, products],
  )

  const priceBounds = useMemo<[number, number]>(() => {
    const prices = products.map((p) => p.price).filter((n) => n > 0)
    return prices.length ? [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))] : [0, 0]
  }, [products])

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    const min = minPrice === '' ? null : Number(minPrice)
    const max = maxPrice === '' ? null : Number(maxPrice)
    const filtered = products.filter((p) => {
      if (category !== 'all' && !p.categorySlugs?.includes(category)) return false
      if (min !== null && p.price < min) return false
      if (max !== null && p.price > max) return false
      if (q && !`${p.name} ${p.apiName ?? ''} ${p.desc}`.toLowerCase().includes(q)) return false
      return true
    })
    if (sort === 'price-asc') return [...filtered].sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') return [...filtered].sort((a, b) => b.price - a.price)
    return filtered
  }, [products, category, minPrice, maxPrice, query, sort])

  const filters = (
    <ShopFilters
      categories={categoryOptions}
      total={products.length}
      category={category}
      minPrice={minPrice}
      maxPrice={maxPrice}
      priceBounds={priceBounds}
      onCategory={(slug) => update({ cat: slug })}
      onPrice={(min, max) => update({ min, max })}
      onReset={reset}
    />
  )

  return (
    <>
      <HomeHero />
      <div id="featured" className="mx-auto max-w-7xl px-4 py-6 md:py-10">
      <div className="flex flex-wrap items-center gap-2.5 border-b border-zinc-300 pb-5 sm:flex-nowrap sm:gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-10 shrink-0 border-zinc-700 bg-white text-zinc-950 font-semibold hover:bg-zinc-100 lg:hidden"
          onClick={() => setFiltersOpen(true)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {L('Filters', 'ফিল্টার')}
        </Button>
        <Input
          type="search"
          value={query}
          placeholder={L('Search products', 'প্রোডাক্ট খুঁজুন')}
          aria-label={L('Search products', 'প্রোডাক্ট খুঁজুন')}
          className="h-10 min-w-[140px] flex-1 border-zinc-700 bg-white text-zinc-950 placeholder:text-zinc-700"
          onChange={(e) => update({ q: e.target.value })}
        />
        <select
          value={sort}
          aria-label={L('Sort', 'সাজান')}
          className="h-10 shrink-0 rounded-md border border-zinc-700 bg-white px-3 text-sm font-semibold text-zinc-950"
          onChange={(e) => update({ sort: e.target.value })}
        >
          <option value="default">{L('Default', 'ডিফল্ট')}</option>
          <option value="price-asc">{L('Price: low to high', 'দাম: কম থেকে বেশি')}</option>
          <option value="price-desc">{L('Price: high to low', 'দাম: বেশি থেকে কম')}</option>
        </select>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-4">
        <aside className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">{filters}</div>
        </aside>

        <div className="lg:col-span-3">
          {loading && <p className="py-10 text-center text-muted-foreground">{L('Loading products...', 'প্রোডাক্ট লোড হচ্ছে...')}</p>}
          {!loading && error && (
            <p className="py-10 text-center text-muted-foreground">
              {L('Could not load products.', 'প্রোডাক্ট লোড করা যায়নি।')} {error}
            </p>
          )}
          {!loading && !error && list.length === 0 && (
            <div className="rounded-2xl border border-border bg-card px-4 py-14 text-center">
              <h2 className="text-lg font-bold">{L('No products found', 'কোনো প্রোডাক্ট পাওয়া যায়নি')}</h2>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                {L('Nothing matches these filters. Reset them and try again.', 'এই ফিল্টারে কিছু পাওয়া যায়নি। ফিল্টার রিসেট করে আবার দেখুন।')}
              </p>
              <Button type="button" className="mt-5" onClick={reset}>
                {L('Browse all products', 'সব প্রোডাক্ট দেখুন')}
              </Button>
            </div>
          )}
          {!loading && !error && list.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {list.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="left" className="w-[85vw] max-w-sm overflow-y-auto p-5">
          <SheetTitle>{L('Filters', 'ফিল্টার')}</SheetTitle>
          <SheetDescription className="sr-only">{L('Filter products by category and price', 'ক্যাটাগরি ও মূল্য দিয়ে প্রোডাক্ট ফিল্টার করুন')}</SheetDescription>
          <div className="mt-4">{filters}</div>
          <Button type="button" className="mt-4 w-full" onClick={() => setFiltersOpen(false)}>
            {L('Show', 'দেখুন')} {bn(list.length)} {L('products', 'টি প্রোডাক্ট')}
          </Button>
        </SheetContent>
      </Sheet>
    </div>
    </>
  )
}
