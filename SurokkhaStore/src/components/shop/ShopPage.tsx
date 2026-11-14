import { ProductGrid } from '@/components/shop/ProductGrid'
import { useProducts } from '@/hooks/useProducts'
import { bn } from '@/lib/bn'
import { L } from '@/lib/i18n'

/** /shop: every product. Placeholder layout; the final shop page design comes separately. */
export function ShopPage() {
  const { products, loading, error } = useProducts()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
      <h1 className="font-display text-3xl font-bold md:text-4xl">{L('Shop', 'শপ')}</h1>
      {!loading && !error && (
        <p className="mt-1 text-muted-foreground">
          {bn(products.length)} {L('products', 'টি প্রোডাক্ট')}
        </p>
      )}
      {loading && <p className="mt-10 text-center text-muted-foreground">{L('Loading products...', 'প্রোডাক্ট লোড হচ্ছে...')}</p>}
      {!loading && error && <p className="mt-10 text-center text-muted-foreground">{L('Could not load products.', 'প্রোডাক্ট লোড করা যায়নি।')} {error}</p>}
      {!loading && !error && <ProductGrid products={products} />}
    </div>
  )
}
