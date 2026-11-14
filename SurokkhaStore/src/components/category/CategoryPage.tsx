import { useMemo } from 'react'
import { ProductGrid } from '@/components/shop/ProductGrid'
import { useCategories } from '@/hooks/useCategories'
import { useProducts } from '@/hooks/useProducts'
import { navigate } from '@/lib/router'
import { bn } from '@/lib/bn'
import { L } from '@/lib/i18n'

/** All products of one category (reached from the menu and the "Shop by need" tiles). */
export function CategoryPage({ slug }: { slug: string }) {
  const categories = useCategories()
  const { products, loading, error } = useProducts()

  const label = categories.find((c) => c.slug === slug)?.label ?? slug.replace(/-/g, ' ')
  const list = useMemo(() => products.filter((p) => p.categorySlugs?.includes(slug)), [products, slug])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
      <nav aria-label={L('Breadcrumb', 'ব্রেডক্রাম্ব')} className="flex items-center gap-2 text-sm text-muted-foreground">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault()
            navigate('/')
          }}
          className="hover:text-primary"
        >
          {L('Home', 'হোম')}
        </a>
        <span aria-hidden="true">/</span>
        <span className="font-semibold capitalize text-foreground" aria-current="page">
          {label}
        </span>
      </nav>

      <h1 className="mt-4 font-display text-3xl font-bold capitalize md:text-4xl">{label}</h1>
      {!loading && !error && list.length > 0 && (
        <p className="mt-1 text-muted-foreground">
          {bn(list.length)} {list.length === 1 ? L('product', 'টি প্রোডাক্ট') : L('products', 'টি প্রোডাক্ট')}
        </p>
      )}

      {loading && <p className="mt-10 text-center text-muted-foreground">{L('Loading products...', 'প্রোডাক্ট লোড হচ্ছে...')}</p>}
      {!loading && error && <p className="mt-10 text-center text-muted-foreground">{L('Could not load products.', 'প্রোডাক্ট লোড করা যায়নি।')} {error}</p>}
      {!loading && !error && list.length === 0 && (
        <p className="mt-10 text-center text-muted-foreground">{L('No products in this category yet.', 'এই ক্যাটাগরিতে এখনো কোনো প্রোডাক্ট নেই।')}</p>
      )}
      {!loading && !error && list.length > 0 && <ProductGrid products={list} />}
    </div>
  )
}
