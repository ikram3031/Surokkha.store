import { Check, Eye, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductSlider } from '@/components/offer/ProductMedia'
import type { OfferProduct } from '@/data/offerProducts'
import { bn, taka } from '@/lib/bn'

interface Props {
  product: OfferProduct
  qty: number
  /** Puts the pack in the order (if it is not there yet) and jumps to the checkout form */
  onOrderNow: () => void
  onQuickView: () => void
}

/** The Trial Pack: one product with a single "Order now" button that goes straight to checkout. */
export function TrialPackSection({ product, qty, onOrderNow, onQuickView }: Props) {
  const onSale = !!product.regularPrice && product.regularPrice > product.price

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <div className="grid items-center gap-6 overflow-hidden rounded-3xl border border-gray-200 bg-rose-50 p-4 sm:gap-10 sm:p-8 md:grid-cols-2">
          <div className="overflow-hidden rounded-2xl bg-white">
            <ProductSlider product={product} />
          </div>

          <div>
            <span className="inline-block rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-rose-700">
              Trial pack
            </span>
            <h2 className="mt-3 text-2xl font-bold leading-snug text-black sm:text-3xl">{product.name}</h2>
            {product.desc && <p className="mt-2 text-sm text-gray-700 sm:text-base">{product.desc}</p>}

            {product.details.length > 0 && (
              <ul className="mt-4 space-y-1.5 text-sm text-gray-700">
                {product.details.map((d) => (
                  <li key={d} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    {d}
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-5 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-rose-600">{taka(product.price)}</span>
              {onSale && <s className="text-base text-gray-400">{taka(product.regularPrice!)}</s>}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                className="h-12 flex-1 gap-2 rounded-full px-8 text-base sm:flex-none"
                disabled={!product.inStock}
                onClick={onOrderNow}
              >
                <ShoppingBag className="size-5" />
                {product.inStock ? 'Order now' : 'Out of stock'}
              </Button>
              <Button type="button" variant="outline" size="lg" className="h-12 gap-2 rounded-full bg-white px-6" onClick={onQuickView}>
                <Eye className="size-5" />
                Details
              </Button>
            </div>
            {qty > 0 && (
              <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                <Check className="size-4" /> In your order ({bn(qty)}) — scroll down to checkout
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
