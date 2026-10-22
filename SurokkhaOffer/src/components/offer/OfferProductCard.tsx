import { Eye, SlidersHorizontal } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { fromPrice, type OfferProduct } from '@/data/offerProducts'
import { bn, taka } from '@/lib/bn'
import { ProductSlider } from './ProductMedia'
import { QtyStepper } from './QtyStepper'

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
          className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-primary shadow"
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
        <p className="mb-2 mt-1 text-lg font-bold text-rose-600">
          {taka(fromPrice(product))}
          {isVariable && <span className="ml-1 text-xs font-normal text-gray-600">থেকে</span>}
          {product.regularPrice && product.regularPrice > product.price && (
            <s className="ml-1.5 text-sm font-normal text-gray-400">{taka(product.regularPrice)}</s>
          )}
        </p>
        <div className="mt-auto">
          {isVariable ? (
            <button
              type="button"
              onClick={onChooseOptions}
              disabled={!product.inStock}
              className="flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-primary text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
            >
              <SlidersHorizontal className="size-4" />
              {qty ? `${bn(qty)}টি বাছাই করা · বদলান` : 'অপশন বেছে নিন'}
            </button>
          ) : (
            <QtyStepper value={qty} onInc={onInc} onDec={onDec} label={product.name} />
          )}
        </div>
      </div>
    </article>
  )
}
