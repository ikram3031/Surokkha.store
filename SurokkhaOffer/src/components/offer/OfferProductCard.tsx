import { Eye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { fromPrice, type OfferProduct } from '@/data/offerProducts'
import { taka } from '@/lib/bn'
import { ProductSlider } from './ProductMedia'
import { QtyStepper } from './QtyStepper'

interface Props {
  product: OfferProduct
  qty: number
  onInc: () => void
  onDec: () => void
  onQuickView: () => void
}

export function OfferProductCard({ product, qty, onInc, onDec, onQuickView }: Props) {
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
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3 sm:p-4">
        {product.badge && (
          <Badge className="mb-0.5 w-fit bg-rose-100 text-[11px] text-rose-700 hover:bg-rose-100">{product.badge}</Badge>
        )}
        <h3 className="text-sm font-semibold leading-snug sm:text-base">{product.name}</h3>
        <p className="line-clamp-1 text-xs text-gray-600 sm:text-sm">{product.desc}</p>
        <p className="mb-2 mt-1 text-lg font-bold text-rose-600">
          {taka(fromPrice(product))}
          {(product.unitLabel || isVariable) && (
            <span className="ml-1 text-xs font-normal text-gray-600">{product.unitLabel ?? 'থেকে'}</span>
          )}
        </p>
        <div className="mt-auto">
          <QtyStepper value={qty} onInc={onInc} onDec={onDec} label={product.name} />
          {isVariable && (
            <p className="mt-1.5 text-center text-[11px] text-gray-600">
              {product.variantLabel ?? 'ভ্যারিয়েশন'} বাছাই করতে + চাপুন
            </p>
          )}
        </div>
      </div>
    </article>
  )
}
