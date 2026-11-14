import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ProductArtIcon } from '@/components/icons/ArtIcons'
import { catBg } from '@/data/products'
import { DISTRICT_NAMES } from '@/data/districts'

const normalizeName = (s: string) => s.toLowerCase().replace(/[^a-zঀ-৿]/g, '')
// Returns the option that matches `value` ignoring case/spacing, or `value` unchanged
const matchOption = (options: readonly string[], value: string) =>
  options.find((o) => normalizeName(o) === normalizeName(value)) ?? value
import { useThanas } from '@/lib/useThanas'
import LocationSelect from '@/components/checkout/LocationSelect'
import { useCart } from '@/context/CartContext'
import { ApiError } from '@/lib/api/client'
import { getCoupon } from '@/lib/api/catalog'
import { checkPhone, createOrder, type NewOrderPayload, type OrderAddress } from '@/lib/api/orders'
import { fetchCheckoutDetails, fetchMyPromo, getCustomerToken } from '@/lib/api/customer-auth'
import {
  comboSubtotal,
  couponDiscount,
  groupOfferTotals,
  hasFreeDelivery,
  isComboOnlyCoupon,
  deliveryFee,
  isValidEmail,
  isValidPhone,
  normalizePhone,
  saveLastOrder,
  toEnDigits,
  type Coupon,
} from '@/lib/checkout'
import { bn, taka } from '@/lib/bn'
import { navigate } from '@/lib/router'
import { getFbIdentifiers, pixelTrack } from '@/lib/pixel'
import { productKeyOf, trackProductEvents, type ProductEventType } from '@/lib/api/productEvents'
import { getCheckoutSessionId, resetCheckoutSession, saveCheckoutLead, type CheckoutLeadPayload } from '@/lib/api/checkoutLeads'
import { L } from '@/lib/i18n'
// Orders above this subtotal are taken on WhatsApp (the backend caps website orders at the same amount)
const ORDER_LIMIT = 3000

// Shared field styling — tighter and consistent on mobile
const fieldClass = (err?: string) =>
  `w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 ${
    err ? 'border-destructive' : 'border-input'
  }`

const labelClass = 'mb-1.5 block text-xs font-semibold text-foreground'

function Field({
  label,
  error,
  required,
  htmlFor,
  className = '',
  children,
}: {
  label: string
  error?: string
  required?: boolean
  htmlFor?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={className}>
      <label className={labelClass} htmlFor={htmlFor}>
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs font-medium text-destructive">{error}</p>}
    </div>
  )
}

// Delivery tiers shown as auto-highlighted cards — mirrors deliveryFee() in lib/checkout
const DELIVERY_TIERS = [
  { label: L('Inside Dhaka', 'ঢাকা সিটির ভেতরে'), time: L('Within 1–2 days', '১–২ দিনের মধ্যে'), fee: 70 },
  { label: L('Dhaka Suburbs & Nearby', 'ঢাকার পার্শ্ববর্তী এলাকা'), time: L('Within 2–3 days', '২–৩ দিনের মধ্যে'), fee: 90 },
  { label: L('Outside Dhaka', 'ঢাকার বাইরে'), time: L('Within 2–3 days', '২–৩ দিনের মধ্যে'), fee: 120 },
]

export function CheckoutPage() {
  const { cart, count, subtotal, clear } = useCart()
  const lines = Object.values(cart)

  const [form, setForm] = useState({ fullName: '', phone: '', email: '', address: '', district: '', thana: '', notes: '' })
  const [sameAsBilling, setSameAsBilling] = useState(true)
  const [ship, setShip] = useState({ fullName: '', phone: '', address: '', district: '', thana: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)

  const [couponInput, setCouponInput] = useState('')
  const [coupon, setCoupon] = useState<Coupon | null>(null)
  const [couponError, setCouponError] = useState('')
  const [applying, setApplying] = useState(false)
  // New customer free delivery (dashboard Promo): the minimum order when this logged-in customer qualifies
  const [newUserFreeMin, setNewUserFreeMin] = useState<number | null>(null)
  useEffect(() => {
    let cancelled = false
    fetchMyPromo().then((p) => !cancelled && setNewUserFreeMin(p?.newUserFreeDelivery ? p.newUserFreeDelivery.minOrderAmount : null))
    return () => {
      cancelled = true
    }
  }, [])

  // Logged-in customer: pre-fill from their latest order; never overwrite what they've already typed
  useEffect(() => {
    let cancelled = false
    fetchCheckoutDetails().then((d) => {
      if (cancelled || !d) return
      const b = d.billing
      setForm((f) => ({
        ...f,
        fullName: f.fullName || b.fullName,
        phone: f.phone || b.phone,
        email: f.email || b.email,
        ...(f.address || f.district ? {} : { address: b.address, district: b.district, thana: b.thana }),
      }))
      const s = d.shipping
      if (s && (s.address !== b.address || s.district !== b.district || s.thana !== b.thana || s.fullName !== b.fullName || s.phone !== b.phone)) {
        setSameAsBilling(false)
        setShip((cur) => (cur.address || cur.district ? cur : { ...s }))
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const thanas = useThanas(form.district)
  const shipThanas = useThanas(sameAsBilling ? '' : ship.district)

  // Pre-filled district/thana must equal a dropdown option exactly, or the selects show blank;
  // snap saved values onto the matching option (ignoring case and spacing)
  useEffect(() => {
    const fixDistrict = (d: string) => (d ? matchOption(DISTRICT_NAMES, d) : d)
    setForm((f) => (f.district && fixDistrict(f.district) !== f.district ? { ...f, district: fixDistrict(f.district) } : f))
    setShip((s) => (s.district && fixDistrict(s.district) !== s.district ? { ...s, district: fixDistrict(s.district) } : s))
  }, [form.district, ship.district])
  useEffect(() => {
    if (form.thana && thanas.length && !thanas.includes(form.thana)) {
      const m = matchOption(thanas, form.thana)
      if (m !== form.thana) setForm((f) => ({ ...f, thana: m }))
    }
  }, [thanas, form.thana])
  useEffect(() => {
    if (ship.thana && shipThanas.length && !shipThanas.includes(ship.thana)) {
      const m = matchOption(shipThanas, ship.thana)
      if (m !== ship.thana) setShip((s) => ({ ...s, thana: m }))
    }
  }, [shipThanas, ship.thana])
  const set = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value, ...(key === 'district' ? { thana: '' } : {}) }))
    setErrors((e) => ({ ...e, [key]: '', ...(key === 'district' ? { thana: '' } : {}) }))
  }

  const setShipField = (key: keyof typeof ship, value: string) => {
    setShip((f) => ({ ...f, [key]: value, ...(key === 'district' ? { thana: '' } : {}) }))
    setErrors((e) => ({ ...e, [`ship_${key}`]: '', ...(key === 'district' ? { ship_thana: '' } : {}) }))
  }

  // One funnel row per product in the cart, like the shop sends
  const productEventLines = (eventType: ProductEventType) =>
    lines.map(({ product, qty }) => ({
      eventType,
      productKey: productKeyOf(product),
      productName: product.apiName ?? product.name,
      quantity: qty,
      value: product.price * qty,
    }))

  const checkoutTracked = useRef(false)
  const initiateData = useRef<Record<string, unknown> | undefined>(undefined)
  useEffect(() => {
    if (count === 0 || checkoutTracked.current) return
    checkoutTracked.current = true
    const data = {
      content_ids: lines.map((l) => l.product.did ?? l.product.slug ?? String(l.product.id)),
      contents: lines.map((l) => ({ id: l.product.did ?? l.product.slug ?? String(l.product.id), quantity: l.qty, item_price: l.product.price })),
      content_type: 'product',
      num_items: count,
      value: subtotal,
      currency: 'BDT',
    }
    initiateData.current = data
    // Same event id the server sends once a phone number is known, so Meta merges the pair
    pixelTrack('InitiateCheckout', data, `ic_${getCheckoutSessionId()}`)
    trackProductEvents(productEventLines('checkout'))
  }, [count, lines, subtotal])

  // Orders above this subtotal are taken on WhatsApp (same cap the backend enforces)
  const isOverLimit = subtotal > ORDER_LIMIT
  const whatsappOrderHref = `https://wa.me/8801600905774?text=${encodeURIComponent(
    [
      'Hello Surokkha, আমি অর্ডার করতে চাই:',
      ...lines.map(({ product, qty }) => `- ${product.apiName ?? product.name} x ${qty}`),
      `মোট: ৳${subtotal}`,
      form.fullName ? `নাম: ${form.fullName}` : '',
      form.phone ? `মোবাইল: ${form.phone}` : '',
      form.address ? `ঠিকানা: ${[form.address, form.thana, form.district].filter(Boolean).join(', ')}` : '',
    ].filter(Boolean).join('\n'),
  )}`

  // Keep what the customer has typed so far (abandoned checkout capture); debounced, and flushed when they leave
  const leadRef = useRef<() => CheckoutLeadPayload>(() => ({ fullName: '', phone: '', email: '', address: '', district: '', thana: '', cartTotal: 0, items: [] }))
  leadRef.current = () => ({
    fullName: form.fullName,
    phone: form.phone,
    email: form.email,
    address: form.address,
    district: form.district,
    thana: form.thana,
    cartTotal: Math.max(0, subtotal),
    items: lines.map(({ product, qty }) => ({
      slug: product.slug ?? String(product.id),
      name: product.apiName ?? product.name,
      quantity: qty,
      unitPrice: product.price,
    })),
    customData: initiateData.current,
    ...getFbIdentifiers(),
  })
  const leadSig = JSON.stringify([form.fullName, form.phone, form.email, form.address, form.district, form.thana, subtotal, lines.map((l) => `${l.product.id}:${l.qty}`).join(',')])
  useEffect(() => {
    if (submittingRef.current || (!form.phone && !form.fullName && !form.email)) return
    const timer = setTimeout(() => {
      if (!submittingRef.current) saveCheckoutLead(leadRef.current())
    }, 1200)
    return () => clearTimeout(timer)
  }, [leadSig])
  useEffect(() => {
    const flush = () => {
      if (submittingRef.current) return
      const lead = leadRef.current()
      if (lead.items.length > 0 && (lead.phone || lead.fullName || lead.email)) saveCheckoutLead(lead, true)
    }
    window.addEventListener('pagehide', flush)
    return () => window.removeEventListener('pagehide', flush)
  }, [])

  // An empty cart has nothing to check out
  useEffect(() => {
    if (count === 0 && !submittingRef.current) navigate('/', { replace: true })
  }, [count])

  const totals = useMemo(() => {
    const dest = sameAsBilling ? form : ship
    const baseFee = count > 0 ? deliveryFee(dest.district, dest.thana) : 0
    const { discount: couponOff, fee: couponFee } = couponDiscount(coupon, subtotal, baseFee, lines)
    const newUserFree = newUserFreeMin != null && subtotal >= newUserFreeMin && count > 0
    const offerFree = hasFreeDelivery(lines) || newUserFree
    const fee = offerFree ? 0 : couponFee
    const group = groupOfferTotals(lines)
    const discount = couponOff + group.discount
    return { fee, baseFee, offerFree, newUserFree, discount, groupDiscount: group.discount, groupShort: group.short, total: Math.max(0, subtotal + fee - discount) }
  }, [count, sameAsBilling, form, ship, coupon, subtotal, cart, newUserFreeMin])

  const freeShipping = coupon?.discountType === 'free_shipping' || totals.offerFree
  const destDistrict = (sameAsBilling ? form.district : ship.district).trim()

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase()
    if (!code) return setCouponError(L('Enter a coupon code.', 'কুপন কোড লিখুন।'))
    setApplying(true)
    setCouponError('')
    try {
      const res = await getCoupon<{ data?: Coupon }>(code)
      const found = res.data
      const now = new Date()
      if (!found || !found.active) throw new Error(L('This coupon is invalid or inactive.', 'এই কুপনটি সঠিক নয় বা সক্রিয় নেই।'))
      if (found.validFrom && now < new Date(found.validFrom)) throw new Error(L('This coupon offer has not started yet.', 'এই কুপন অফার এখনো শুরু হয়নি।'))
      if (found.validTo && now > new Date(found.validTo)) throw new Error(L('This coupon has expired.', 'এই কুপনের মেয়াদ শেষ হয়ে গেছে।'))
      if (subtotal < Number(found.minOrderAmount || 0))
        throw new Error(L(`This coupon needs a minimum order of ${taka(Number(found.minOrderAmount))}.`, `এই কুপনের জন্য সর্বনিম্ন ${taka(Number(found.minOrderAmount))} টাকার অর্ডার প্রয়োজন।`))
      if (isComboOnlyCoupon(code) && comboSubtotal(lines) <= 0)
        throw new Error(L('This coupon applies only to combo products. Add a combo to your cart.', 'এই কুপন শুধু কম্বো প্রোডাক্টে প্রযোজ্য। কার্টে একটি কম্বো যোগ করুন।'))
      setCoupon({ ...found, code })
      toast.success(L(`Coupon "${code}" applied`, `কুপন "${code}" প্রয়োগ করা হয়েছে`))
    } catch (err) {
      setCoupon(null)
      setCouponError(err instanceof ApiError ? L('This coupon code is invalid or expired.', 'এই কুপন কোডটি সঠিক নয় বা মেয়াদ শেষ।') : (err as Error).message)
    } finally {
      setApplying(false)
    }
  }

  const validate = () => {
    const next: Record<string, string> = {}
    if (!form.fullName.trim()) next.fullName = L('Enter your name', 'আপনার নাম লিখুন')
    if (!isValidPhone(form.phone)) next.phone = L('Enter a valid mobile number (e.g. 01XXXXXXXXX)', '১১ ডিজিটের সঠিক মোবাইল নম্বর দিন (যেমন: 01XXXXXXXXX)')
    // Email is optional at checkout
    if (form.email.trim() && !isValidEmail(form.email)) next.email = L('Enter a valid email', 'সঠিক ইমেইল লিখুন')
    if (form.address.trim().length < 5) next.address = L('Enter your full address with house, road and area', 'বাড়ি, রোড ও এলাকাসহ পূর্ণ ঠিকানা লিখুন')
    if (!form.district) next.district = L('Select a district', 'জেলা নির্বাচন করুন')
    else if (thanas.length > 0 && !thanas.includes(form.thana)) next.thana = L('Select a thana / upazila', 'থানা / উপজেলা নির্বাচন করুন')
    if (!sameAsBilling) {
      if (!ship.fullName.trim()) next.ship_fullName = L('Enter the recipient name', 'প্রাপকের নাম লিখুন')
      if (!isValidPhone(ship.phone)) next.ship_phone = L('Enter a valid recipient mobile number', 'প্রাপকের সঠিক মোবাইল নম্বর দিন')
      if (ship.address.trim().length < 5) next.ship_address = L('Enter the recipient full address', 'প্রাপকের পূর্ণ ঠিকানা লিখুন')
      if (!ship.district) next.ship_district = L('Select a district', 'জেলা নির্বাচন করুন')
      else if (shipThanas.length > 0 && !shipThanas.includes(ship.thana)) next.ship_thana = L('Select a thana / upazila', 'থানা / উপজেলা নির্বাচন করুন')
    }
    setErrors(next)
    return next
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submittingRef.current) return
    const found = validate()
    if (Object.keys(found).length > 0) {
      toast.error(Object.values(found)[0])
      return
    }
    if (totals.groupShort)
      return toast.error(L(`${totals.groupShort.rule.name} needs at least ${taka(totals.groupShort.rule.minOrderAmount)} in pieces. Add more or remove it from your cart.`, `${totals.groupShort.rule.name}-এর জন্য কমপক্ষে ${taka(totals.groupShort.rule.minOrderAmount)} মূল্যের পিস প্রয়োজন। আরও যোগ করুন বা কার্ট থেকে মুছে ফেলুন।`))
    if (!agreed) return toast.error(L('Please accept the terms to continue', 'অর্ডার করতে বয়স ১৮+ ও শর্তাবলীতে সম্মতি প্রদান করুন।'))

    submittingRef.current = true
    setSubmitting(true)
    try {
      const phone = normalizePhone(form.phone)
      // Blocked only by phone or email (fake-order / spam list), never by IP
      const flagged = await checkPhone(phone.slice(-10)).catch(() => null)
      if (flagged?.isFake) {
        const msg = flagged.message || L('Please use a different valid phone number.', 'অনুগ্রহ করে অন্য একটি সঠিক মোবাইল নম্বর ব্যবহার করুন।')
        setErrors({ phone: msg })
        throw new Error(msg)
      }
      const email = form.email.trim().toLowerCase()
      if (email) {
        const flaggedEmail = await checkPhone('', email).catch(() => null)
        if (flaggedEmail?.isFake) {
          const msg = flaggedEmail.message || L('Please use a different email.', 'অনুগ্রহ করে অন্য একটি ইমেইল ব্যবহার করুন।')
          setErrors({ email: msg })
          throw new Error(msg)
        }
      }

      const district = form.district.trim()
      const billing: OrderAddress = {
        fullName: form.fullName.trim(),
        phone,
        email: form.email.trim(),
        address: form.address.trim(),
        city: district,
        thana: form.thana.trim(),
        district,
        state: district,
        division: district,
        zip: '',
      }
      const payload: NewOrderPayload = {
        billingInfo: billing,
        shippingInfo: sameAsBilling
          ? null
          : {
              fullName: ship.fullName.trim(),
              phone: normalizePhone(ship.phone),
              address: ship.address.trim(),
              city: ship.district,
              thana: ship.thana.trim(),
              district: ship.district,
              state: ship.district,
              division: ship.district,
              zip: '',
            },
        shipToDifferentAddress: !sameAsBilling,
        orderPrefix: 'ST',
        orderNotes: form.notes.trim(),
        paymentMethod: 'cod',
        giftWrap: false,
        subtotal,
        shippingFee: totals.fee,
        shippingTotalAmount: totals.fee,
        tax: 0,
        discountTotalAmount: totals.discount,
        couponCode: coupon ? coupon.code : null,
        // Only claimed when no other offer already made delivery free
        promo: totals.newUserFree && !hasFreeDelivery(lines) ? 'new-user-free-delivery' : undefined,
        total: totals.total,
        items: lines.map(({ product, qty }) => ({
          productId: product.itemType === 'item' ? undefined : product.apiId,
          itemId: product.itemType === 'item' ? product.apiId : undefined,
          productDid: product.did ?? product.slug,
          itemType: product.itemType === 'item' ? 'item' : 'product',
          name: product.apiName ?? product.name,
          image: product.image,
          quantity: qty,
          unitPrice: product.price,
          size: product.groupOffer ? `Group Offer: ${product.groupOffer.name}` : 'Standard Pack',
        })),
        paymentDetails: null,
        timestamp: new Date().toISOString(),
        checkoutSessionId: getCheckoutSessionId(),
        ...getFbIdentifiers(),
      }

      const res = await createOrder(payload, payload.promo ? getCustomerToken() : null)
      saveLastOrder({
        orderNumber: String(res.data?.orderNumber ?? ''),
        name: sameAsBilling ? billing.fullName : ship.fullName.trim(),
        phone: sameAsBilling ? billing.phone : normalizePhone(ship.phone),
        address: sameAsBilling ? billing.address : ship.address.trim(),
        district: sameAsBilling ? billing.district : ship.district,
        thana: sameAsBilling ? billing.thana : ship.thana.trim(),
        items: lines.map(({ product, qty }) => ({ name: product.name, qty, price: product.price })),
        subtotal,
        shipping: totals.fee,
        discount: totals.discount,
        total: totals.total,
      })
      const orderNumber = String(res.data?.orderNumber ?? '')
      pixelTrack(
        'Purchase',
        {
          content_ids: lines.map((l) => l.product.did ?? l.product.slug ?? String(l.product.id)),
          content_type: 'product',
          num_items: count,
          value: totals.total,
          currency: 'BDT',
        },
        orderNumber || undefined,
      )
      trackProductEvents(productEventLines('purchase'))
      resetCheckoutSession()
      clear()
      navigate('/order-confirmed', { replace: true })
    } catch (err) {
      submittingRef.current = false
      setSubmitting(false)
      const body = err instanceof ApiError ? (err.body as { code?: string; message?: string } | null) : null
      if (body?.code === 'CONTACT_REQUIRED') {
        toast.error(L('Sorry, this order cannot be placed online. Please contact us.', 'দুঃখিত, এই অর্ডারটি অনলাইনে করা যাচ্ছে না। অনুগ্রহ করে আমাদের সাথে যোগাযোগ করুন।'))
      } else {
        toast.error(err instanceof Error ? err.message : L('Could not place the order. Please try again.', 'অর্ডার সম্পন্ন করা যায়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।'))
      }
    }
  }

  if (count === 0) return null

  return (
    <div id="checkout" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:py-10 lg:px-8">
      <div className="mb-6 border-b border-border pb-5">
        <h1 className="font-display text-2xl font-bold md:text-3xl">{L('Checkout', 'চেকআউট')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{L('Fill in your delivery details — pay cash on delivery when the package arrives.', 'ডেলিভারির জন্য আপনার সঠিক তথ্য দিন — পার্সেল হাতে পেয়ে মূল্য পরিশোধ করুন।')}</p>
      </div>

      <form onSubmit={submit} noValidate className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        {/* Left: delivery details */}
        <div className="space-y-6 lg:col-span-7">
          <div className="space-y-5 rounded-3xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="font-display text-lg font-bold">{L('Delivery details', 'ডেলিভারি তথ্য')}</h2>
              <span className="rounded-md bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">{L('Step 1', 'ধাপ ১')}</span>
            </div>

            <Field label={L('Your name', 'আপনার নাম')} required error={errors.fullName} htmlFor="fullName">
              <input
                id="fullName"
                className={fieldClass(errors.fullName)}
                value={form.fullName}
                onChange={(e) => set('fullName', e.target.value)}
                autoComplete="name"
                placeholder={L('Full name', 'পূর্ণ নাম')}
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={L('Mobile number', 'মোবাইল নম্বর')} required error={errors.phone} htmlFor="phone">
                <input
                  id="phone"
                  className={`${fieldClass(errors.phone)} font-mono`}
                  value={form.phone}
                  onChange={(e) => set('phone', toEnDigits(e.target.value))}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="01XXXXXXXXX"
                />
              </Field>
              <Field label={L('Email (optional)', 'ইমেইল (ঐচ্ছিক)')} error={errors.email} htmlFor="email">
                <input
                  id="email"
                  type="email"
                  className={fieldClass(errors.email)}
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </Field>
            </div>

            <Field label={L('Full address', 'বিস্তারিত ঠিকানা')} required error={errors.address} htmlFor="address">
              <textarea
                id="address"
                rows={2}
                className={`${fieldClass(errors.address)} resize-y`}
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                autoComplete="street-address"
                placeholder={L('House, road, area', 'বাড়ি, রোড, এলাকা')}
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={L('District', 'জেলা')} required error={errors.district} htmlFor="billingDistrict">
                <LocationSelect
                  id="billingDistrict"
                  value={form.district}
                  options={DISTRICT_NAMES}
                  onSelect={(name) => set('district', name)}
                  placeholder={L('Select a district', 'জেলা নির্বাচন করুন')}
                  error={errors.district}
                />
              </Field>
              <Field label={L('Thana / Upazila', 'থানা / উপজেলা')} required error={errors.thana} htmlFor="billingThana">
                <LocationSelect
                  id="billingThana"
                  value={form.thana}
                  options={thanas}
                  disabled={!form.district}
                  onSelect={(name) => set('thana', name)}
                  placeholder={form.district ? L('Select a thana', 'থানা নির্বাচন করুন') : L('Select a district first', 'আগে জেলা নির্বাচন করুন')}
                  error={errors.thana}
                />
              </Field>
            </div>

            <Field label={L('Order note (optional)', 'অর্ডার নোট (ঐচ্ছিক)')} htmlFor="notes">
              <textarea
                id="notes"
                rows={2}
                className={`${fieldClass()} resize-y`}
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                placeholder={L('Anything we should know about your order?', 'অর্ডার সম্পর্কে বিশেষ কোনো নির্দেশনা থাকলে লিখুন')}
              />
            </Field>

            <div className="border-t border-border pt-4">
              <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm font-medium">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={!sameAsBilling}
                  onChange={(e) => setSameAsBilling(!e.target.checked)}
                />
                {L('Deliver to a different address', 'ভিন্ন কোনো ঠিকানায় ডেলিভারি চান?')}
              </label>
            </div>

            {!sameAsBilling && (
              <div className="space-y-5 rounded-2xl border border-border bg-secondary/30 p-4 sm:p-5">
                <h3 className="flex items-center gap-2 font-semibold">🚚 {L('Recipient details', 'প্রাপকের বিবরণ')}</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label={L('Recipient name', 'প্রাপকের নাম')} required error={errors.ship_fullName} htmlFor="shipFullName">
                    <input
                      id="shipFullName"
                      className={fieldClass(errors.ship_fullName)}
                      value={ship.fullName}
                      onChange={(e) => setShipField('fullName', e.target.value)}
                      placeholder={L('Full name', 'পূর্ণ নাম')}
                    />
                  </Field>
                  <Field label={L('Recipient mobile', 'প্রাপকের মোবাইল নম্বর')} required error={errors.ship_phone} htmlFor="shipPhone">
                    <input
                      id="shipPhone"
                      className={`${fieldClass(errors.ship_phone)} font-mono`}
                      value={ship.phone}
                      onChange={(e) => setShipField('phone', toEnDigits(e.target.value))}
                      inputMode="tel"
                      placeholder="01XXXXXXXXX"
                    />
                  </Field>
                  <Field label={L('District', 'জেলা')} required error={errors.ship_district} htmlFor="shipDistrict">
                    <LocationSelect
                      id="shipDistrict"
                      value={ship.district}
                      options={DISTRICT_NAMES}
                      onSelect={(name) => setShipField('district', name)}
                      placeholder={L('Select a district', 'জেলা নির্বাচন করুন')}
                      error={errors.ship_district}
                    />
                  </Field>
                  <Field label={L('Thana / Upazila', 'থানা / উপজেলা')} required error={errors.ship_thana} htmlFor="shipThana">
                    <LocationSelect
                      id="shipThana"
                      value={ship.thana}
                      options={shipThanas}
                      disabled={!ship.district}
                      onSelect={(name) => setShipField('thana', name)}
                      placeholder={ship.district ? L('Select a thana', 'থানা নির্বাচন করুন') : L('Select a district first', 'আগে জেলা নির্বাচন করুন')}
                      error={errors.ship_thana}
                    />
                  </Field>
                </div>
                <Field label={L('Recipient full address', 'প্রাপকের বিস্তারিত ঠিকানা')} required error={errors.ship_address} htmlFor="shipAddress">
                  <textarea
                    id="shipAddress"
                    rows={2}
                    className={`${fieldClass(errors.ship_address)} resize-y`}
                    value={ship.address}
                    onChange={(e) => setShipField('address', e.target.value)}
                    placeholder={L('House, road, area', 'বাড়ি, রোড, এলাকা')}
                  />
                </Field>
              </div>
            )}
          </div>

          {/* Delivery charge tiers — auto-calculated from the selected location */}
          <div className="space-y-3 rounded-3xl border border-border bg-secondary/20 p-5">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <h3 className="flex items-center gap-1.5 text-sm font-bold">📦 {L('Delivery charge', 'ডেলিভারি চার্জ')}</h3>
              <span className="text-xs text-muted-foreground">{L('Auto-calculated', 'স্বয়ংক্রিয় নির্ধারিত')}</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {DELIVERY_TIERS.map((tier) => {
                const active = totals.baseFee === tier.fee && !!destDistrict
                return (
                  <div
                    key={tier.fee}
                    className={`flex items-center justify-between rounded-2xl border p-3 transition ${
                      active ? 'border-primary bg-accent/40 font-semibold text-foreground shadow-xs' : 'border-border bg-card text-muted-foreground opacity-70'
                    }`}
                  >
                    <div>
                      <span className="block text-xs font-bold">{tier.label}</span>
                      <span className="text-[10px] text-muted-foreground">{tier.time}</span>
                    </div>
                    {freeShipping && active ? (
                      <span className="font-mono text-xs font-bold text-emerald-600">
                        <span className="mr-1 text-[10px] font-normal text-muted-foreground line-through">{taka(tier.fee)}</span>
                        {L('FREE', 'ফ্রি')}
                      </span>
                    ) : (
                      <span className="font-mono text-xs font-bold">{taka(tier.fee)}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right: payment + order summary */}
        <div className="space-y-6 lg:col-span-5">
          <div className="space-y-4 rounded-3xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider">{L('Payment method', 'পেমেন্ট পদ্ধতি')}</h2>
              <span className="rounded-md bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">{L('Verified', 'যাচাইকৃত')}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border-2 border-primary bg-accent/30 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">✓</div>
                <div>
                  <span className="block text-sm font-bold">{L('Cash on Delivery', 'ক্যাশ অন ডেলিভারি')}</span>
                  <span className="text-[11px] text-muted-foreground">{L('Pay when you receive the product', 'পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন')}</span>
                </div>
              </div>
              <span className="rounded bg-secondary px-2 py-0.5 text-xs font-bold text-secondary-foreground">{L('Primary', 'প্রধান')}</span>
            </div>
          </div>

          <aside className="space-y-4 rounded-3xl border border-border bg-card p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold">{L('Order summary', 'অর্ডার সামারি')}</h2>
            <ul className="max-h-60 space-y-3 overflow-y-auto pr-1">
              {lines.map(({ product, qty }) => (
                <li key={product.id} className="flex items-center gap-3">
                  {product.image ? (
                    <img src={product.image} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <div className={`h-14 w-14 shrink-0 rounded-xl p-2 ${catBg[product.cat]}`}>
                      <ProductArtIcon art={product.art} c1={product.c1} c2={product.c2} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {taka(product.price)} × {bn(qty)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold">{taka(product.price * qty)}</span>
                </li>
              ))}
            </ul>

            <div>
              <div className="flex gap-2">
                <input
                  className={`${fieldClass()} flex-1 uppercase`}
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (!coupon) applyCoupon()
                    }
                  }}
                  placeholder={L('Coupon code', 'কুপন কোড')}
                  disabled={!!coupon}
                />
                {coupon ? (
                  <Button type="button" variant="outline" onClick={() => { setCoupon(null); setCouponInput('') }}>
                    {L('Remove', 'মুছুন')}
                  </Button>
                ) : (
                  <Button type="button" variant="outline" onClick={applyCoupon} disabled={applying}>
                    {applying ? '...' : L('Apply', 'প্রয়োগ করুন')}
                  </Button>
                )}
              </div>
              {couponError && <p className="mt-1 text-xs text-destructive">{couponError}</p>}
            </div>

            <dl className="space-y-1.5 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{L('Subtotal', 'সাবটোটাল')}</dt>
                <dd>{taka(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  {L('Delivery charge', 'ডেলিভারি চার্জ')}{destDistrict ? ` · ${destDistrict}` : ''}
                  {totals.newUserFree && !hasFreeDelivery(lines) && <span className="block text-xs text-emerald-600">{L('New customer offer', 'নতুন গ্রাহক অফার')}</span>}
                  {newUserFreeMin != null && !totals.newUserFree && (
                    <span className="block text-xs text-emerald-600">{L(`Add ${taka(newUserFreeMin - subtotal)} more for free delivery`, `ফ্রি ডেলিভারির জন্য আরও ${taka(newUserFreeMin - subtotal)} টাকার পণ্য যোগ করুন`)}</span>
                  )}
                </dt>
                <dd>
                  {freeShipping ? (
                    <span className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground line-through">{taka(totals.baseFee)}</span>
                      <span className="font-semibold text-emerald-600">{L('Free', 'ফ্রি')}</span>
                    </span>
                  ) : totals.fee ? (
                    taka(totals.fee)
                  ) : (
                    L('Free', 'ফ্রি')
                  )}
                </dd>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-primary">
                  <dt>{L('Discount', 'ছাড়')}</dt>
                  <dd>−{taka(totals.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                <dt>{L('Total', 'সর্বমোট')}</dt>
                <dd>{taka(totals.total)}</dd>
              </div>
            </dl>

            {/* Terms */}
            <div className="space-y-2 rounded-2xl border border-border bg-secondary/30 p-3.5">
              <div className="flex items-center gap-2 text-sm font-bold">📋 {L('Terms & Conditions', 'শর্তাবলী')}</div>
              <ol className="list-decimal space-y-1.5 pl-5 text-xs leading-relaxed text-muted-foreground">
                <li>{L('Please check the product before paying the delivery man. Once received, the product cannot be returned.', 'ডেলিভারিম্যানকে টাকা দেওয়ার আগে পণ্য দেখে নিন। গ্রহণ করার পর পণ্য ফেরত নেওয়া হবে না।')}</li>
                <li>{L('Products sold loose (not as a full sealed pack) are not eligible for return.', 'খুচরা বিক্রিত পণ্য (সম্পূর্ণ সিল করা প্যাক নয়) ফেরতযোগ্য নয়।')}</li>
                <li>{L('Your package is shipped fully discreetly.', 'আপনার পার্সেল সম্পূর্ণ গোপনীয়ভাবে পাঠানো হয়।')}</li>
              </ol>
            </div>

            <label className="flex cursor-pointer select-none items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1 h-4 w-4 accent-primary" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
              <span>{L('I agree to the terms and refund policy, and I am 18 or older.', 'আমি নিশ্চিত করছি আমার বয়স ১৮ বছর বা তার বেশি এবং আমি শর্তাবলী ও রিফান্ড পলিসি মেনে নিচ্ছি।')}</span>
            </label>

            {/* Above the order limit the order goes through WhatsApp instead of the website */}
            {isOverLimit ? (
              <>
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                  {L(`Orders above ${taka(ORDER_LIMIT)} are taken on WhatsApp. Tap below to send your order details.`, `${taka(ORDER_LIMIT)}-এর বেশি মূল্যের অর্ডার হোয়াটসঅ্যাপে নেওয়া হয়। অর্ডারের তথ্য পাঠাতে নিচে চাপুন।`)}
                </p>
                <a
                  href={whatsappOrderHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 w-full items-center justify-center rounded-full bg-[#25D366] text-base font-semibold text-white hover:opacity-90"
                >
                  {L('Order on WhatsApp', 'হোয়াটসঅ্যাপে অর্ডার করুন')}
                </a>
              </>
            ) : (
              <Button type="submit" size="lg" className="h-12 w-full rounded-full text-base" disabled={submitting}>
                {submitting ? L('Placing order...', 'অর্ডার প্রক্রিয়াধীন...') : `${L('Confirm order', 'অর্ডার কনফার্ম করুন')} · ${taka(totals.total)}`}
              </Button>
            )}
          </aside>
        </div>
      </form>
    </div>
  )
}
