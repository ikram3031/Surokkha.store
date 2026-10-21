import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { fromPrice, variantPrice, type OfferProduct } from '@/data/offerProducts'
import { taka } from '@/lib/bn'
import { ProductSlider } from './ProductMedia'
import { QtyStepper } from './QtyStepper'

interface CommonProps {
  product: OfferProduct | null
  onOpenChange: (open: boolean) => void
  qtyOf: (productId: string, variantId?: string) => number
  change: (productId: string, variantId: string | undefined, delta: number) => void
}

/** One stepper per variant of a variable product */
function VariantRows({ product, qtyOf, change }: Omit<CommonProps, 'onOpenChange'> & { product: OfferProduct }) {
  return (
    <div className="space-y-2">
      {product.variants!.map((v) => {
        const q = qtyOf(product.id, v.id)
        return (
          <div
            key={v.id}
            className={`flex items-center justify-between gap-3 rounded-2xl border-2 p-2.5 pl-4 transition ${
              q ? 'border-primary bg-rose-50' : 'border-gray-200'
            }`}
          >
            <div>
              <p className="text-base font-semibold leading-normal">{v.label}</p>
              <p className="text-sm font-semibold text-rose-600">{taka(variantPrice(product, v))}</p>
            </div>
            <div className="w-32">
              <QtyStepper
                value={q}
                onInc={() => change(product.id, v.id, 1)}
                onDec={() => change(product.id, v.id, -1)}
                label={`${product.name} ${v.label}`}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Opens from "+" on a variable product */
export function VariantDialog({ product, onOpenChange, qtyOf, change }: CommonProps) {
  return (
    <Dialog open={!!product} onOpenChange={onOpenChange}>
      {product && (
        <DialogContent className="[&_[data-slot=dialog-close]]:text-rose-600 [&_[data-slot=dialog-close]]:opacity-100 [&_[data-slot=dialog-close]_svg]:size-5 offer-font max-h-[90dvh] overflow-y-auto rounded-3xl bg-white p-5 sm:max-w-md">
          <DialogTitle className="text-xl leading-snug">{product.name}</DialogTitle>
          <DialogDescription>
            আপনার পছন্দের {product.variantLabel ?? 'ভ্যারিয়েশন'} ও পরিমাণ বাছাই করুন
          </DialogDescription>
          <VariantRows product={product} qtyOf={qtyOf} change={change} />
          <Button className="h-11 rounded-full" onClick={() => onOpenChange(false)}>
            <Check /> ঠিক আছে
          </Button>
        </DialogContent>
      )}
    </Dialog>
  )
}

/** Product details with an image slider; lets the customer add from here too */
export function QuickViewDialog({ product, onOpenChange, qtyOf, change }: CommonProps) {
  return (
    <Dialog open={!!product} onOpenChange={onOpenChange}>
      {product && (
        <DialogContent className="[&_[data-slot=dialog-close]]:text-rose-600 [&_[data-slot=dialog-close]]:opacity-100 [&_[data-slot=dialog-close]_svg]:size-5 offer-font max-h-[92dvh] overflow-y-auto rounded-3xl bg-white p-4 sm:max-w-3xl sm:p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <ProductSlider product={product} />
            <div className="flex flex-col gap-3">
              <div>
                <DialogTitle className="text-2xl leading-snug">{product.name}</DialogTitle>
                <DialogDescription className="mt-1">{product.desc}</DialogDescription>
              </div>
              <p className="text-2xl font-bold text-rose-600">
                {taka(fromPrice(product))}
                {product.unitLabel || product.variants?.length ? (
                  <span className="ml-1 text-sm font-normal text-gray-600">{product.unitLabel ?? 'থেকে'}</span>
                ) : null}
              </p>
              <ul className="space-y-1.5 text-sm">
                {product.details.map((d) => (
                  <li key={d} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {d}
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-2">
                {product.variants?.length ? (
                  <VariantRows product={product} qtyOf={qtyOf} change={change} />
                ) : (
                  <QtyStepper
                    value={qtyOf(product.id)}
                    onInc={() => change(product.id, undefined, 1)}
                    onDec={() => change(product.id, undefined, -1)}
                    label={product.name}
                  />
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      )}
    </Dialog>
  )
}
