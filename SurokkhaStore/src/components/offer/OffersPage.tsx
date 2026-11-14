import { useEffect, useState } from 'react'
import { useProducts } from '@/hooks/useProducts'
import { ProductCard } from '@/components/shop/ProductCard'
import { listGroupOffers, type GroupOffer } from '@/lib/api/groupOffers'
import { groupOfferPath, navigate } from '@/lib/router'
import { resolveMediaUrl } from '@/lib/api/client'
import { L } from '@/lib/i18n'
import { bn, taka } from '@/lib/bn'

/** Short label for a Group Offer's best discount, e.g. "Up to 20% off" */
function groupOfferLabel(o: GroupOffer) {
  const all = o.pricingMode === 'fixed' ? (o.fixedDiscount ? [o.fixedDiscount] : []) : o.conditions
  if (all.length === 0) return ''
  const pct = all.filter((d) => d.discountType === 'percentage').map((d) => d.discountValue)
  const fixed = all.filter((d) => d.discountType === 'fixed').map((d) => d.discountValue)
  if (pct.length) return `${all.length > 1 ? L('Up to ', 'সর্বোচ্চ ') : ''}${bn(Math.max(...pct))}% ${L('off', 'ছাড়')}`
  return `${all.length > 1 ? L('Up to ', 'সর্বোচ্চ ') : ''}${taka(Math.max(...fixed))} ${L('off', 'ছাড়')}`
}

/** The Offers page: every dashboard Group Offer and every product in an active Direct Offer, nothing else. */
export function OffersPage() {
  const { products, loading } = useProducts()
  const [groups, setGroups] = useState<GroupOffer[]>([])
  const [groupsLoading, setGroupsLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    listGroupOffers({ signal: controller.signal })
      .then((res) => setGroups(res?.data ?? []))
      .catch(() => setGroups([]))
      .finally(() => !controller.signal.aborted && setGroupsLoading(false))
    return () => controller.abort()
  }, [])

  // Products first, then Items (useProducts already lists them in that order)
  const direct = products.filter((p) => p.directOffer && p.inStock !== false)
  const empty = !loading && !groupsLoading && groups.length === 0 && direct.length === 0

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold md:text-4xl">{L('Offers', 'অফার')}</h1>

      {groups.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-xl font-bold">{L('Group Offers', 'গ্রুপ অফার')}</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g) => {
              const image = resolveMediaUrl(g.imageUrl || g.products[0]?.image)
              const label = groupOfferLabel(g)
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => navigate(groupOfferPath(g.slug))}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left transition hover:border-primary"
                >
                  {image && <img src={image} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />}
                  <div className="min-w-0">
                    <p className="font-semibold leading-snug">{g.name}</p>
                    {label && (
                      <span className="mt-1 inline-block rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
                        {label}
                      </span>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">{bn(g.products.length)} {L('products', 'টি প্রোডাক্ট')}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {direct.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-bold">{L('Direct Offers', 'সরাসরি অফার')}</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {direct.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {(loading || groupsLoading) && groups.length === 0 && direct.length === 0 && (
        <p className="mt-10 text-center text-muted-foreground">{L('Loading offers…', 'অফার লোড হচ্ছে…')}</p>
      )}
      {empty && <p className="mt-10 text-center text-muted-foreground">{L('No offers running right now.', 'এই মুহূর্তে কোনো অফার চলছে না।')}</p>}
    </div>
  )
}
