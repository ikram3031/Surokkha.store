import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowRight, CheckCircle2, Loader2, Lock, Truck, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import { AgeGate } from '@/components/AgeGate'
import { OfferProductCard } from '@/components/offer/OfferProductCard'
import { SearchableSelect, type SelectOption } from '@/components/offer/SearchableSelect'
import { TOP_PRODUCTS, useCatalogProducts, useComboProducts } from '@/hooks/useCatalogProducts'
import { Turnstile, TURNSTILE_SITE_KEY, type TurnstileHandle } from '@/components/offer/Turnstile'
import { QuickViewDialog, VariantDialog } from '@/components/offer/ProductDialogs'
import {
  READY_COMBOS_TITLE,
  DISCOUNT_TIERS,
  nextTier,
  tierFor,
  MAX_ORDER_AMOUNT,
  MAX_QTY_PER_LINE,
  MAX_QTY_PER_ORDER,
  DELIVERY,
  deliveryZone,
  ZONE_LABEL,
  variantPrice,
  type OfferProduct,
  type OfferVariant,
} from '@/data/offerProducts'

import { api, ApiError } from '@/lib/api/client'
import { bn, taka } from '@/lib/bn'

// value: Pathao spelling the thana API and orders use; label: Bangla name from the store DB
const DISTRICTS: SelectOption[] = [
  { value: "Cox's Bazar", label: 'কক্সবাজার' },
  { value: 'Kishoreganj', label: 'কিশোরগঞ্জ' },
  { value: 'Kurigram', label: 'কুড়িগ্রাম' },
  { value: 'Cumilla', label: 'কুমিল্লা' },
  { value: 'Kushtia', label: 'কুষ্টিয়া' },
  { value: 'Khagrachari', label: 'খাগড়াছড়ি' },
  { value: 'Khulna', label: 'খুলনা' },
  { value: 'Gaibandha', label: 'গাইবান্ধা' },
  { value: 'Gazipur', label: 'গাজীপুর' },
  { value: 'Gopalgonj', label: 'গোপালগঞ্জ' },
  { value: 'Chittagong', label: 'চট্টগ্রাম' },
  { value: 'Chandpur', label: 'চাঁদপুর' },
  { value: 'Chapainawabganj', label: 'চাঁপাইনবাবগঞ্জ' },
  { value: 'Chuadanga', label: 'চুয়াডাঙ্গা' },
  { value: 'Joypurhat', label: 'জয়পুরহাট' },
  { value: 'Jamalpur', label: 'জামালপুর' },
  { value: 'Jhalokathi', label: 'ঝালকাঠি' },
  { value: 'Jhenidah', label: 'ঝিনাইদহ' },
  { value: 'Tangail', label: 'টাঙ্গাইল' },
  { value: 'Thakurgaon', label: 'ঠাকুরগাঁও' },
  { value: 'Dhaka', label: 'ঢাকা' },
  { value: 'Dinajpur', label: 'দিনাজপুর' },
  { value: 'Naogaon', label: 'নওগাঁ' },
  { value: 'Narail', label: 'নড়াইল' },
  { value: 'Narshingdi', label: 'নরসিংদী' },
  { value: 'Natore', label: 'নাটোর' },
  { value: 'Narayanganj', label: 'নারায়ণগঞ্জ' },
  { value: 'Nilphamari', label: 'নীলফামারী' },
  { value: 'Netrakona', label: 'নেত্রকোণা' },
  { value: 'Noakhali', label: 'নোয়াখালী' },
  { value: 'Panchagarh', label: 'পঞ্চগড়' },
  { value: 'Patuakhali', label: 'পটুয়াখালী' },
  { value: 'Pabna', label: 'পাবনা' },
  { value: 'Pirojpur', label: 'পিরোজপুর' },
  { value: 'Faridpur', label: 'ফরিদপুর' },
  { value: 'Feni', label: 'ফেনী' },
  { value: 'Bogra', label: 'বগুড়া' },
  { value: 'Barguna', label: 'বরগুনা' },
  { value: 'Barisal', label: 'বরিশাল' },
  { value: 'Bagerhat', label: 'বাগেরহাট' },
  { value: 'Bandarban', label: 'বান্দরবান' },
  { value: 'B. Baria', label: 'ব্রাহ্মণবাড়িয়া' },
  { value: 'Bhola', label: 'ভোলা' },
  { value: 'Mymensingh', label: 'ময়মনসিংহ' },
  { value: 'Magura', label: 'মাগুরা' },
  { value: 'Madaripur', label: 'মাদারীপুর' },
  { value: 'Manikganj', label: 'মানিকগঞ্জ' },
  { value: 'Munsiganj', label: 'মুন্সীগঞ্জ' },
  { value: 'Meherpur', label: 'মেহেরপুর' },
  { value: 'Moulvibazar', label: 'মৌলভীবাজার' },
  { value: 'Jashore', label: 'যশোর' },
  { value: 'Rangpur', label: 'রংপুর' },
  { value: 'Rangamati', label: 'রাঙ্গামাটি' },
  { value: 'Rajbari', label: 'রাজবাড়ী' },
  { value: 'Rajshahi', label: 'রাজশাহী' },
  { value: 'Lakshmipur', label: 'লক্ষ্মীপুর' },
  { value: 'Lalmonirhat', label: 'লালমনিরহাট' },
  { value: 'Shariatpur', label: 'শরীয়তপুর' },
  { value: 'Sherpur', label: 'শেরপুর' },
  { value: 'Satkhira', label: 'সাতক্ষীরা' },
  { value: 'Sirajganj', label: 'সিরাজগঞ্জ' },
  { value: 'Sylhet', label: 'সিলেট' },
  { value: 'Sunamganj', label: 'সুনামগঞ্জ' },
  { value: 'Habiganj', label: 'হবিগঞ্জ' },
]

type FieldKey = 'name' | 'phone' | 'email' | 'district' | 'thana' | 'area' | 'address'
type CheckoutForm = Record<FieldKey | 'note', string>

const RULES: Record<FieldKey, (v: string) => string | true> = {
  name: (v) => v.trim().length >= 3 || 'নাম কমপক্ষে ৩ অক্ষরের হতে হবে',
  phone: (v) => /^01[3-9]\d{8}$/.test(v) || 'সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX, ১১ সংখ্যা)',
  email: (v) => !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'সঠিক ইমেইল দিন, না থাকলে খালি রাখুন',
  district: (v) => !!v || 'জেলা বাছাই করুন',
  thana: (v) => !!v || 'থানা বাছাই করুন',
  area: (v) => v.trim().length >= 2 || 'এলাকার নাম লিখুন',
  address: (v) => v.trim().length >= 10 || 'পূর্ণ ঠিকানা দিন (বাসা, রোড, ল্যান্ডমার্ক)',
}

const inputCls = (bad: boolean) =>
  `w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#dc143c] focus:ring-2 focus:ring-[#dc143c]/30 ${
    bad ? 'border-[#dc143c]' : 'border-gray-300'
  }`


// Selection key: product id, plus variant id on variable products
const keyOf = (productId: string, variantId?: string) => (variantId ? `${productId}:${variantId}` : productId)

// Support links in the header
const WHATSAPP_URL = 'https://wa.me/8801600905774'
const INSTAGRAM_URL = 'https://www.instagram.com/surokkha.shop/'

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

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

const trackedOrders = new Set<string>()

// Pixel browser ids, passed to the backend so its Conversions API event matches this visitor
const cookie = (name: string) => document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))?.[1] ?? ''

const toIntlPhone = (p: string) => (p.startsWith('0') ? `+88${p}` : p)

export default function OfferPage() {
  const { products: catalogProducts, loading: catalogLoading } = useCatalogProducts()
  const { products: comboProducts, loading: combosLoading } = useComboProducts()
  const products = useMemo(
    () => [...catalogProducts, ...comboProducts],
    [catalogProducts, comboProducts],
  )
  const [qty, setQty] = useState<Record<string, number>>({})
  const [variantFor, setVariantFor] = useState<OfferProduct | null>(null)
  const [quickView, setQuickView] = useState<OfferProduct | null>(null)
  const [form, setForm] = useState<CheckoutForm>({
    name: '', phone: '', email: '', district: '', thana: '', area: '', address: '', note: '',
  })
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({})
  const [thanas, setThanas] = useState<SelectOption[]>([])
  const [thanasLoading, setThanasLoading] = useState(false)
  const [captcha, setCaptcha] = useState('')
  const captchaRef = useRef<TurnstileHandle>(null)

  const validate = (key: FieldKey, value = form[key]) => {
    const res = RULES[key](value)
    setErrors((e) => ({ ...e, [key]: res === true ? undefined : res }))
    return res === true
  }
  const setField = (key: FieldKey | 'note', value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    if (key !== 'note') setErrors((e) => ({ ...e, [key]: undefined }))
  }

  // Catalog ad links (?product=<did>) open that product's Details on arrival
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('product')
    const p = id && products.find((x) => x.id === id)
    if (p) setQuickView(p)
  }, [products])

  // Thanas come from the store's Pathao-synced location API
  useEffect(() => {
    setThanas([])
    if (!form.district) return
    const controller = new AbortController()
    setThanasLoading(true)
    api
      .get<{ data?: { name: string; bnName?: string }[] }>(`/locations/districts/${encodeURIComponent(form.district)}/thanas`, undefined, {
        signal: controller.signal,
      })
      .then((res) => setThanas((res?.data ?? []).map((t) => ({ value: t.name, label: t.bnName || t.name })).sort((x, y) => x.label.localeCompare(y.label, 'bn'))))
      .catch(() => {
        if (!controller.signal.aborted) setThanas([])
      })
      .finally(() => {
        if (!controller.signal.aborted) setThanasLoading(false)
      })
    return () => controller.abort()
  }, [form.district])
  const [submitting, setSubmitting] = useState(false)
  const submitLock = useRef(false)
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
  // The tiered discount counts every product, ready combos included
  const comboSubtotal = subtotal
  const tier = tierFor(comboSubtotal)
  const next = nextTier(comboSubtotal)
  const discount = tier ? Math.round((comboSubtotal * tier.off) / 100) : 0
  const zone = deliveryZone(form.district, form.thana)
  const shipping = count === 0 ? 0 : DELIVERY[zone]
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
    const ok = (Object.keys(RULES) as FieldKey[]).map((k) => validate(k)).every(Boolean)
    if (!ok) {
      setTimeout(() => document.querySelector('[data-error]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0)
      return
    }
    if (TURNSTILE_SITE_KEY && !captcha) return toast.error('অর্ডার করার আগে "আমি রোবট নই" যাচাই সম্পন্ন করুন')

    const info = {
      fullName: form.name.trim(),
      phone: toIntlPhone(form.phone),
      email: form.email.trim(),
      address: `${form.address.trim()}, ${form.area.trim()}`,
      thana: form.thana,
      district: form.district,
      zip: '',
    }
    // Ref guard: state-based `disabled` lags a render, so a double tap could place (and track) the order twice
    if (submitLock.current) return
    submitLock.current = true
    setSubmitting(true)
    try {
      const res = await api.post<{ data?: { orderNumber?: string } }>('/orders/new-order', {
        // A normal online order (main Orders list) with its own OS prefix
        orderType: 'online',
        orderPrefix: 'OS',
        clientDomain: 'offer.surokkha.shop',
        paymentMethod: 'Cash on Delivery',
        fbp: cookie('_fbp'),
        fbc: cookie('_fbc'),
        turnstileToken: captcha,
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
      // Fire Purchase once per order; the eventID matches the server CAPI event_id so Meta dedupes the pair
      if (!orderNumber || !trackedOrders.has(orderNumber)) track(
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
      if (orderNumber) trackedOrders.add(orderNumber)
      setPlaced(orderNumber)
      setQty({})
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'অর্ডার করা যায়নি, আবার চেষ্টা করুন')
      // A Turnstile token is single-use, so ask for a fresh one before the next try
      captchaRef.current?.reset()
    } finally {
      submitLock.current = false
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
          <div className="flex items-center gap-2">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp-এ যোগাযোগ করুন"
              title="WhatsApp"
              className="flex size-9 items-center justify-center rounded-full bg-[#25D366] text-white shadow transition hover:bg-[#1ebe5a]"
            >
              <WhatsAppIcon className="size-5" />
            </a>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram-এ দেখুন"
              title="Instagram"
              className="flex size-9 items-center justify-center rounded-full bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5] text-white shadow transition hover:opacity-90"
            >
              <InstagramIcon className="size-5" />
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
            <div className="mx-auto mt-4 grid max-w-md grid-cols-3 gap-2 sm:gap-3">
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
            {catalogLoading &&
              TOP_PRODUCTS.map((t) => (
                <div key={t.path} className="aspect-[3/5] animate-pulse rounded-3xl border border-gray-200 bg-gray-100" />
              ))}
            {catalogProducts.map((p) => (
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
              { icon: Truck, t: 'সারাদেশে ডেলিভারি', d: `ঢাকায় ${taka(DELIVERY.dhakaCity)}, বাইরে ${taka(DELIVERY.outsideDhaka)}` },
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

        {(combosLoading || comboProducts.length > 0) && (
          <section className="bg-white">
            <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
              <div className="mx-auto mb-6 max-w-2xl text-center">
                <h2 className="text-2xl font-bold text-black sm:text-3xl">{READY_COMBOS_TITLE}</h2>
                <p className="mt-2 text-sm text-gray-600 sm:text-base">আমাদের বাছাই করা সাশ্রয়ী কম্বো প্যাক — এক ক্লিকেই যোগ করুন।</p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3">
                {combosLoading &&
                  [0, 1, 2].map((i) => (
                    <div key={i} className="aspect-[3/5] animate-pulse rounded-3xl border border-gray-200 bg-gray-100" />
                  ))}
                {comboProducts.map((p) => (
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
            </div>
          </section>
        )}

        {/* Checkout: always the last block on the page */}
        <section ref={checkoutRef} id="checkout" className="scroll-mt-4 border-t border-gray-200 bg-gray-50">
          <div className="mx-auto max-w-6xl px-3 py-6 sm:px-4 sm:py-8 lg:py-12">
            <div className="mb-4 sm:mb-6">
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">চেকআউট</h2>
              <p className="mt-1 text-sm text-gray-500">ডেলিভারির তথ্য দিন, তারপর অর্ডার কনফার্ম করুন।</p>
            </div>

            <form onSubmit={submit} noValidate className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
              <div className="min-w-0 space-y-4 sm:space-y-6">
                <CheckoutCard step={1} title="যোগাযোগের তথ্য">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
                    <Field label="পুরো নাম" required error={errors.name} className="sm:col-span-2">
                      <input value={form.name} autoComplete="name" placeholder="যেমন: আব্দুর রহমান"
                        onChange={(e) => setField('name', e.target.value)} onBlur={() => validate('name')}
                        className={inputCls(!!errors.name)} />
                    </Field>
                    <Field label="মোবাইল নম্বর" required error={errors.phone}>
                      <div className={`flex rounded-lg border bg-white transition focus-within:border-[#dc143c] focus-within:ring-2 focus-within:ring-[#dc143c]/30 ${
                        errors.phone ? 'border-[#dc143c]' : 'border-gray-300'}`}>
                        <span className="flex items-center border-r border-gray-300 px-3 text-sm text-gray-500">+88</span>
                        <input type="tel" inputMode="numeric" maxLength={11} autoComplete="tel-national" placeholder="01XXXXXXXXX"
                          value={form.phone} onChange={(e) => setField('phone', e.target.value.replace(/\D/g, '').slice(0, 11))}
                          onBlur={() => validate('phone')}
                          className="w-full min-w-0 bg-transparent px-3.5 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400" />
                      </div>
                    </Field>
                    <Field label="ইমেইল" optional error={errors.email}>
                      <input type="email" autoComplete="email" placeholder="you@example.com" value={form.email}
                        onChange={(e) => setField('email', e.target.value)} onBlur={() => validate('email')}
                        className={inputCls(!!errors.email)} />
                    </Field>
                  </div>
                </CheckoutCard>

                <CheckoutCard step={2} title="ডেলিভারি ঠিকানা">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
                    <Field label="জেলা" required error={errors.district}>
                      <SearchableSelect value={form.district} options={DISTRICTS} placeholder="জেলা বাছাই করুন"
                        invalid={!!errors.district}
                        onChange={(v) => {
                          setForm((f) => ({ ...f, district: v, thana: '' }))
                          setErrors((e) => ({ ...e, district: undefined, thana: undefined }))
                        }} />
                    </Field>
                    <Field label="থানা / উপজেলা" required error={errors.thana}>
                      <SearchableSelect value={form.thana} options={thanas} invalid={!!errors.thana}
                        disabled={!form.district || thanasLoading}
                        placeholder={!form.district ? 'আগে জেলা বাছাই করুন' : thanasLoading ? 'লোড হচ্ছে…' : 'থানা বাছাই করুন'}
                        emptyText={thanas.length ? undefined : 'এই জেলার থানা পাওয়া যায়নি'}
                        onChange={(v) => setField('thana', v)} />
                    </Field>
                    <Field label="এলাকা" required error={errors.area} className="sm:col-span-2">
                      <input value={form.area} placeholder="যেমন: মিরপুর ১০, ধানমন্ডি ২৭" onChange={(e) => setField('area', e.target.value)}
                        onBlur={() => validate('area')} className={inputCls(!!errors.area)} />
                    </Field>
                    <Field label="পূর্ণ ঠিকানা" required error={errors.address} className="sm:col-span-2">
                      <textarea rows={3} autoComplete="street-address" placeholder="বাসা নং, রোড নং, বিল্ডিং, ফ্লোর, ল্যান্ডমার্ক…"
                        value={form.address} onChange={(e) => setField('address', e.target.value)} onBlur={() => validate('address')}
                        className={`${inputCls(!!errors.address)} resize-none`} />
                    </Field>
                    <Field label="বিশেষ নির্দেশনা" optional className="sm:col-span-2">
                      <input value={form.note} placeholder="যেমন: বিকেলে ডেলিভারি দিন" onChange={(e) => setField('note', e.target.value)}
                        className={inputCls(false)} />
                    </Field>
                  </div>
                </CheckoutCard>

                <CheckoutCard step={3} title="পেমেন্ট পদ্ধতি">
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#dc143c] bg-[#dc143c]/10 px-4 py-3 text-sm sm:max-w-xs">
                    <input type="radio" name="payment" checked readOnly className="accent-[#dc143c]" />
                    ক্যাশ অন ডেলিভারি
                  </label>
                  <p className="mt-2 text-xs text-gray-500">পণ্য হাতে পেয়ে টাকা পরিশোধ করুন।</p>
                </CheckoutCard>
              </div>

              <aside className="min-w-0 lg:sticky lg:top-6 lg:self-start">
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                  <h3 className="mb-2 text-base font-semibold text-gray-900">অর্ডার সামারি</h3>
                  {lines.length ? (
                    <ul className="divide-y divide-gray-200">
                      {lines.map((l) => (
                        <li key={keyOf(l.product.id, l.variant?.id)} className="flex items-center gap-3 py-3">
                          <div className="size-14 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                            {l.product.images[0] && <img src={l.product.images[0]} alt="" className="h-full w-full object-cover" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900">{l.product.name}</p>
                            <p className="text-xs text-gray-400">
                              {l.variant ? `${l.variant.label} · ` : ''}পরিমাণ {bn(l.qty)}
                            </p>
                          </div>
                          <p className="text-sm font-medium text-gray-900">{taka(l.unitPrice * l.qty)}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="py-3 text-sm text-gray-500">এখনো কোনো পণ্য বাছাই করা হয়নি।</p>
                  )}

                  <dl className="mt-4 space-y-2 border-t border-gray-200 pt-4 text-sm">
                    <div className="flex justify-between"><dt className="text-gray-500">সাবটোটাল</dt><dd>{taka(subtotal)}</dd></div>
                    {tier && (
                      <div className="flex justify-between">
                        <dt className="text-gray-500">কম্বো ছাড় ({bn(tier.off)}%)</dt>
                        <dd className="text-emerald-600">−{taka(discount)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <dt className="text-gray-500">
                        ডেলিভারি চার্জ{' '}
                        {form.district && <span className="text-xs text-gray-400">({ZONE_LABEL[zone]})</span>}
                      </dt>
                      <dd>{count ? taka(shipping) : '—'}</dd>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-3 text-base font-semibold">
                      <dt>সর্বমোট</dt><dd className="text-[#b80f31]">{taka(total)}</dd>
                    </div>
                  </dl>

                  <Turnstile ref={captchaRef} onToken={setCaptcha} />

                  <button type="submit" disabled={submitting || (!!TURNSTILE_SITE_KEY && !captcha)}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#dc143c] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#b80f31] focus:outline-none focus:ring-2 focus:ring-[#dc143c]/50 disabled:cursor-not-allowed disabled:opacity-60">
                    {submitting && <Loader2 className="size-4 animate-spin" />}
                    {submitting ? 'অর্ডার হচ্ছে…' : `অর্ডার কনফার্ম করুন — ${taka(total)}`}
                  </button>
                  <p className="mt-3 text-center text-xs text-gray-400">অর্ডার করলে আপনি আমাদের শর্তাবলী মেনে নিচ্ছেন।</p>
                </div>
              </aside>
            </form>
          </div>
        </section>
      </main>

      {/* Fixed bottom bar: discount-tier progress + jump to checkout */}
      <div className="offer-font fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white shadow-[0_-8px_24px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <p className="truncate text-xs text-foreground sm:text-sm">
            {next ? (
              <>
                আর <b className="text-rose-600">{taka(next.min - comboSubtotal)}</b> এর পণ্য নিলে{' '}
                <b className="rounded bg-emerald-100 px-1 text-emerald-700">{bn(next.off)}% ছাড়</b>
                {tier && <> · এখন পাচ্ছেন <b className="text-emerald-600">{bn(tier.off)}%</b></>}
              </>
            ) : (
              <>🎉 সর্বোচ্চ <b className="rounded bg-emerald-100 px-1 text-emerald-700">{bn(topTier.off)}% ছাড়</b> পাচ্ছেন!</>
            )}
          </p>
          <div className="relative mt-2 h-2.5 rounded-full bg-gray-200">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-300"
              style={{ width: `${Math.min(comboSubtotal / topTier.min, 1) * 100}%` }} />
            {DISCOUNT_TIERS.map((t) => (
              <span key={t.min} style={{ left: `${(t.min / topTier.min) * 100}%` }}
                className={`absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white ${
                  comboSubtotal >= t.min ? 'bg-emerald-600' : 'bg-gray-300'}`} />
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

function CheckoutCard({ step, title, children }: { step: number; title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <h3 className="mb-5 flex items-center gap-2 text-base font-semibold text-gray-900">
        <span className="grid size-6 place-items-center rounded-full bg-[#dc143c]/15 text-xs text-[#b80f31]">{bn(step)}</span>
        {title}
      </h3>
      {children}
    </div>
  )
}

function Field({ label, required, optional, error, className = '', children }: {
  label: string
  required?: boolean
  optional?: boolean
  error?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium text-gray-900">
        {label} {required && <span className="text-[#b80f31]">*</span>}
        {optional && <span className="text-xs font-normal text-gray-400">(ঐচ্ছিক)</span>}
      </label>
      {children}
      {error && <p data-error className="mt-1 text-xs text-[#b80f31]">{error}</p>}
    </div>
  )
}
