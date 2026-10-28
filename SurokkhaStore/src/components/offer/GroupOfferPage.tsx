import { useEffect, useMemo, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { getGroupOffer, groupOfferDiscount, type GroupOffer } from '@/lib/api/groupOffers'
import { resolveMediaUrl } from '@/lib/api/client'
import { useCart } from '@/context/CartContext'
import { navigate } from '@/lib/router'
import { taka } from '@/lib/bn'

// Same caps the backend enforces on new orders
const MAX_PER_PRODUCT = 10
const MAX_PER_ORDER = 20

const describe = (d: { discountType: string; discountValue: number }) =>
  d.discountType === 'percentage' ? `${d.discountValue}% off` : `${taka(d.discountValue)} off`

/** A Group Offer: pick pieces from several products; the whole group is priced by the offer's rules. */
export function GroupOfferPage({ slug }: { slug: string }) {
  const { addGroup } = useCart()
  const [offer, setOffer] = useState<GroupOffer | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing'>('loading')
  const [qty, setQty] = useState<Record<string, number>>({})

  useEffect(() => {
    const controller = new AbortController()
    setStatus('loading')
    getGroupOffer(slug, { signal: controller.signal })
      .then((res) => {
        if (res.data) {
          setOffer(res.data)
          setStatus('ready')
        } else setStatus('missing')
      })
      .catch(() => !controller.signal.aborted && setStatus('missing'))
    return () => controller.abort()
  }, [slug])

  const totalQty = Object.values(qty).reduce((s, n) => s + n, 0)
  const subtotal = useMemo(
    () => (offer?.products ?? []).reduce((s, p) => s + p.unitPrice * (qty[p.id] ?? 0), 0),
    [offer, qty],
  )

  if (status === 'loading') return <p className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">Loading...</p>
  if (status === 'missing' || !offer)
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-muted-foreground">This offer is not available right now.</p>
        <Button className="mt-4 rounded-full" onClick={() => navigate('/')}>Back to home</Button>
      </div>
    )

  const min = offer.minPerProduct
  const { discount, eligible, next } = groupOfferDiscount(offer, subtotal)

  // First piece of a product jumps to the minimum; below the minimum it clears
  const step = (id: string, delta: 1 | -1) => {
    const cur = qty[id] ?? 0
    let n = cur
    if (delta === 1) {
      if (cur >= MAX_PER_PRODUCT) return toast.error(`You can add up to ${MAX_PER_PRODUCT} pieces of one product`)
      n = cur === 0 ? min : cur + 1
      if (totalQty - cur + n > MAX_PER_ORDER) return toast.error(`You can order up to ${MAX_PER_ORDER} pieces in one order`)
    } else n = cur <= min ? 0 : cur - 1
    setQty((q) => ({ ...q, [id]: n }))
  }

  const submit = (goCheckout: boolean) => {
    if (!eligible) return toast.error(`Pick at least ${taka(offer.minOrderAmount)} worth of pieces`)
    addGroup(offer, offer.products.map((product) => ({ product, qty: qty[product.id] ?? 0 })))
    if (goCheckout) navigate('/checkout')
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-40 md:py-12">
      <h1 className="font-display text-3xl font-bold md:text-4xl">{offer.name}</h1>
      {offer.description && <p className="mt-2 text-muted-foreground">{offer.description}</p>}
      <p className="mt-3 text-sm text-muted-foreground">
        Pick any pieces you like (minimum {min} of each product you choose, then add one at a time). Order at least{' '}
        <b className="text-foreground">{taka(offer.minOrderAmount)}</b> to get the offer
        {offer.pricingMode === 'fixed' && offer.fixedDiscount ? `: ${describe(offer.fixedDiscount)}` : '.'}
      </p>
      {offer.pricingMode === 'conditional' && (
        <ul className="mt-2 flex flex-wrap gap-2 text-xs">
          {offer.conditions.map((c) => (
            <li key={c.minOrderAmount} className={`rounded-full px-3 py-1 ${subtotal >= c.minOrderAmount ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
              {taka(c.minOrderAmount)}+ → {describe(c)}
            </li>
          ))}
        </ul>
      )}

      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {offer.products.map((p) => {
          const n = qty[p.id] ?? 0
          const image = resolveMediaUrl(p.image)
          return (
            <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-card p-3">
              {image ? <img src={image} alt={p.name} className="h-20 w-20 shrink-0 rounded-xl object-cover" /> : <div className="h-20 w-20 shrink-0 rounded-xl bg-secondary" />}
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-snug">{p.name}</p>
                <p className="text-sm text-muted-foreground">{taka(p.unitPrice)} / piece</p>
                {p.inStock ? (
                  <div className="mt-2 inline-flex items-center rounded-full border border-border">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" disabled={n === 0} onClick={() => step(p.id, -1)} aria-label="Decrease pieces">
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="w-8 text-center text-sm font-semibold">{n}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => step(p.id, 1)} aria-label="Increase pieces">
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <p className="mt-2 text-sm font-semibold text-destructive">Out of stock</p>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card px-4 py-3 shadow-lg">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div className="text-sm">
            <p>
              {totalQty} pieces · {taka(subtotal)}
              {discount > 0 && <span className="ml-2 font-semibold text-primary">−{taka(discount)} → {taka(subtotal - discount)}</span>}
            </p>
            <p className="text-xs text-muted-foreground">
              {subtotal === 0
                ? `Minimum ${taka(offer.minOrderAmount)} to get the offer`
                : !eligible
                  ? `Add ${taka(offer.minOrderAmount - subtotal)} more to get the offer`
                  : next
                    ? `Add ${taka(next.minOrderAmount - subtotal)} more for ${describe(next)}`
                    : 'Offer applied'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-full" disabled={!eligible} onClick={() => submit(false)}>
              Add to cart
            </Button>
            <Button className="rounded-full" disabled={!eligible} onClick={() => submit(true)}>
              Order now
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
