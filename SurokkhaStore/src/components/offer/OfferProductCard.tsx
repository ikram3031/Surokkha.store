import { Eye, Minus, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { fromPrice, type OfferProduct } from '@/data/offerProducts'
import { bn, taka } from '@/lib/bn'
import { ProductSlider } from './ProductMedia'
import { L } from '@/lib/i18n'

interface Props {
  product: OfferProduct
  qty: number
  onInc: () => void
  onDec: () => void
  onChooseOptions: () => void
  onQuickView: () => void
  /** Click on the photo: adds the product, or opens its view when it needs options / is out of stock */
  onMediaClick: () => void
}

export function OfferProductCard({ product, qty, onInc, onDec, onChooseOptions, onQuickView, onMediaClick }: Props) {
  const isVariable = !!product.variants?.length

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-3xl border-2 bg-white transition ${
        qty ? 'border-primary shadow-lg' : 'border-gray-200'
      }`}
    >
      <div
        className="group/media relative cursor-pointer"
        onClick={(e) => {
          // Slider arrows, dots and the Details buttons keep their own behaviour
          if ((e.target as HTMLElement).closest('button')) return
          onMediaClick()
        }}
      >
        <ProductSlider product={product} compact />
        {/* Hover overlay with a view icon; only the icon takes clicks so the slider arrows keep working */}
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/35 opacity-0 transition-opacity duration-200 group-hover/media:opacity-100">
          <button
            type="button"
            onClick={onQuickView}
            aria-label={`${product.name} বিস্তারিত দেখুন`}
            className="pointer-events-auto flex size-12 items-center justify-center rounded-full bg-white text-gray-900 shadow-lg transition hover:scale-110"
          >
            <Eye className="size-6" />
          </button>
        </div>
        <button
          type="button"
          onClick={onQuickView}
          aria-label={`${product.name} ${L('view details', 'বিস্তারিত দেখুন')}`}
          className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow transition hover:bg-emerald-700"
        >
          <Eye className="size-3.5" /> {L('Details', 'বিস্তারিত')}
        </button>
        {!product.inStock && (
          <span className="absolute inset-x-0 bottom-0 bg-gray-900/70 py-1 text-center text-xs font-semibold text-white">
            {L('Out of stock', 'স্টকে নেই')}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3 sm:p-4">
        {(product.badge || product.freeDelivery) && (
          <div className="mb-0.5 flex flex-wrap gap-1">
            {product.badge && (
              <Badge className="w-fit bg-rose-100 text-[11px] text-rose-700 hover:bg-rose-100">{product.badge}</Badge>
            )}
            {product.freeDelivery && (
              <Badge className="w-fit bg-emerald-100 text-[11px] text-emerald-700 hover:bg-emerald-100">{L('Free Delivery', 'ফ্রি ডেলিভারি')}</Badge>
            )}
          </div>
        )}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug sm:text-base">{product.name}</h3>
        {product.desc && <p className="line-clamp-1 text-xs text-gray-600 sm:text-sm">{product.desc}</p>}
        <div className="mt-auto flex flex-col gap-2 pt-1 sm:flex-row sm:items-end sm:justify-between">
          <p className="leading-tight">
            <span className="text-base font-bold text-rose-600 sm:text-lg">{taka(fromPrice(product))}</span>
            {isVariable && <span className="ml-1 text-[11px] font-normal text-gray-600">{L('from', 'থেকে')}</span>}
            {product.regularPrice && product.regularPrice > product.price && (
              <s className="ml-1 text-xs font-normal text-gray-400">{taka(product.regularPrice)}</s>
            )}
          </p>
          {qty > 0 && !isVariable ? (
            // Already in the order: a compact stepper in the same spot as "Add"
            <div className="flex h-9 w-full shrink-0 items-center justify-between gap-1 rounded-full bg-primary p-0.5 text-primary-foreground sm:h-8 sm:w-auto">
              <button type="button" onClick={onDec} aria-label={`${product.name} ${L('decrease quantity', 'পরিমাণ কমান')}`}
                className="flex size-8 items-center justify-center rounded-full hover:bg-white/15 sm:size-7">
                <Minus className="size-3.5" />
              </button>
              <span className="min-w-4 text-center text-sm font-semibold tabular-nums">{bn(qty)}</span>
              <button type="button" onClick={onInc} aria-label={`${product.name} ${L('increase quantity', 'পরিমাণ বাড়ান')}`}
                className="flex size-8 items-center justify-center rounded-full hover:bg-white/15 sm:size-7">
                <Plus className="size-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={isVariable ? onChooseOptions : onInc}
              disabled={!product.inStock}
              aria-label={`${product.name} ${L('increase quantity', 'পরিমাণ বাড়ান')}`}
              className="flex h-9 w-full shrink-0 items-center justify-center gap-1 rounded-full bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-40 sm:h-8 sm:w-auto"
            >
              {isVariable && qty > 0 ? bn(qty) : L('Add', 'যোগ করুন')} <Plus className="size-4" />
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
