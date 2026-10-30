import { useState } from 'react'
import { Minus, Plus, ShoppingBag } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import type { GroupOffer } from '@/lib/api/groupOffers'
import { bn, taka } from '@/lib/bn'

interface Props {
  offer: GroupOffer
  /** pieces picked per group product (not in the cart yet) */
  qty: Record<string, number>
  onStep: (id: string, delta: 1 | -1) => void
  /** Total of the picked pieces */
  subtotal: number
  /** Pieces needed in total before the pack can be ordered */
  minPieces: number
  /** OK: validates the minimum and moves the picked pieces into the cart. True when they were added. */
  onConfirm: () => boolean
  /** Cancel / close: drops whatever was picked */
  onReset: () => void
}

// Pack shot used until the group product has its own photo
const PACK_IMAGE = '/banners/trial-pack-packets.webp'

/** "Surokkha Trial Pack": one product. Add to cart opens a full-screen picker for its pieces; OK puts them in the cart. */
export function TrialPackSection({ offer, qty, onStep, subtotal, minPieces, onConfirm, onReset }: Props) {
  const [open, setOpen] = useState(false)
  // Set when OK is pressed before the minimum is reached
  const [warn, setWarn] = useState(false)
  const min = Math.max(1, offer.minPerProduct || 1)
  const picked = offer.products.reduce((s, p) => s + (qty[p.id] ?? 0), 0)
  const missing = Math.max(0, minPieces - picked)
  const fromPrice = Math.min(...offer.products.map((p) => p.unitPrice))

  const close = () => {
    onReset()
    setWarn(false)
    setOpen(false)
  }

  return (
    <section className="w-full border-y border-rose-100 bg-rose-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
        <div className="grid items-center gap-6 sm:gap-10 md:grid-cols-[1.5fr_1fr]">
          <div className="overflow-hidden rounded-2xl bg-white">
            <img src={offer.imageUrl || PACK_IMAGE} alt={offer.name} loading="lazy" className="aspect-square w-full object-cover md:aspect-[4/3]" />
          </div>

          <div>
            <span className="inline-block rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-rose-700">
              Trial pack
            </span>
            <h2 className="mt-3 text-2xl font-bold leading-snug text-black sm:text-4xl">{offer.name}</h2>
            <p className="mt-2 text-base text-gray-800 sm:text-lg">
              {offer.description || 'Give them a try before purchasing a full packet'}
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Pick any pieces you like: each one starts at {bn(min)} pieces, and the pack needs at least {bn(minPieces)} pieces
              in total.
            </p>
            <p className="mt-4 text-sm text-gray-700">
              From <b className="text-xl text-rose-600">{taka(fromPrice)}</b> / piece
            </p>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-8 text-base font-semibold text-primary-foreground transition hover:opacity-90 sm:w-auto"
            >
              <ShoppingBag className="size-5" />
              Add to cart
            </button>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
        <DialogContent
          // Only the cross and Cancel close it; a stray tap outside must not throw the picks away
          onInteractOutside={(e) => e.preventDefault()}
          className="[&_[data-slot=dialog-close]]:top-3 [&_[data-slot=dialog-close]]:right-3 [&_[data-slot=dialog-close]]:flex [&_[data-slot=dialog-close]]:size-9 [&_[data-slot=dialog-close]]:items-center [&_[data-slot=dialog-close]]:justify-center [&_[data-slot=dialog-close]]:rounded-full [&_[data-slot=dialog-close]]:!bg-red-600 [&_[data-slot=dialog-close]]:text-white [&_[data-slot=dialog-close]]:!opacity-100 [&_[data-slot=dialog-close]]:hover:!bg-red-700 [&_[data-slot=dialog-close]]:!ring-0 [&_[data-slot=dialog-close]]:!outline-none [&_[data-slot=dialog-close]_svg]:size-5 offer-font top-0 left-0 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 bg-white p-0 sm:max-w-none"
        >
          <div className="border-b border-gray-200 px-5 py-4 pr-16">
            <DialogTitle className="text-xl font-bold leading-snug sm:text-2xl">{offer.name}</DialogTitle>
            <DialogDescription className="mt-1 text-sm text-gray-600">
              Pick your pieces: {bn(min)} to start, at least {bn(minPieces)} pieces in total.
            </DialogDescription>
          </div>

          <div className="flex-1 overflow-y-auto bg-rose-50 px-4 py-5">
            <ul className="mx-auto grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              {offer.products.map((p) => {
                const n = qty[p.id] ?? 0
                return (
                  <li
                    key={p.id}
                    className={`flex flex-col rounded-2xl border bg-white p-2.5 sm:p-3 ${n > 0 ? 'border-rose-400 ring-2 ring-rose-200' : 'border-rose-100'}`}
                  >
                    <div className="aspect-square w-full overflow-hidden rounded-xl bg-rose-50">
                      {p.image && <img src={p.image} alt={p.name} loading="lazy" className="h-full w-full object-cover" />}
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm font-bold leading-snug text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-600">
                      {n > 0 ? (
                        <>
                          {bn(n)} × {taka(p.unitPrice)} = <b className="text-rose-600">{taka(n * p.unitPrice)}</b>
                        </>
                      ) : (
                        <>{taka(p.unitPrice)} / piece</>
                      )}
                    </p>
                    <div className="mt-auto pt-2">
                      {!p.inStock ? (
                        <p className="py-2 text-center text-xs font-semibold text-rose-600">Out of stock</p>
                      ) : n === 0 ? (
                        <button
                          type="button"
                          onClick={() => onStep(p.id, 1)}
                          className="flex h-9 w-full items-center justify-center gap-1 rounded-full bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                        >
                          Add <Plus className="size-4" />
                        </button>
                      ) : (
                        <div className="flex items-center justify-between rounded-full bg-primary p-0.5 text-primary-foreground">
                          <button
                            type="button"
                            onClick={() => onStep(p.id, -1)}
                            aria-label={`Decrease ${p.name}`}
                            className="flex size-8 items-center justify-center rounded-full hover:bg-white/15"
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <span className="min-w-4 text-center text-sm font-semibold tabular-nums">{bn(n)}</span>
                          <button
                            type="button"
                            onClick={() => onStep(p.id, 1)}
                            aria-label={`Increase ${p.name}`}
                            className="flex size-8 items-center justify-center rounded-full hover:bg-white/15"
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="border-t border-gray-200 bg-white px-4 py-3">
            <div className="mx-auto flex max-w-4xl flex-col gap-2">
              <p className="text-center text-sm text-gray-700">
                {picked > 0 ? (
                  <>
                    {bn(picked)} {picked === 1 ? 'piece' : 'pieces'} · <b className="text-lg text-rose-600">{taka(subtotal)}</b>
                  </>
                ) : (
                  <>Minimum {bn(minPieces)} pieces</>
                )}
              </p>
              {warn && missing > 0 && (
                <p role="alert" className="text-center text-sm font-semibold text-red-600">
                  Please select minimum {bn(minPieces)} pieces
                  {picked > 0 && <> (add {bn(missing)} more)</>}
                </p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={close}
                  className="h-12 flex-1 rounded-full bg-red-600 text-base font-semibold text-white transition hover:bg-red-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  aria-disabled={missing > 0}
                  onClick={() => {
                    // Below the minimum OK does nothing but say what is needed
                    if (missing > 0) return setWarn(true)
                    if (onConfirm()) {
                      setWarn(false)
                      setOpen(false)
                    }
                  }}
                  className={`h-12 flex-1 rounded-full bg-primary text-base font-semibold text-primary-foreground transition ${missing > 0 ? 'opacity-50' : 'hover:opacity-90'}`}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
