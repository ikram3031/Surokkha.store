import { useMemo, useState } from 'react'
import { ProductGrid } from '@/components/shop/ProductGrid'
import { useProducts } from '@/hooks/useProducts'
import type { Product } from '@/data/products'
import { navigate } from '@/lib/router'
import { bn } from '@/lib/bn'
import { L } from '@/lib/i18n'

type OfferKind = 'all' | 'discount' | 'free-delivery'
type Sort = 'biggest-discount' | 'price-low' | 'price-high'

const discountOf = (p: Product) =>
  p.regularPrice && p.regularPrice > p.price ? Math.round((1 - p.price / p.regularPrice) * 100) : p.directOffer?.discountPercent ?? 0
const hasFreeDelivery = (p: Product) => !!(p.freeDelivery || p.directOffer?.freeDelivery)
const isOffer = (p: Product) => discountOf(p) > 0 || hasFreeDelivery(p) || !!p.directOffer

const selectClass =
  'h-10 rounded-lg border border-border bg-background px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring'

/** Every product on any offer (discount, free delivery, dashboard Direct Offer), laid out like a category page. */
export function OfferProductsPage() {
  const { products, loading, error } = useProducts()
  const [kind, setKind] = useState<OfferKind>('all')
  const [sort, setSort] = useState<Sort>('biggest-discount')

  const list = useMemo(() => {
    const offers = products.filter(isOffer).filter((p) =>
      kind === 'discount' ? discountOf(p) > 0 : kind === 'free-delivery' ? hasFreeDelivery(p) : true,
    )
    return [...offers].sort((a, b) =>
      sort === 'price-low' ? a.price - b.price : sort === 'price-high' ? b.price - a.price : discountOf(b) - discountOf(a),
    )
  }, [products, kind, sort])

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
        <span className="font-semibold text-foreground" aria-current="page">
          {L('Offers', 'অফার')}
        </span>
      </nav>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">{L('Offers', 'অফার')}</h1>
          {!loading && !error && (
            <p className="mt-1 text-muted-foreground">
              {bn(list.length)} {L('products on offer', 'টি অফারের প্রোডাক্ট')}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={kind} onChange={(e) => setKind(e.target.value as OfferKind)} className={selectClass} aria-label={L('Offer type', 'অফারের ধরন')}>
            <option value="all">{L('All offers', 'সব অফার')}</option>
            <option value="discount">{L('Discount', 'ছাড়')}</option>
            <option value="free-delivery">{L('Free delivery', 'ফ্রি ডেলিভারি')}</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={selectClass} aria-label={L('Sort', 'সাজান')}>
            <option value="biggest-discount">{L('Biggest discount', 'বেশি ছাড় আগে')}</option>
            <option value="price-low">{L('Price: low to high', 'দাম: কম থেকে বেশি')}</option>
            <option value="price-high">{L('Price: high to low', 'দাম: বেশি থেকে কম')}</option>
          </select>
        </div>
      </div>

      {loading && <p className="mt-10 text-center text-muted-foreground">{L('Loading products...', 'প্রোডাক্ট লোড হচ্ছে...')}</p>}
      {!loading && error && <p className="mt-10 text-center text-muted-foreground">{L('Could not load products.', 'প্রোডাক্ট লোড করা যায়নি।')} {error}</p>}
      {!loading && !error && list.length === 0 && (
        <p className="mt-10 text-center text-muted-foreground">{L('No offers right now.', 'এই মুহূর্তে কোনো অফার নেই।')}</p>
      )}
      {!loading && !error && list.length > 0 && <ProductGrid products={list} />}
    </div>
  )
}
