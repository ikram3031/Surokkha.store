import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowRight, CheckCircle2, Loader2, Lock, Truck, Wallet, Minus, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { TrialPackSection } from '@/components/offer/TrialPackSection'
import { OfferCart, type CartLine } from '@/components/offer/OfferCart'
import { getGroupOffer, type GroupOffer } from '@/lib/api/groupOffers'
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
import { pixelTrack as track } from '@/lib/pixel'
import { bn, taka } from '@/lib/bn'

// value: Pathao spelling the thana API and orders use; label: Bangla name from the store DB
const DISTRICTS: SelectOption[] = [
  { value: "Cox's Bazar", label: "Cox's Bazar · কক্সবাজার" },
  { value: 'Kishoreganj', label: 'Kishoreganj · কিশোরগঞ্জ' },
  { value: 'Kurigram', label: 'Kurigram · কুড়িগ্রাম' },
  { value: 'Cumilla', label: 'Cumilla · কুমিল্লা' },
  { value: 'Kushtia', label: 'Kushtia · কুষ্টিয়া' },
  { value: 'Khagrachari', label: 'Khagrachari · খাগড়াছড়ি' },
  { value: 'Khulna', label: 'Khulna · খুলনা' },
  { value: 'Gaibandha', label: 'Gaibandha · গাইবান্ধা' },
  { value: 'Gazipur', label: 'Gazipur · গাজীপুর' },
  { value: 'Gopalgonj', label: 'Gopalgonj · গোপালগঞ্জ' },
  { value: 'Chittagong', label: 'Chittagong · চট্টগ্রাম' },
  { value: 'Chandpur', label: 'Chandpur · চাঁদপুর' },
  { value: 'Chapainawabganj', label: 'Chapainawabganj · চাঁপাইনবাবগঞ্জ' },
  { value: 'Chuadanga', label: 'Chuadanga · চুয়াডাঙ্গা' },
  { value: 'Joypurhat', label: 'Joypurhat · জয়পুরহাট' },
  { value: 'Jamalpur', label: 'Jamalpur · জামালপুর' },
  { value: 'Jhalokathi', label: 'Jhalokathi · ঝালকাঠি' },
  { value: 'Jhenidah', label: 'Jhenidah · ঝিনাইদহ' },
  { value: 'Tangail', label: 'Tangail · টাঙ্গাইল' },
  { value: 'Thakurgaon', label: 'Thakurgaon · ঠাকুরগাঁও' },
  { value: 'Dhaka', label: 'Dhaka · ঢাকা' },
  { value: 'Dinajpur', label: 'Dinajpur · দিনাজপুর' },
  { value: 'Naogaon', label: 'Naogaon · নওগাঁ' },
  { value: 'Narail', label: 'Narail · নড়াইল' },
  { value: 'Narshingdi', label: 'Narshingdi · নরসিংদী' },
  { value: 'Natore', label: 'Natore · নাটোর' },
  { value: 'Narayanganj', label: 'Narayanganj · নারায়ণগঞ্জ' },
  { value: 'Nilphamari', label: 'Nilphamari · নীলফামারী' },
  { value: 'Netrakona', label: 'Netrakona · নেত্রকোণা' },
  { value: 'Noakhali', label: 'Noakhali · নোয়াখালী' },
  { value: 'Panchagarh', label: 'Panchagarh · পঞ্চগড়' },
  { value: 'Patuakhali', label: 'Patuakhali · পটুয়াখালী' },
  { value: 'Pabna', label: 'Pabna · পাবনা' },
  { value: 'Pirojpur', label: 'Pirojpur · পিরোজপুর' },
  { value: 'Faridpur', label: 'Faridpur · ফরিদপুর' },
  { value: 'Feni', label: 'Feni · ফেনী' },
  { value: 'Bogra', label: 'Bogra · বগুড়া' },
  { value: 'Barguna', label: 'Barguna · বরগুনা' },
  { value: 'Barisal', label: 'Barisal · বরিশাল' },
  { value: 'Bagerhat', label: 'Bagerhat · বাগেরহাট' },
  { value: 'Bandarban', label: 'Bandarban · বান্দরবান' },
  { value: 'B. Baria', label: 'Brahmanbaria · ব্রাহ্মণবাড়িয়া' },
  { value: 'Bhola', label: 'Bhola · ভোলা' },
  { value: 'Mymensingh', label: 'Mymensingh · ময়মনসিংহ' },
  { value: 'Magura', label: 'Magura · মাগুরা' },
  { value: 'Madaripur', label: 'Madaripur · মাদারীপুর' },
  { value: 'Manikganj', label: 'Manikganj · মানিকগঞ্জ' },
  { value: 'Munsiganj', label: 'Munsiganj · মুন্সীগঞ্জ' },
  { value: 'Meherpur', label: 'Meherpur · মেহেরপুর' },
  { value: 'Moulvibazar', label: 'Moulvibazar · মৌলভীবাজার' },
  { value: 'Jashore', label: 'Jashore · যশোর' },
  { value: 'Rangpur', label: 'Rangpur · রংপুর' },
  { value: 'Rangamati', label: 'Rangamati · রাঙ্গামাটি' },
  { value: 'Rajbari', label: 'Rajbari · রাজবাড়ী' },
  { value: 'Rajshahi', label: 'Rajshahi · রাজশাহী' },
  { value: 'Lakshmipur', label: 'Lakshmipur · লক্ষ্মীপুর' },
  { value: 'Lalmonirhat', label: 'Lalmonirhat · লালমনিরহাট' },
  { value: 'Shariatpur', label: 'Shariatpur · শরীয়তপুর' },
  { value: 'Sherpur', label: 'Sherpur · শেরপুর' },
  { value: 'Satkhira', label: 'Satkhira · সাতক্ষীরা' },
  { value: 'Sirajganj', label: 'Sirajganj · সিরাজগঞ্জ' },
  { value: 'Sylhet', label: 'Sylhet · সিলেট' },
  { value: 'Sunamganj', label: 'Sunamganj · সুনামগঞ্জ' },
  { value: 'Habiganj', label: 'Habiganj · হবিগঞ্জ' },
]

type FieldKey = 'name' | 'phone' | 'email' | 'district' | 'thana' | 'area' | 'address'
type CheckoutForm = Record<FieldKey | 'note', string>

const RULES: Record<FieldKey, (v: string) => string | true> = {
  name: (v) => v.trim().length >= 3 || 'Name must be at least 3 characters',
  phone: (v) => /^01[3-9]\d{8}$/.test(v) || 'Enter a valid mobile number (01XXXXXXXXX, 11 digits)',
  email: (v) => !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Enter a valid email, or leave it empty',
  district: (v) => !!v || 'Select a district',
  thana: (v) => !!v || 'Select a thana',
  area: (v) => v.trim().length >= 2 || 'Enter your area name',
  address: (v) => v.trim().length >= 10 || 'Enter your full address (house, road, landmark)',
}

const inputCls = (bad: boolean) =>
  `w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#dc143c] ${
    bad ? 'border-[#dc143c]' : 'border-gray-300'
  }`


// Selection key: product id, plus variant id on variable products
const keyOf = (productId: string, variantId?: string) => (variantId ? `${productId}:${variantId}` : productId)

// The "Surokkha Trial Pack" group product (Dashboard → Products → Group Offers). Only its products and the
// minimum pieces are used here; the page's common tier discount applies to everything.
const TRIAL_GROUP_SLUG = 'surokkha-trial-pack'

const trackedOrders = new Set<string>()

// Pixel browser ids, passed to the backend so its Conversions API event matches this visitor
const cookie = (name: string) => document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))?.[1] ?? ''

const toIntlPhone = (p: string) => (p.startsWith('0') ? `+88${p}` : p)

export function OfferHome() {
  const { products: catalogProducts, loading: catalogLoading } = useCatalogProducts()
  const { products: comboProducts, loading: combosLoading } = useComboProducts()
  const products = useMemo(
    () => [...catalogProducts, ...comboProducts],
    [catalogProducts, comboProducts],
  )
  const [trial, setTrial] = useState<GroupOffer | null>(null)
  const [trialQty, setTrialQty] = useState<Record<string, number>>({})
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

  useEffect(() => {
    const controller = new AbortController()
    getGroupOffer(TRIAL_GROUP_SLUG, { signal: controller.signal })
      .then((res) => setTrial(res.data ?? null))
      .catch(() => {})
    return () => controller.abort()
  }, [])

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
      .then((res) => setThanas((res?.data ?? []).map((t) => ({ value: t.name, label: t.bnName && t.bnName !== t.name ? `${t.name} · ${t.bnName}` : t.name })).sort((x, y) => x.label.localeCompare(y.label))))
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

  // Trial Pack pieces live in the same order; the tiered discount below counts them like any other product
  const trialLines = (trial?.products ?? [])
    .filter((p) => (trialQty[p.id] ?? 0) > 0)
    .map((p) => ({ product: p, qty: trialQty[p.id] }))
  const trialCount = trialLines.reduce((s, l) => s + l.qty, 0)
  const trialSubtotal = trialLines.reduce((s, l) => s + l.product.unitPrice * l.qty, 0)
  const count = lines.reduce((s, l) => s + l.qty, 0) + trialCount
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0) + trialSubtotal
  // The tiered discount counts every product, ready combos included
  const comboSubtotal = subtotal
  const tier = tierFor(comboSubtotal)
  const next = nextTier(comboSubtotal)
  const discount = tier ? Math.round((comboSubtotal * tier.off) / 100) : 0
  const zone = deliveryZone(form.district, form.thana)
  // No delivery charge until the customer has told us where it goes (Dhaka also needs the thana for the suburb rate)
  const addressKnown = !!form.district && (form.district.trim().toLowerCase() !== 'dhaka' || !!form.thana)
  const shipping = count === 0 || !addressKnown ? 0 : DELIVERY[zone]
  const total = subtotal - discount + shipping
  const topTier = DISCOUNT_TIERS[DISCOUNT_TIERS.length - 1]

  const fail = (message: string) => {
    toast.error(message)
    return false
  }

  /** Adds/removes one piece; returns false when the change was refused (stock or order limits). */
  const change = (productId: string, variantId: string | undefined, delta: number): boolean => {
    const k = keyOf(productId, variantId)
    const cur = qty[k] ?? 0
    if (delta > 0) {
      const p = products.find((x) => x.id === productId)!
      const v = p.variants?.find((x) => x.id === variantId)
      if (!(v ? v.inStock : p.inStock)) return fail('Sorry, this is out of stock right now')
      const price = variantPrice(p, v)
      if (cur >= MAX_QTY_PER_LINE) return fail(`You can add up to ${bn(MAX_QTY_PER_LINE)} of one product`)
      if (count >= MAX_QTY_PER_ORDER) return fail(`You can order up to ${bn(MAX_QTY_PER_ORDER)} items in one order`)
      if (subtotal + price > MAX_ORDER_AMOUNT)
        return fail(`For orders above ${taka(MAX_ORDER_AMOUNT)}, please contact us`)
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
    return true
  }


  const goCheckout = () => {
    if (!count) return toast.error('Please select at least one product first')
    track('InitiateCheckout', { value: subtotal - discount, currency: 'BDT', num_items: count })
    checkoutRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Take a whole line (a product, or one variant of it) out of the order
  const removeLine = (productId: string, variantId?: string) =>
    setQty((q) => {
      const next = { ...q }
      delete next[keyOf(productId, variantId)]
      return next
    })

  // Click on a product photo: add it; products that need options or are out of stock open their view instead
  const addFromPhoto = (p: OfferProduct) => {
    if (p.variants?.length) return setVariantFor(p)
    if (!p.inStock) return setQuickView(p)
    if (change(p.id, undefined, 1)) toast.success(`${p.name} added to your order`)
  }

  const trialMin = Math.max(1, trial?.minPerProduct || 1)

  /** Steps one Trial Pack product: the first piece jumps to the minimum, going below the minimum clears it. */
  const stepTrial = (id: string, delta: 1 | -1): boolean => {
    const p = trial?.products.find((x) => x.id === id)
    if (!p) return false
    const cur = trialQty[id] ?? 0
    let n = cur
    if (delta === 1) {
      if (!p.inStock) return fail('Sorry, this is out of stock right now')
      if (cur >= MAX_QTY_PER_LINE) return fail(`You can add up to ${bn(MAX_QTY_PER_LINE)} of one product`)
      n = cur === 0 ? trialMin : cur + 1
      if (count - cur + n > MAX_QTY_PER_ORDER) return fail(`You can order up to ${bn(MAX_QTY_PER_ORDER)} items in one order`)
      if (subtotal + (n - cur) * p.unitPrice > MAX_ORDER_AMOUNT)
        return fail(`For orders above ${taka(MAX_ORDER_AMOUNT)}, please contact us`)
      track('AddToCart', { content_ids: [p.did], content_name: p.name, content_type: 'product', value: (n - cur) * p.unitPrice, currency: 'BDT' })
    } else n = cur <= trialMin ? 0 : cur - 1
    setTrialQty((q) => ({ ...q, [id]: n }))
    return true
  }

  const removeTrialLine = (id: string) =>
    setTrialQty((q) => {
      const next = { ...q }
      delete next[id]
      return next
    })

  // Trial Pack "Order now": pick a starter set if nothing is chosen yet (first products, the minimum of each,
  // until the pack's minimum amount is met), then go straight to the checkout form
  const orderTrialPack = () => {
    if (!trial) return
    let added = 0
    if (trialCount === 0) {
      const picks: Record<string, number> = {}
      let pieces = 0
      let amount = 0
      for (const p of trial.products.filter((x) => x.inStock)) {
        if (Object.keys(picks).length >= 3 && amount >= trial.minOrderAmount) break
        picks[p.id] = trialMin
        pieces += trialMin
        amount += trialMin * p.unitPrice
      }
      if (!pieces) return fail('Sorry, the Trial Pack is out of stock right now')
      if (count + pieces > MAX_QTY_PER_ORDER) return fail(`You can order up to ${bn(MAX_QTY_PER_ORDER)} items in one order`)
      if (subtotal + amount > MAX_ORDER_AMOUNT) return fail(`For orders above ${taka(MAX_ORDER_AMOUNT)}, please contact us`)
      setTrialQty((q) => ({ ...q, ...picks }))
      track('AddToCart', { content_ids: Object.keys(picks), content_name: trial.name, content_type: 'product', value: amount, currency: 'BDT' })
      added = amount
    }
    track('InitiateCheckout', { value: subtotal + added - discount, currency: 'BDT', num_items: count + (added ? 1 : 0) })
    checkoutRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // One list for the floating cart: ordinary products and Trial Pack pieces
  const cartLines: CartLine[] = [
    ...lines.map((l) => ({
      key: keyOf(l.product.id, l.variant?.id),
      name: l.product.name,
      sub: l.variant?.label,
      image: l.product.images[0],
      qty: l.qty,
      amount: l.unitPrice * l.qty,
      onDec: () => change(l.product.id, l.variant?.id, -1),
      onInc: () => change(l.product.id, l.variant?.id, 1),
      onRemove: () => removeLine(l.product.id, l.variant?.id),
    })),
    ...trialLines.map(({ product: p, qty: q }) => ({
      key: `trial:${p.id}`,
      name: p.name,
      sub: trial?.name,
      image: undefined,
      qty: q,
      amount: p.unitPrice * q,
      onDec: () => stepTrial(p.id, -1),
      onInc: () => stepTrial(p.id, 1),
      onRemove: () => removeTrialLine(p.id),
    })),
  ]

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!count) return toast.error('Please select at least one product first')
    if (trial && trialCount > 0 && trial.minOrderAmount > 0 && trialSubtotal < trial.minOrderAmount)
      return toast.error(`Take at least ${taka(trial.minOrderAmount)} of ${trial.name} pieces, or remove them`)
    const ok = (Object.keys(RULES) as FieldKey[]).map((k) => validate(k)).every(Boolean)
    if (!ok) {
      setTimeout(() => document.querySelector('[data-error]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0)
      return
    }
    if (TURNSTILE_SITE_KEY && !captcha) return toast.error('Please complete the "I am not a robot" check before ordering')

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
        items: [
          ...lines.map((l) => ({
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
          // Trial Pack pieces, in the same format the offer site sends
          ...trialLines.map(({ product: p, qty: q }) => ({
            name: p.name,
            quantity: q,
            unitPrice: p.unitPrice,
            size: `Group Offer: ${trial!.name}`,
            productId: p.id,
            itemId: '',
            productDid: p.did,
            itemType: 'product',
            sku: p.did,
            image: p.image,
          })),
        ],
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
          content_ids: [...lines.map((l) => l.variant?.sku || l.product.sku || l.product.id), ...trialLines.map((l) => l.product.did)],
          contents: [
            ...lines.map((l) => ({ id: l.variant?.sku || l.product.sku || l.product.id, quantity: l.qty, item_price: l.unitPrice })),
            ...trialLines.map((l) => ({ id: l.product.did, quantity: l.qty, item_price: l.product.unitPrice })),
          ],
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
      setTrialQty({})
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not place the order, please try again')
      // A Turnstile token is single-use, so ask for a fresh one before the next try
      captchaRef.current?.reset()
    } finally {
      submitLock.current = false
      setSubmitting(false)
    }
  }

  if (placed !== null) {
    return (
      <main className="offer-font flex min-h-[60dvh] items-center justify-center bg-white px-4 py-12">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-lg">
          <CheckCircle2 className="mx-auto size-14 text-primary" />
          <h1 className="mt-4 text-2xl font-bold">Order placed!</h1>
          {placed && <p className="mt-2 text-gray-600">Order number: <b className="text-foreground">{placed}</b></p>}
          <p className="mt-2 text-sm text-gray-600">Our team will call you shortly to confirm your order.</p>
          <Button className="mt-6 rounded-full" onClick={() => setPlaced(null)}>Order again</Button>
        </div>
      </main>
    )
  }

  return (
    <>
      <main className="bg-white pb-40 leading-relaxed antialiased offer-font">
        <section className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
          <div className="mx-auto mb-6 max-w-2xl text-center sm:mb-8">
            <h1 className="text-2xl font-bold leading-snug sm:text-3xl">
              <span className="text-black">Build your own </span>
              <span className="offer-combo">combo</span>
              <span className="text-black"> your way</span>
            </h1>
            <p className="mt-2 text-sm text-gray-600 sm:text-base">
              Discounts start at {taka(DISCOUNT_TIERS[0].min)} — the more you buy, the more you save, up to{' '}
              <b className="text-emerald-600">{bn(topTier.off)}%</b>!
            </p>
            <div className="mx-auto mt-4 grid max-w-md grid-cols-3 gap-2 sm:gap-3">
              {DISCOUNT_TIERS.map((t) => {
                const on = tier && t.min <= tier.min
                return (
                  <div key={t.min}
                    className={`rounded-xl border-2 px-1 py-2 transition ${on ? 'border-emerald-500 bg-emerald-50' : 'border-dashed border-gray-200'}`}>
                    <p className={`text-base font-bold sm:text-lg ${on ? 'text-emerald-600' : 'text-rose-600'}`}>{bn(t.off)}% off</p>
                    <p className="text-[11px] text-gray-600 sm:text-xs">on orders of {taka(t.min)}+</p>
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
                onMediaClick={() => addFromPhoto(p)}
              />
            ))}
          </div>
        </section>

        {trial && (
          <TrialPackSection
            offer={trial}
            qty={trialQty}
            onStep={stepTrial}
            onOrderNow={orderTrialPack}
            subtotal={trialSubtotal}
          />
        )}

        <section className="bg-rose-50">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-3 px-4 py-8 sm:grid-cols-3">
            {[
              { icon: Lock, t: 'Discreet packaging', d: 'Nobody can tell what is inside' },
              { icon: Truck, t: 'Nationwide delivery', d: `${taka(DELIVERY.dhakaCity)} in Dhaka, ${taka(DELIVERY.outsideDhaka)} elsewhere` },
              { icon: Wallet, t: 'Cash on delivery', d: 'Pay when you receive the product' },
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
            <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
              <div className="mx-auto mb-6 max-w-2xl text-center">
                <h2 className="text-2xl font-bold text-black sm:text-3xl">{READY_COMBOS_TITLE}</h2>
                <p className="mt-2 text-sm text-gray-600 sm:text-base">Our hand-picked value combo packs — add in one click.</p>
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
                    onMediaClick={() => addFromPhoto(p)}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Checkout: always the last block on the page */}
        <section ref={checkoutRef} id="checkout" className="scroll-mt-4 border-t border-gray-200 bg-gray-50">
          <div className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8 lg:py-12">
            <div className="mb-4 sm:mb-6">
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Checkout</h2>
              <p className="mt-1 text-sm text-gray-500">Enter your delivery details, then confirm your order.</p>
            </div>

            <form onSubmit={submit} noValidate className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
              <div className="min-w-0 space-y-4 sm:space-y-6">
                <CheckoutCard step={1} title="Contact details">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
                    <Field label="Full name" required error={errors.name} className="sm:col-span-2">
                      <input value={form.name} autoComplete="name" placeholder="e.g. Abdur Rahman"
                        onChange={(e) => setField('name', e.target.value)} onBlur={() => validate('name')}
                        className={inputCls(!!errors.name)} />
                    </Field>
                    <Field label="Mobile number" required error={errors.phone}>
                      <div className={`flex rounded-lg border bg-white transition focus-within:border-[#dc143c] ${
                        errors.phone ? 'border-[#dc143c]' : 'border-gray-300'}`}>
                        <span className="flex items-center border-r border-gray-300 px-3 text-sm text-gray-500">+88</span>
                        <input type="tel" inputMode="numeric" maxLength={11} autoComplete="tel-national" placeholder="01XXXXXXXXX"
                          value={form.phone} onChange={(e) => setField('phone', e.target.value.replace(/\D/g, '').slice(0, 11))}
                          onBlur={() => validate('phone')}
                          className="w-full min-w-0 bg-transparent px-3.5 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400" />
                      </div>
                    </Field>
                    <Field label="Email" optional error={errors.email}>
                      <input type="email" autoComplete="email" placeholder="you@example.com" value={form.email}
                        onChange={(e) => setField('email', e.target.value)} onBlur={() => validate('email')}
                        className={inputCls(!!errors.email)} />
                    </Field>
                  </div>
                </CheckoutCard>

                <CheckoutCard step={2} title="Delivery address">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
                    <Field label="District" required error={errors.district}>
                      <SearchableSelect value={form.district} options={DISTRICTS} placeholder="Select district"
                        invalid={!!errors.district}
                        onChange={(v) => {
                          setForm((f) => ({ ...f, district: v, thana: '' }))
                          setErrors((e) => ({ ...e, district: undefined, thana: undefined }))
                        }} />
                    </Field>
                    <Field label="Thana / Upazila" required error={errors.thana}>
                      <SearchableSelect value={form.thana} options={thanas} invalid={!!errors.thana}
                        disabled={!form.district || thanasLoading}
                        placeholder={!form.district ? 'Select a district first' : thanasLoading ? 'Loading…' : 'Select a thana'}
                        emptyText={thanas.length ? undefined : 'No thanas found for this district'}
                        onChange={(v) => setField('thana', v)} />
                    </Field>
                    <Field label="Area" required error={errors.area} className="sm:col-span-2">
                      <input value={form.area} placeholder="e.g. Mirpur 10, Dhanmondi 27" onChange={(e) => setField('area', e.target.value)}
                        onBlur={() => validate('area')} className={inputCls(!!errors.area)} />
                    </Field>
                    <Field label="Full address" required error={errors.address} className="sm:col-span-2">
                      <textarea rows={3} autoComplete="street-address" placeholder="House no., road no., building, floor, landmark…"
                        value={form.address} onChange={(e) => setField('address', e.target.value)} onBlur={() => validate('address')}
                        className={`${inputCls(!!errors.address)} resize-none`} />
                    </Field>
                    <Field label="Special instructions" optional className="sm:col-span-2">
                      <input value={form.note} placeholder="e.g. Deliver in the afternoon" onChange={(e) => setField('note', e.target.value)}
                        className={inputCls(false)} />
                    </Field>
                  </div>
                </CheckoutCard>

                <CheckoutCard step={3} title="Payment method">
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#dc143c] bg-[#dc143c]/10 px-4 py-3 text-sm sm:max-w-xs">
                    <input type="radio" name="payment" checked readOnly className="accent-[#dc143c]" />
                    Cash on delivery
                  </label>
                  <p className="mt-2 text-xs text-gray-500">Pay when you receive the product.</p>
                </CheckoutCard>
              </div>

              <aside className="min-w-0 lg:sticky lg:top-6 lg:self-start">
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                  <h3 className="mb-2 text-base font-semibold text-gray-900">Order summary</h3>
                  {lines.length || trialLines.length ? (
                    <ul className="divide-y divide-gray-200">
                      {lines.map((l) => (
                        <li key={keyOf(l.product.id, l.variant?.id)} className="flex items-center gap-3 py-3">
                          <div className="size-14 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                            {l.product.images[0] && <img src={l.product.images[0]} alt="" className="h-full w-full object-cover" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900">{l.product.name}</p>
                            {l.variant && <p className="text-xs text-gray-400">{l.variant.label}</p>}
                            <div className="mt-1.5 inline-flex items-center rounded-full border border-gray-200">
                              <button
                                type="button"
                                onClick={() => change(l.product.id, l.variant?.id, -1)}
                                aria-label={`Decrease ${l.product.name} quantity`}
                                className="flex size-7 items-center justify-center rounded-full text-gray-700 hover:bg-gray-100"
                              >
                                <Minus className="size-3.5" />
                              </button>
                              <span className="min-w-6 text-center text-sm font-semibold tabular-nums">{bn(l.qty)}</span>
                              <button
                                type="button"
                                onClick={() => change(l.product.id, l.variant?.id, 1)}
                                aria-label={`Increase ${l.product.name} quantity`}
                                className="flex size-7 items-center justify-center rounded-full text-gray-700 hover:bg-gray-100"
                              >
                                <Plus className="size-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-2">
                            <p className="text-sm font-medium text-gray-900">{taka(l.unitPrice * l.qty)}</p>
                            <button
                              type="button"
                              onClick={() => removeLine(l.product.id, l.variant?.id)}
                              aria-label={`Remove ${l.product.name}`}
                              className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="size-3.5" /> Remove
                            </button>
                          </div>
                        </li>
                      ))}
                      {trialLines.map(({ product: p, qty: q }) => (
                        <li key={`trial:${p.id}`} className="flex items-center gap-3 py-3">
                          <div className="size-14 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-rose-50" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900">{p.name}</p>
                            <p className="text-xs text-gray-400">{trial!.name}</p>
                            <div className="mt-1.5 inline-flex items-center rounded-full border border-gray-200">
                              <button
                                type="button"
                                onClick={() => stepTrial(p.id, -1)}
                                aria-label={`Decrease ${p.name} quantity`}
                                className="flex size-7 items-center justify-center rounded-full text-gray-700 hover:bg-gray-100"
                              >
                                <Minus className="size-3.5" />
                              </button>
                              <span className="min-w-6 text-center text-sm font-semibold tabular-nums">{bn(q)}</span>
                              <button
                                type="button"
                                onClick={() => stepTrial(p.id, 1)}
                                aria-label={`Increase ${p.name} quantity`}
                                className="flex size-7 items-center justify-center rounded-full text-gray-700 hover:bg-gray-100"
                              >
                                <Plus className="size-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-2">
                            <p className="text-sm font-medium text-gray-900">{taka(p.unitPrice * q)}</p>
                            <button
                              type="button"
                              onClick={() => removeTrialLine(p.id)}
                              aria-label={`Remove ${p.name}`}
                              className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="size-3.5" /> Remove
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="py-3 text-sm text-gray-500">No products selected yet.</p>
                  )}

                  <dl className="mt-4 space-y-2 border-t border-gray-200 pt-4 text-sm">
                    <div className="flex justify-between"><dt className="text-gray-500">Subtotal</dt><dd>{taka(subtotal)}</dd></div>
                    {tier && (
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Combo discount ({bn(tier.off)}%)</dt>
                        <dd className="text-emerald-600">−{taka(discount)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <dt className="text-gray-500">
                        Delivery charge{' '}
                        {form.district && <span className="text-xs text-gray-400">({ZONE_LABEL[zone]})</span>}
                      </dt>
                      <dd>{count ? (addressKnown ? taka(shipping) : <span className="text-gray-500">Added after you choose your area</span>) : '—'}</dd>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-3 text-base font-semibold">
                      <dt>Grand total</dt><dd className="text-[#b80f31]">{taka(total)}</dd>
                    </div>
                  </dl>

                  <Turnstile ref={captchaRef} onToken={setCaptcha} />

                  <button type="submit" disabled={submitting || (!!TURNSTILE_SITE_KEY && !captcha)}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#dc143c] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#b80f31] focus:outline-none focus:ring-2 focus:ring-[#dc143c]/50 disabled:cursor-not-allowed disabled:opacity-60">
                    {submitting && <Loader2 className="size-4 animate-spin" />}
                    {submitting ? 'Placing order…' : `Confirm order — ${taka(total)}`}
                  </button>
                  <p className="mt-3 text-center text-xs text-gray-400">By placing an order you agree to our terms.</p>
                </div>
              </aside>
            </form>
          </div>
        </section>
      </main>

      {/* Fixed bottom bar: discount-tier progress + jump to checkout */}
      <div className="offer-font fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white shadow-[0_-8px_24px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <p className="truncate text-xs text-foreground sm:text-sm">
            {next ? (
              <>
                Add <b className="text-rose-600">{taka(next.min - comboSubtotal)}</b> more to get{' '}
                <b className="rounded bg-emerald-100 px-1 text-emerald-700">{bn(next.off)}% off</b>
                {tier && <> · you now get <b className="text-emerald-600">{bn(tier.off)}%</b></>}
              </>
            ) : (
              <>🎉 You get the maximum <b className="rounded bg-emerald-100 px-1 text-emerald-700">{bn(topTier.off)}% off</b>!</>
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
                {bn(count)} {count === 1 ? 'item' : 'items'}
                {discount > 0 && <span className="ml-1.5 font-semibold text-emerald-600">You save {taka(discount)}</span>}
              </p>
              {/* Product price only (after the discount); delivery is shown separately and added in the checkout summary */}
              <p className="text-xl font-bold text-rose-600">
                {taka(subtotal - discount)}
                {discount > 0 && <s className="ml-1.5 text-sm font-normal text-gray-600">{taka(subtotal)}</s>}
                {count > 0 && (
                  <span className="ml-2 text-xs font-normal text-gray-600">
                    {addressKnown ? `+ ${taka(shipping)} delivery` : '+ delivery (added at checkout)'}
                  </span>
                )}
              </p>
            </div>
            <Button onClick={goCheckout} className="h-11 rounded-full px-6">
              Checkout <ArrowRight />
            </Button>
          </div>
        </div>
      </div>

      <OfferCart
        lines={cartLines}
        count={count}
        subtotal={subtotal}
        discount={discount}
        discountPercent={tier?.off}
        shipping={shipping}
        addressKnown={addressKnown}
        total={total}
        onCheckout={goCheckout}
      />

      <VariantDialog product={variantFor} onOpenChange={(o) => !o && setVariantFor(null)} qtyOf={qtyOf} change={change} />
      <QuickViewDialog product={quickView} onOpenChange={(o) => !o && setQuickView(null)} qtyOf={qtyOf} change={change} />
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
        {optional && <span className="text-xs font-normal text-gray-400">(optional)</span>}
      </label>
      {children}
      {error && <p data-error className="mt-1 text-xs text-[#b80f31]">{error}</p>}
    </div>
  )
}
