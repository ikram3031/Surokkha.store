import { useEffect, useMemo, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { getGroupOffer, groupOfferDiscount, type GroupOffer } from '@/lib/api/groupOffers'
import { resolveMediaUrl } from '@/lib/api/client'
import { useCart } from '@/context/CartContext'
import { navigate } from '@/lib/router'
import { trackProductView } from '@/lib/api/productEvents'
import { bn, taka } from '@/lib/bn'
import { L } from '@/lib/i18n'

// Same caps the backend enforces on new orders
const MAX_PER_PRODUCT = 10
const MAX_PER_ORDER = 20

const describe = (d: { discountType: string; discountValue: number }) =>
  d.discountType === 'percentage' ? `${bn(d.discountValue)}% ${L('off', 'ছাড়')}` : `${taka(d.discountValue)} ${L('off', 'ছাড়')}`

/** A Group Offer: pick pieces from several products; the whole group is priced by the offer's rules. */
export function GroupOfferPage({ slug, embedded = false }: { slug: string; embedded?: boolean }) {
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
          // Dashboard analytics: the whole combo counts as one view
          trackProductView(`combo:${res.data.slug}`, res.data.name)
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

  if (status === 'loading') return <p className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">{L('Loading...', 'লোড হচ্ছে...')}</p>
  if (status === 'missing' || !offer)
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-muted-foreground">{L('This offer is not available right now.', 'এই অফারটি এখন পাওয়া যাচ্ছে না।')}</p>
        <Button className="mt-4 rounded-full" onClick={() => navigate('/')}>{L('Back to home', 'হোমে ফিরে যান')}</Button>
      </div>
    )

  const min = offer.minPerProduct
  const { discount, eligible, next } = groupOfferDiscount(offer, subtotal)

  // First piece of a product jumps to the minimum; below the minimum it clears
  const step = (id: string, delta: 1 | -1) => {
    const cur = qty[id] ?? 0
    let n = cur
    if (delta === 1) {
      if (cur >= MAX_PER_PRODUCT) return toast.error(L(`You can add up to ${MAX_PER_PRODUCT} pieces of one product`, `একটি প্রোডাক্টের সর্বোচ্চ ${bn(MAX_PER_PRODUCT)} পিস যোগ করা যাবে`))
      n = cur === 0 ? min : cur + 1
      if (totalQty - cur + n > MAX_PER_ORDER) return toast.error(L(`You can order up to ${MAX_PER_ORDER} pieces in one order`, `এক অর্ডারে সর্বোচ্চ ${bn(MAX_PER_ORDER)} পিস অর্ডার করা যাবে`))
    } else n = cur <= min ? 0 : cur - 1
    setQty((q) => ({ ...q, [id]: n }))
  }

  const submit = (goCheckout: boolean) => {
    if (!eligible) return toast.error(L(`Pick at least ${taka(offer.minOrderAmount)} worth of pieces`, `কমপক্ষে ${taka(offer.minOrderAmount)} মূল্যের পিস বাছাই করুন`))
    addGroup(offer, offer.products.map((product) => ({ product, qty: qty[product.id] ?? 0 })))
    if (goCheckout) navigate('/checkout')
  }

  return (
    <div className={embedded ? 'py-4' : 'mx-auto max-w-5xl px-4 py-8 pb-40 md:py-12'}>
      <h1 className="font-display text-3xl font-bold md:text-4xl">{offer.name}</h1>
      {offer.description && <p className="mt-2 text-muted-foreground">{offer.description}</p>}
      <p className="mt-3 text-sm text-muted-foreground">
        {L(`Pick any pieces you like (minimum ${min} of each product you choose, then add one at a time). Order at least`, `পছন্দমতো পিস বাছাই করুন (প্রতিটি প্রোডাক্টের কমপক্ষে ${bn(min)}টি, তারপর একটি করে যোগ করুন)। অফার পেতে কমপক্ষে`)}{' '}
        <b className="text-foreground">{taka(offer.minOrderAmount)}</b> {L('to get the offer', 'মূল্যের অর্ডার করুন')}
        {offer.pricingMode === 'fixed' && offer.fixedDiscount ? `: ${describe(offer.fixedDiscount)}` : L('.', '।')}
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
                <p className="text-sm text-muted-foreground">{taka(p.unitPrice)} / {L('piece', 'পিস')}</p>
                {p.inStock ? (
                  <div className="mt-2 inline-flex items-center rounded-full border border-border">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" disabled={n === 0} onClick={() => step(p.id, -1)} aria-label={L('Decrease pieces', 'পিস কমান')}>
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="w-8 text-center text-sm font-semibold">{bn(n)}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => step(p.id, 1)} aria-label={L('Increase pieces', 'পিস বাড়ান')}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <p className="mt-2 text-sm font-semibold text-destructive">{L('Out of stock', 'স্টকে নেই')}</p>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      <div className={embedded ? 'mt-6 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm' : 'fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card px-4 py-3 shadow-lg'}>
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div className="text-sm">
            <p>
              {bn(totalQty)} {L('pieces', 'পিস')} · {taka(subtotal)}
              {discount > 0 && <span className="ml-2 font-semibold text-primary">−{taka(discount)} → {taka(subtotal - discount)}</span>}
            </p>
            <p className="text-xs text-muted-foreground">
              {subtotal === 0
                ? L(`Minimum ${taka(offer.minOrderAmount)} to get the offer`, `অফার পেতে সর্বনিম্ন ${taka(offer.minOrderAmount)}`)
                : !eligible
                  ? L(`Add ${taka(offer.minOrderAmount - subtotal)} more to get the offer`, `অফার পেতে আরও ${taka(offer.minOrderAmount - subtotal)} যোগ করুন`)
                  : next
                    ? L(`Add ${taka(next.minOrderAmount - subtotal)} more for ${describe(next)}`, `${describe(next)} পেতে আরও ${taka(next.minOrderAmount - subtotal)} যোগ করুন`)
                    : L('Offer applied', 'অফার প্রয়োগ হয়েছে')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-full" disabled={!eligible} onClick={() => submit(false)}>
              {L('Add to cart', 'কার্টে যোগ করুন')}
            </Button>
            <Button className="rounded-full" disabled={!eligible} onClick={() => submit(true)}>
              {L('Order now', 'অর্ডার করুন')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
