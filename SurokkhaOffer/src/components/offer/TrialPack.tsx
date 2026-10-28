import { Minus, Plus } from 'lucide-react'
import { resolveMediaUrl } from '@/lib/api/client'
import { groupOfferDiscount, type GroupOffer } from '@/lib/api/groupOffers'
import { bn, taka } from '@/lib/bn'

interface Props {
  offer: GroupOffer
  qty: Record<string, number>
  onStep: (id: string, delta: 1 | -1) => void
  subtotal: number
}

/** Surokkha Trial Pack: a few pieces of several products, priced by the group offer's own rules */
export function TrialPack({ offer, qty, onStep, subtotal }: Props) {
  const { discount, eligible, next } = groupOfferDiscount(offer, subtotal)
  return (
    <div>
      <div className="mx-auto mb-6 max-w-2xl text-center">
        <h2 className="text-2xl font-bold text-black sm:text-3xl">{offer.name}</h2>
        <p className="mt-2 text-sm text-gray-600 sm:text-base">
          প্রতিটি পণ্য কমপক্ষে {bn(offer.minPerProduct)}টি করে বাছাই করুন, মোট {taka(offer.minOrderAmount)}-এর অর্ডারে অফার।
        </p>
        {offer.conditions.length > 0 && (
          <ul className="mt-3 flex flex-wrap justify-center gap-2 text-xs">
            {offer.conditions.map((c) => (
              <li
                key={c.minOrderAmount}
                className={`rounded-full px-3 py-1 ${subtotal >= c.minOrderAmount ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                {taka(c.minOrderAmount)}+ → {c.discountType === 'percentage' ? `${bn(c.discountValue)}% ছাড়` : `${taka(c.discountValue)} ছাড়`}
              </li>
            ))}
          </ul>
        )}
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {offer.products.map((p) => {
          const n = qty[p.id] ?? 0
          const image = resolveMediaUrl(p.image)
          return (
            <li key={p.id} className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3">
              {image ? (
                <img src={image} alt={p.name} className="size-20 shrink-0 rounded-xl object-cover" />
              ) : (
                <div className="size-20 shrink-0 rounded-xl bg-gray-100" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-snug">{p.name}</p>
                <p className="text-sm text-gray-600">{taka(p.unitPrice)} / পিস</p>
                {p.inStock ? (
                  <div className="mt-2 inline-flex items-center rounded-full border border-gray-200">
                    <button
                      type="button"
                      disabled={n === 0}
                      onClick={() => onStep(p.id, -1)}
                      aria-label={`${p.name} কমান`}
                      className="flex size-8 items-center justify-center rounded-full text-primary disabled:opacity-40"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold tabular-nums">{bn(n)}</span>
                    <button
                      type="button"
                      onClick={() => onStep(p.id, 1)}
                      aria-label={`${p.name} বাড়ান`}
                      className="flex size-8 items-center justify-center rounded-full text-primary"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <p className="mt-2 text-sm font-semibold text-rose-600">স্টকে নেই</p>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      {subtotal > 0 && (
        <p className="mt-4 text-center text-sm text-gray-600">
          {!eligible
            ? `আরও ${taka(offer.minOrderAmount - subtotal)} এর পণ্য নিলে অফার পাবেন`
            : next
              ? `আরও ${taka(next.minOrderAmount - subtotal)} নিলে পরের ছাড় পাবেন`
              : 'অফার প্রযোজ্য হয়েছে'}
          {discount > 0 && <b className="ml-1 text-emerald-600">(সাশ্রয় {taka(discount)})</b>}
        </p>
      )}
    </div>
  )
}
