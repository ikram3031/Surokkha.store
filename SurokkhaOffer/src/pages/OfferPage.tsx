import { useMemo, useRef, useState, type FormEvent } from 'react'
import { ArrowRight, CheckCircle2, Loader2, Lock, Mail, Phone, Truck, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AgeGate } from '@/components/AgeGate'
import { OfferProductCard } from '@/components/offer/OfferProductCard'
import { QuickViewDialog, VariantDialog } from '@/components/offer/ProductDialogs'
import {
  CUSTOM_COMBO_PRODUCTS,
  DISCOUNT_TIERS,
  nextTier,
  tierFor,
  MAX_ORDER_AMOUNT,
  MAX_QTY_PER_LINE,
  MAX_QTY_PER_ORDER,
  SHIP_FEE,
  variantPrice,
  type OfferProduct,
  type OfferVariant,
} from '@/data/offerProducts'

import { api, ApiError } from '@/lib/api/client'
import { bn, taka } from '@/lib/bn'

const DISTRICTS = [
  'Dhaka', 'Gazipur', 'Narayanganj', 'Narsingdi', 'Munshiganj', 'Manikganj', 'Tangail', 'Kishoreganj', 'Faridpur',
  'Gopalganj', 'Madaripur', 'Rajbari', 'Shariatpur', 'Chattogram', "Cox's Bazar", 'Cumilla', 'Feni', 'Noakhali',
  'Lakshmipur', 'Chandpur', 'Brahmanbaria', 'Khagrachhari', 'Rangamati', 'Bandarban', 'Sylhet', 'Moulvibazar',
  'Habiganj', 'Sunamganj', 'Rajshahi', 'Bogura', 'Pabna', 'Sirajganj', 'Natore', 'Naogaon', 'Chapai Nawabganj',
  'Joypurhat', 'Khulna', 'Jashore', 'Satkhira', 'Bagerhat', 'Kushtia', 'Jhenaidah', 'Magura', 'Narail', 'Chuadanga',
  'Meherpur', 'Barishal', 'Patuakhali', 'Bhola', 'Pirojpur', 'Barguna', 'Jhalokati', 'Rangpur', 'Dinajpur',
  'Kurigram', 'Gaibandha', 'Nilphamari', 'Lalmonirhat', 'Thakurgaon', 'Panchagarh', 'Mymensingh', 'Jamalpur',
  'Sherpur', 'Netrokona',
]

// Selection key: product id, plus variant id on variable products
const keyOf = (productId: string, variantId?: string) => (variantId ? `${productId}:${variantId}` : productId)

// Same support contacts as SurokkhaShop
const SUPPORT_PHONE = '01600905774'
const SUPPORT_EMAIL = 'support@surokkha.shop'
const WHATSAPP_URL = 'https://wa.me/8801600905774'

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.66.15-.2.3-.76.96-.93 1.16-.17.2-.34.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.34.45-.51.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.66-1.6-.91-2.19-.24-.58-.48-.5-.66-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.09 3.2 5.07 4.48.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88a9.83 9.83 0 0 1 6.99 2.9 9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.89 9.88zm8.41-18.3A11.81 11.81 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.9 0-3.18-1.24-6.17-3.48-8.4z" />
    </svg>
  )
}

// Meta Pixel (loaded in index.html); no-op if blocked by the browser
type Fbq = (cmd: 'track', event: string, params?: Record<string, unknown>, opts?: { eventID?: string }) => void
const track = (event: string, params?: Record<string, unknown>, eventID?: string) => {
  try {
    const fbq = (window as unknown as { fbq?: Fbq }).fbq
    fbq?.('track', event, params, eventID ? { eventID } : undefined)
  } catch {
    /* ignore pixel errors */
  }
}

// Pixel browser ids, passed to the backend so its Conversions API event matches this visitor
const cookie = (name: string) => document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))?.[1] ?? ''

const toIntlPhone = (p: string) => (p.startsWith('0') ? `+88${p}` : p)

export default function OfferPage() {
  const products = CUSTOM_COMBO_PRODUCTS
  const [qty, setQty] = useState<Record<string, number>>({})
  const [variantFor, setVariantFor] = useState<OfferProduct | null>(null)
  const [quickView, setQuickView] = useState<OfferProduct | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', district: '', address: '', note: '' })
  const [submitting, setSubmitting] = useState(false)
  const [placed, setPlaced] = useState<string | null>(null)
  const checkoutRef = useRef<HTMLElement>(null)

  const qtyOf = (productId: string, variantId?: string) => qty[keyOf(productId, variantId)] ?? 0
  const productQty = (p: OfferProduct) =>
    p.variants?.length ? p.variants.reduce((s, v) => s + qtyOf(p.id, v.id), 0) : qtyOf(p.id)

  const lines = useMemo(
    () =>
      products.flatMap((p): { product: OfferProduct; variant?: OfferVariant; qty: number }[] =>
        p.variants?.length
          ? p.variants.map((v) => ({ product: p, variant: v, qty: qty[keyOf(p.id, v.id)] ?? 0 }))
          : [{ product: p, variant: undefined, qty: qty[p.id] ?? 0 }],
      )
        .filter((l) => l.qty > 0)
        .map((l) => ({ ...l, unitPrice: variantPrice(l.product, l.variant) })),
    [products, qty],
  )

  const count = lines.reduce((s, l) => s + l.qty, 0)
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0)
  const tier = tierFor(subtotal)
  const next = nextTier(subtotal)
  const discount = tier ? Math.round((subtotal * tier.off) / 100) : 0
  const shipping = count === 0 ? 0 : SHIP_FEE
  const total = subtotal - discount + shipping
  const topTier = DISCOUNT_TIERS[DISCOUNT_TIERS.length - 1]

  const change = (productId: string, variantId: string | undefined, delta: number) => {
    const k = keyOf(productId, variantId)
    const cur = qty[k] ?? 0
    if (delta > 0) {
      const p = products.find((x) => x.id === productId)!
      const v = p.variants?.find((x) => x.id === variantId)
      if (!(v ? v.inStock : p.inStock)) return toast.error('দুঃখিত, এটি এখন স্টকে নেই')
      const price = variantPrice(p, v)
      if (cur >= MAX_QTY_PER_LINE) return toast.error(`একটি পণ্য সর্বোচ্চ ${bn(MAX_QTY_PER_LINE)}টি নেওয়া যাবে`)
      if (count >= MAX_QTY_PER_ORDER) return toast.error(`এক অর্ডারে সর্বোচ্চ ${bn(MAX_QTY_PER_ORDER)}টি পণ্য নেওয়া যাবে`)
      if (subtotal + price > MAX_ORDER_AMOUNT)
        return toast.error(`${taka(MAX_ORDER_AMOUNT)}-এর বেশি অর্ডারের জন্য আমাদের সাথে যোগাযোগ করুন`)
    }
    if (delta > 0) {
      const p = products.find((x) => x.id === productId)!
      const v = p.variants?.find((x) => x.id === variantId)
      track('AddToCart', {
        content_ids: [v?.sku || p.sku || p.id],
        content_name: v ? `${p.name} (${v.label})` : p.name,
        content_type: 'product',
        value: variantPrice(p, v),
        currency: 'BDT',
      })
    }
    setQty((q) => ({ ...q, [k]: Math.max(0, cur + delta) }))
  }


  const goCheckout = () => {
    if (!count) return toast.error('আগে অন্তত একটি পণ্য বাছাই করুন')
    track('InitiateCheckout', { value: subtotal - discount, currency: 'BDT', num_items: count })
    checkoutRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!count) return toast.error('আগে অন্তত একটি পণ্য বাছাই করুন')
    if (!/^01[3-9]\d{8}$/.test(form.phone)) return toast.error('সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)')
    if (!DISTRICTS.includes(form.district)) return toast.error('তালিকা থেকে জেলা বাছাই করুন')

    const info = {
      fullName: form.name.trim(),
      phone: toIntlPhone(form.phone),
      email: '',
      address: form.address.trim(),
      thana: '',
      district: form.district,
      zip: '',
    }
    setSubmitting(true)
    try {
      const res = await api.post<{ data?: { orderNumber?: string } }>('/orders/new-order', {
        orderType: 'custom',
        orderPrefix: 'SC',
        clientDomain: 'offer.surokkha.shop',
        paymentMethod: 'Cash on Delivery',
        fbp: cookie('_fbp'),
        fbc: cookie('_fbc'),
        billingInfo: info,
        shippingInfo: info,
        shipToDifferentAddress: false,
        orderNotes: form.note.trim(),
        // Real store products, so the backend checks stock and the dashboard links each line
        items: lines.map((l) => ({
          name: l.variant ? `${l.product.name} (${l.variant.label})` : l.product.name,
          quantity: l.qty,
          unitPrice: l.unitPrice,
          size: l.variant?.label ?? '',
          productId: l.product.entity === 'product' ? l.product.apiId : '',
          itemId: l.product.entity === 'item' ? l.product.apiId : '',
          productDid: l.product.did,
          itemType: l.product.entity,
          sku: l.variant?.sku || l.product.sku,
          image: l.product.images[0] ?? '',
        })),
        subtotal,
        discountTotalAmount: discount,
        shippingFee: shipping,
        shippingTotalAmount: shipping,
        tax: 0,
        total,
      })
      const orderNumber = res?.data?.orderNumber ?? ''
      track(
        'Purchase',
        {
          content_ids: lines.map((l) => l.variant?.sku || l.product.sku || l.product.id),
          contents: lines.map((l) => ({ id: l.variant?.sku || l.product.sku || l.product.id, quantity: l.qty, item_price: l.unitPrice })),
          content_type: 'product',
          num_items: count,
          value: total,
          currency: 'BDT',
        },
        orderNumber || undefined,
      )
      setPlaced(orderNumber)
      setQty({})
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'অর্ডার করা যায়নি, আবার চেষ্টা করুন')
    } finally {
      setSubmitting(false)
    }
  }

  if (placed !== null) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-white px-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-lg">
          <CheckCircle2 className="mx-auto size-14 text-primary" />
          <h1 className="mt-4 text-2xl font-bold">অর্ডার সম্পন্ন হয়েছে!</h1>
          {placed && <p className="mt-2 text-gray-600">অর্ডার নম্বর: <b className="text-foreground">{placed}</b></p>}
          <p className="mt-2 text-sm text-gray-600">শীঘ্রই আমাদের প্রতিনিধি আপনাকে কল করে অর্ডার নিশ্চিত করবেন।</p>
          <Button className="mt-6 rounded-full" onClick={() => setPlaced(null)}>আবার অর্ডার করুন</Button>
        </div>
        <Toaster />
      </main>
    )
  }

  return (
    <>
      <AgeGate />
      <header className="offer-font bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <img src="/logo_2.png" alt="Surokkha" className="h-9 w-auto" />
          <div className="flex items-center gap-3 text-xs sm:text-sm">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp-এ যোগাযোগ করুন"
              className="flex items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-1.5 font-semibold text-white shadow transition hover:bg-[#1ebe5a]"
            >
              <WhatsAppIcon className="size-4" /> WhatsApp
            </a>
          </div>
        </div>
      </header>

      <main className="min-h-dvh bg-white pb-40 leading-relaxed antialiased offer-font">
        <section className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
          <div className="mx-auto mb-6 max-w-2xl text-center sm:mb-8">
            <h1 className="text-2xl font-bold leading-snug sm:text-3xl">
              <span className="text-black">আপনার পছন্দের </span>
              <span className="offer-combo">কম্বো</span>
              <span className="text-black"> নিজেই বানিয়ে নিন</span>
            </h1>
            <p className="mt-2 text-sm text-gray-600 sm:text-base">
              {taka(DISCOUNT_TIERS[0].min)}-এর অর্ডার থেকেই ছাড় শুরু — যত বেশি নেবেন, ছাড় তত বাড়বে, সর্বোচ্চ{' '}
              <b className="text-emerald-600">{bn(topTier.off)}%</b> পর্যন্ত!
            </p>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {DISCOUNT_TIERS.map((t) => {
                const on = tier && t.min <= tier.min
                return (
                  <div key={t.min}
                    className={`rounded-xl border-2 px-1 py-2 transition ${on ? 'border-emerald-500 bg-emerald-50' : 'border-dashed border-gray-200'}`}>
                    <p className={`text-base font-bold sm:text-lg ${on ? 'text-emerald-600' : 'text-rose-600'}`}>{bn(t.off)}% ছাড়</p>
                    <p className="text-[11px] text-gray-600 sm:text-xs">{taka(t.min)}+ অর্ডারে</p>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3">
            {products.map((p) => (
              <OfferProductCard
                key={p.id}
                product={p}
                qty={productQty(p)}
                onInc={() => change(p.id, undefined, 1)}
                onDec={() => change(p.id, undefined, -1)}
                onChooseOptions={() => setVariantFor(p)}
                onQuickView={() => setQuickView(p)}
              />
            ))}
          </div>
        </section>

        <section className="bg-rose-50">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-3 px-4 py-8 sm:grid-cols-3">
            {[
              { icon: Lock, t: 'গোপনীয় প্যাকেজিং', d: 'বাইরে থেকে কেউ বুঝবে না ভেতরে কী আছে' },
              { icon: Truck, t: 'সারাদেশে ডেলিভারি', d: `ডেলিভারি চার্জ ${taka(SHIP_FEE)}` },
              { icon: Wallet, t: 'ক্যাশ অন ডেলিভারি', d: 'পণ্য হাতে পেয়ে টাকা পরিশোধ করুন' },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t} className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4">
                <Icon className="size-6 shrink-0 text-primary" />
                <div>
                  <p className="font-semibold">{t}</p>
                  <p className="text-sm text-gray-600">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Checkout: always the last block on the page */}
        <section ref={checkoutRef} id="checkout" className="mx-auto max-w-xl scroll-mt-4 px-4 py-10">
          <form onSubmit={submit} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-xl font-bold text-primary">অর্ডার কনফার্ম করুন</h2>

            <div className="mt-4 divide-y divide-dashed divide-gray-200 text-sm">
              {lines.length ? (
                lines.map((l) => (
                  <div key={keyOf(l.product.id, l.variant?.id)} className="flex justify-between gap-3 py-2">
                    <span>
                      {l.product.name}
                      {l.variant && <span className="text-gray-600"> · {l.variant.label}</span>} × {bn(l.qty)}
                    </span>
                    <span className="font-medium">{taka(l.unitPrice * l.qty)}</span>
                  </div>
                ))
              ) : (
                <p className="py-2 text-gray-600">এখনো কোনো পণ্য বাছাই করা হয়নি।</p>
              )}
              <div className="flex justify-between py-2"><span>সাবটোটাল</span><span>{taka(subtotal)}</span></div>
              {tier && (
                <div className="flex justify-between py-2 font-semibold text-emerald-600">
                  <span>কম্বো ছাড় ({bn(tier.off)}%)</span><span>−{taka(discount)}</span>
                </div>
              )}
              <div className="flex justify-between py-2"><span>ডেলিভারি চার্জ</span><span>{taka(shipping)}</span></div>
              <div className="flex justify-between py-2 text-base font-bold text-rose-600">
                <span>সর্বমোট</span><span>{taka(total)}</span>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <Input required placeholder="আপনার নাম *" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11 rounded-xl border-gray-200 bg-white" />
              <Input required type="tel" inputMode="numeric" maxLength={11} placeholder="মোবাইল নম্বর (01XXXXXXXXX) *"
                value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
                className="h-11 rounded-xl border-gray-200 bg-white" />
              <Input required list="offer-districts" placeholder="জেলা *" value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value })} className="h-11 rounded-xl border-gray-200 bg-white" />
              <datalist id="offer-districts">{DISTRICTS.map((d) => <option key={d} value={d} />)}</datalist>
              <textarea required rows={3} placeholder="সম্পূর্ণ ঠিকানা (বাসা, রোড, এলাকা, থানা) *" value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full rounded-xl border border-gray-200 bg-transparent px-3 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm" />
              <Input placeholder="বিশেষ নির্দেশনা (ঐচ্ছিক)" value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })} className="h-11 rounded-xl border-gray-200 bg-white" />
            </div>

            <Button type="submit" disabled={submitting} className="mt-5 h-12 w-full rounded-full text-base">
              {submitting ? <Loader2 className="animate-spin" /> : null}
              অর্ডার করুন — {taka(total)}
            </Button>
            <p className="mt-2 text-center text-xs text-gray-600">ক্যাশ অন ডেলিভারি · পণ্য হাতে পেয়ে টাকা দিন</p>
          </form>
        </section>
        <footer className="border-t border-gray-200 bg-white">
          <div className="mx-auto max-w-xl px-4 py-8 text-center">
            <p className="font-semibold text-primary">যেকোনো প্রয়োজনে যোগাযোগ করুন</p>
            <div className="mt-4 flex flex-col items-center justify-center gap-2 text-sm sm:flex-row sm:gap-5">
              <a href={`tel:${SUPPORT_PHONE}`} className="flex items-center gap-1.5 text-gray-700 hover:text-primary">
                <Phone className="size-4 text-primary" /> {bn(SUPPORT_PHONE)}
              </a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-gray-700 hover:text-primary">
                <WhatsAppIcon className="size-4 text-[#25D366]" /> WhatsApp
              </a>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="flex items-center gap-1.5 text-gray-700 hover:text-primary">
                <Mail className="size-4 text-primary" /> {SUPPORT_EMAIL}
              </a>
            </div>
            <p className="mt-5 text-xs text-gray-500">© {bn(new Date().getFullYear())} Surokkha · surokkha.shop</p>
          </div>
        </footer>
      </main>

      {/* Fixed bottom bar: discount-tier progress + jump to checkout */}
      <div className="offer-font fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white shadow-[0_-8px_24px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <p className="truncate text-xs text-foreground sm:text-sm">
            {next ? (
              <>
                আর <b className="text-rose-600">{taka(next.min - subtotal)}</b> এর পণ্য নিলে{' '}
                <b className="rounded bg-emerald-100 px-1 text-emerald-700">{bn(next.off)}% ছাড়</b>
                {tier && <> · এখন পাচ্ছেন <b className="text-emerald-600">{bn(tier.off)}%</b></>}
              </>
            ) : (
              <>🎉 সর্বোচ্চ <b className="rounded bg-emerald-100 px-1 text-emerald-700">{bn(topTier.off)}% ছাড়</b> পাচ্ছেন!</>
            )}
          </p>
          <div className="relative mt-2 h-2.5 rounded-full bg-gray-200">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-300"
              style={{ width: `${Math.min(subtotal / topTier.min, 1) * 100}%` }} />
            {DISCOUNT_TIERS.map((t) => (
              <span key={t.min} style={{ left: `${(t.min / topTier.min) * 100}%` }}
                className={`absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white ${
                  subtotal >= t.min ? 'bg-emerald-600' : 'bg-gray-300'}`} />
            ))}
          </div>
          <div className="mt-2.5 flex items-center justify-between gap-3">
            <div className="leading-tight">
              <p className="text-xs text-gray-600">
                {bn(count)}টি পণ্য
                {discount > 0 && <span className="ml-1.5 font-semibold text-emerald-600">সাশ্রয় {taka(discount)}</span>}
              </p>
              <p className="text-xl font-bold text-rose-600">
                {taka(total)}
                {discount > 0 && <s className="ml-1.5 text-sm font-normal text-gray-600">{taka(subtotal + shipping)}</s>}
              </p>
            </div>
            <Button onClick={goCheckout} className="h-11 rounded-full px-6">
              চেকআউট <ArrowRight />
            </Button>
          </div>
        </div>
      </div>

      <VariantDialog product={variantFor} onOpenChange={(o) => !o && setVariantFor(null)} qtyOf={qtyOf} change={change} />
      <QuickViewDialog product={quickView} onOpenChange={(o) => !o && setQuickView(null)} qtyOf={qtyOf} change={change} />
      <Toaster />
    </>
  )
}
