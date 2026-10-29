import { useState } from 'react'
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { bn, taka } from '@/lib/bn'

export interface CartLine {
  key: string
  name: string
  /** variant label or pack name, shown under the name */
  sub?: string
  image?: string
  qty: number
  /** line total */
  amount: number
  onDec: () => void
  onInc: () => void
  onRemove: () => void
}

interface Props {
  lines: CartLine[]
  count: number
  subtotal: number
  discount: number
  /** current tier percentage, if any */
  discountPercent?: number
  shipping: number
  /** false until the customer has chosen where it is delivered */
  addressKnown: boolean
  total: number
  onCheckout: () => void
}

/** Floating cart button on the left edge; opens a panel with the whole order, editable. */
export function OfferCart({ lines, count, subtotal, discount, discountPercent, shipping, addressKnown, total, onCheckout }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Open cart${count ? `, ${count} items` : ''}`}
        className="offer-font fixed bottom-32 left-3 z-40 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:scale-105 active:scale-95 sm:left-5"
      >
        <ShoppingBag className="size-6" />
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-bold leading-none text-white ring-2 ring-white">
          {bn(count)}
        </span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="offer-font flex w-full max-w-sm flex-col gap-0 bg-white p-0">
          <SheetHeader className="border-b border-gray-200 px-5 py-4">
            <SheetTitle className="text-lg font-bold">Your order</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5">
            {lines.length === 0 ? (
              <div className="py-16 text-center text-gray-500">
                <ShoppingBag className="mx-auto size-10 text-gray-300" />
                <p className="mt-3">Your cart is empty.</p>
                <Button className="mt-4 rounded-full" onClick={() => setOpen(false)}>
                  Browse products
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {lines.map((l) => (
                  <li key={l.key} className="flex items-center gap-3 py-3">
                    <div className="size-14 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                      {l.image && <img src={l.image} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{l.name}</p>
                      {l.sub && <p className="truncate text-xs text-gray-400">{l.sub}</p>}
                      <div className="mt-1.5 inline-flex items-center rounded-full border border-gray-200">
                        <button
                          type="button"
                          onClick={l.onDec}
                          aria-label={`Decrease ${l.name} quantity`}
                          className="flex size-7 items-center justify-center rounded-full text-gray-700 hover:bg-gray-100"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="min-w-6 text-center text-sm font-semibold tabular-nums">{bn(l.qty)}</span>
                        <button
                          type="button"
                          onClick={l.onInc}
                          aria-label={`Increase ${l.name} quantity`}
                          className="flex size-7 items-center justify-center rounded-full text-gray-700 hover:bg-gray-100"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <p className="text-sm font-medium text-gray-900">{taka(l.amount)}</p>
                      <button
                        type="button"
                        onClick={l.onRemove}
                        aria-label={`Remove ${l.name}`}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-rose-600"
                      >
                        <Trash2 className="size-3.5" /> Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {lines.length > 0 && (
            <div className="border-t border-gray-200 bg-gray-50 px-5 py-4">
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Subtotal</dt>
                  <dd>{taka(subtotal)}</dd>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Combo discount{discountPercent ? ` (${bn(discountPercent)}%)` : ''}</dt>
                    <dd className="text-emerald-600">−{taka(discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-gray-500">Delivery</dt>
                  <dd className={addressKnown ? '' : 'text-gray-500'}>
                    {addressKnown ? taka(shipping) : 'Added after you choose your area'}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-semibold">
                  <dt>{addressKnown ? 'Grand total' : 'Total so far'}</dt>
                  <dd className="text-[#b80f31]">{taka(total)}</dd>
                </div>
              </dl>
              <Button
                className="mt-4 h-11 w-full rounded-full text-base"
                onClick={() => {
                  setOpen(false)
                  // let the sheet finish closing (it locks page scroll) before jumping to the form
                  setTimeout(onCheckout, 250)
                }}
              >
                Checkout
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
