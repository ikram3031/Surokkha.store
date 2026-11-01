import { useMemo } from 'react'
import { ProductGrid } from '@/components/shop/ProductGrid'
import { useProducts } from '@/hooks/useProducts'

/** Header search results: every product whose name or category contains all the typed words. */
export function SearchResults({ query, onClear }: { query: string; onClear: () => void }) {
  const { products, loading } = useProducts()

  const matches = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean)
    return products.filter((p) => {
      const haystack = [p.name, p.apiName, p.slug, p.desc, ...(p.categorySlugs ?? [])].join(' ').toLowerCase().replace(/-/g, ' ')
      return words.every((w) => haystack.includes(w))
    })
  }, [products, query])

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display text-2xl font-bold md:text-3xl">Search results for “{query.trim()}”</h1>
        <button type="button" onClick={onClear} className="text-sm font-semibold text-primary hover:underline">
          Clear search
        </button>
      </div>
      {loading && products.length === 0 ? (
        <p className="mt-10 text-center text-muted-foreground">Searching...</p>
      ) : (
        <ProductGrid products={matches} />
      )}
    </div>
  )
}
