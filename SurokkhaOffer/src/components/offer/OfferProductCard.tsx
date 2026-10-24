import { Eye, Minus, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { fromPrice, type OfferProduct } from '@/data/offerProducts'
import { bn, taka } from '@/lib/bn'
import { ProductSlider } from './ProductMedia'

interface Props {
  product: OfferProduct
  qty: number
  onInc: () => void
  onDec: () => void
  onChooseOptions: () => void
  onQuickView: () => void
}

export function OfferProductCard({ product, qty, onInc, onDec, onChooseOptions, onQuickView }: Props) {
  const isVariable = !!product.variants?.length

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-3xl border-2 bg-white transition ${
        qty ? 'border-primary shadow-lg' : 'border-gray-200'
      }`}
    >
      <div className="relative">
        <ProductSlider product={product} compact />
        <button
          type="button"
          onClick={onQuickView}
          aria-label={`${product.name} বিস্তারিত দেখুন`}
          className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow transition hover:bg-emerald-700"
        >
          <Eye className="size-3.5" /> Details
        </button>
        {!product.inStock && (
          <span className="absolute inset-x-0 bottom-0 bg-gray-900/70 py-1 text-center text-xs font-semibold text-white">
            স্টক শেষ
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3 sm:p-4">
        {product.badge && (
          <Badge className="mb-0.5 w-fit bg-rose-100 text-[11px] text-rose-700 hover:bg-rose-100">{product.badge}</Badge>
        )}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug sm:text-base">{product.name}</h3>
        {product.desc && <p className="line-clamp-1 text-xs text-gray-600 sm:text-sm">{product.desc}</p>}
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <p className="leading-tight">
            <span className="text-base font-bold text-rose-600 sm:text-lg">{taka(fromPrice(product))}</span>
            {isVariable && <span className="ml-1 text-[11px] font-normal text-gray-600">থেকে</span>}
            {product.regularPrice && product.regularPrice > product.price && (
              <s className="ml-1 text-xs font-normal text-gray-400">{taka(product.regularPrice)}</s>
            )}
          </p>
          {qty > 0 && !isVariable ? (
            // Already in the order: a compact stepper in the same spot as "Add"
            <div className="flex shrink-0 items-center gap-1 rounded-full bg-primary p-0.5 text-primary-foreground">
              <button type="button" onClick={onDec} aria-label={`${product.name} কমান`}
                className="flex size-7 items-center justify-center rounded-full hover:bg-white/15">
                <Minus className="size-3.5" />
              </button>
              <span className="min-w-4 text-center text-sm font-semibold tabular-nums">{bn(qty)}</span>
              <button type="button" onClick={onInc} aria-label={`${product.name} বাড়ান`}
                className="flex size-7 items-center justify-center rounded-full hover:bg-white/15">
                <Plus className="size-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={isVariable ? onChooseOptions : onInc}
              disabled={!product.inStock}
              aria-label={`${product.name} বাড়ান`}
              className="flex h-8 shrink-0 items-center gap-1 rounded-full bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
            >
              {isVariable && qty > 0 ? bn(qty) : 'Add'} <Plus className="size-4" />
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
