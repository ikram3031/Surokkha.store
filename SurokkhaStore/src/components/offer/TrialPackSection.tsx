import { Minus, Plus, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { GroupOffer } from '@/lib/api/groupOffers'
import { bn, taka } from '@/lib/bn'

interface Props {
  offer: GroupOffer
  /** pieces chosen per group product */
  qty: Record<string, number>
  onStep: (id: string, delta: 1 | -1) => void
  /** Chooses a starter set if nothing is picked yet, then jumps to the checkout form */
  onOrderNow: () => void
  /** Pieces total of this pack */
  subtotal: number
}

// Pack shot used until the group product has its own photo
const PACK_IMAGE = '/banners/trial-pack-packets.webp'

/** "Surokkha Trial Pack" group product: pick a few pieces of several products, then Order now goes straight to checkout. */
export function TrialPackSection({ offer, qty, onStep, onOrderNow, subtotal }: Props) {
  const min = Math.max(1, offer.minPerProduct || 1)
  const picked = offer.products.reduce((s, p) => s + (qty[p.id] ?? 0), 0)
  const missing = offer.minOrderAmount > 0 && picked > 0 ? Math.max(0, offer.minOrderAmount - subtotal) : 0

  return (
    <section className="w-full border-y border-rose-100 bg-rose-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
        <div className="grid items-center gap-6 sm:gap-10 md:grid-cols-[0.9fr_1.1fr]">
          <div className="overflow-hidden rounded-2xl bg-white">
            <img
              src={offer.imageUrl || PACK_IMAGE}
              alt={offer.name}
              loading="lazy"
              className="aspect-square w-full object-cover"
            />
          </div>

          <div>
            <span className="inline-block rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-rose-700">
              Trial pack
            </span>
            <h2 className="mt-3 text-2xl font-bold leading-snug text-black sm:text-3xl">{offer.name}</h2>
            {offer.description && <p className="mt-2 text-sm text-gray-700 sm:text-base">{offer.description}</p>}
            <p className="mt-2 text-xs text-gray-600 sm:text-sm">
              Pick any pieces you like. Choose at least {bn(min)} of each product you take.
              {offer.minOrderAmount > 0 && <> Trial Pack orders start at {taka(offer.minOrderAmount)}.</>}
            </p>

            <ul className="mt-4 divide-y divide-rose-100 rounded-2xl border border-rose-100 bg-white">
              {offer.products.map((p) => {
                const n = qty[p.id] ?? 0
                return (
                  <li key={p.id} className="flex items-center gap-3 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500">{taka(p.unitPrice)} / piece</p>
                    </div>
                    {p.inStock ? (
                      <div className="inline-flex shrink-0 items-center rounded-full border border-gray-200">
                        <button
                          type="button"
                          disabled={n === 0}
                          onClick={() => onStep(p.id, -1)}
                          aria-label={`Decrease ${p.name}`}
                          className="flex size-8 items-center justify-center rounded-full text-primary disabled:opacity-40"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-7 text-center text-sm font-semibold tabular-nums">{bn(n)}</span>
                        <button
                          type="button"
                          onClick={() => onStep(p.id, 1)}
                          aria-label={`Increase ${p.name}`}
                          className="flex size-8 items-center justify-center rounded-full text-primary"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-rose-600">Out of stock</span>
                    )}
                  </li>
                )
              })}
            </ul>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-gray-700">
                {picked > 0 ? (
                  <>
                    {bn(picked)} {picked === 1 ? 'piece' : 'pieces'} · <b className="text-lg text-rose-600">{taka(subtotal)}</b>
                  </>
                ) : (
                  <>Or take our starter set in one tap</>
                )}
              </p>
              <Button size="lg" className="h-12 flex-1 gap-2 rounded-full px-8 text-base sm:flex-none" onClick={onOrderNow}>
                <ShoppingBag className="size-5" />
                Order now
              </Button>
            </div>
            {missing > 0 && (
              <p className="mt-2 text-xs font-medium text-rose-600">
                Add {taka(missing)} more to complete the Trial Pack.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
