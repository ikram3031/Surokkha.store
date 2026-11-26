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
import LocationSelect from '@/components/checkout/LocationSelect'
import { useCart } from '@/context/CartContext'
import { ApiError } from '@/lib/api/client'
import { getCoupon } from '@/lib/api/catalog'
import { checkPhone, createOrder, type NewOrderPayload, type OrderAddress } from '@/lib/api/orders'
import { fetchCheckoutDetails, getCustomerToken } from '@/lib/api/customer-auth'
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
import { getFbIdentifiers, pixelTrack, setPixelUserData } from '@/lib/pixel'
import { productKeyOf, trackProductEvents, type ProductEventType } from '@/lib/api/productEvents'
import { getCheckoutSessionId, resetCheckoutSession, saveCheckoutLead, type CheckoutLeadPayload } from '@/lib/api/checkoutLeads'
import { L } from '@/lib/i18n'
// Orders above this subtotal are taken on WhatsApp (the backend caps website orders at the same amount)

// Shared field styling — tighter and consistent on mobile
const fieldClass = (err?: string) =>
  `w-full rounded-xl border bg-background px-4 py-2.5 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 ${
    err ? 'border-destructive' : 'border-input'
  }`

const labelClass = 'mb-1.5 block text-sm font-semibold text-foreground'

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
      {error && <p className="mt-1 text-sm font-medium text-destructive">{error}</p>}
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
  const [sameAsBilling] = useState(true)
  const [ship, setShip] = useState({ fullName: '', phone: '', address: '', district: '', thana: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [agreed, setAgreed] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const phoneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const emailTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [couponInput, setCouponInput] = useState('')
  const [coupon, setCoupon] = useState<Coupon | null>(null)
  const [couponError, setCouponError] = useState('')
  const [applying, setApplying] = useState(false)
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
    })
    return () => {
      cancelled = true
    }
  }, [])


  // Pre-filled district/thana must equal a dropdown option exactly, or the selects show blank;
  // snap saved values onto the matching option (ignoring case and spacing)
  useEffect(() => {
    const fixDistrict = (d: string) => (d ? matchOption(DISTRICT_NAMES, d) : d)
    setForm((f) => (f.district && fixDistrict(f.district) !== f.district ? { ...f, district: fixDistrict(f.district) } : f))
    setShip((s) => (s.district && fixDistrict(s.district) !== s.district ? { ...s, district: fixDistrict(s.district) } : s))
  }, [form.district, ship.district])
  const set = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: '' }))
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
    const offerFree = hasFreeDelivery(lines)
    const fee = offerFree ? 0 : couponFee
    const group = groupOfferTotals(lines)
    const discount = couponOff + group.discount
    return { fee, baseFee, offerFree, discount, groupDiscount: group.discount, groupShort: group.short, total: Math.max(0, subtotal + fee - discount) }
  }, [count, sameAsBilling, form, ship, coupon, subtotal, cart])

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
    if (form.email.trim() && !isValidEmail(form.email)) next.email = L('Enter a valid email', 'সঠিক ইমেইল লিখুন')
    if (form.address.trim().length < 5) next.address = L('Enter your full address with house, road and area', 'বাড়ি, রোড ও এলাকাসহ পূর্ণ ঠিকানা লিখুন')
    if (!form.district) next.district = L('Select a district', 'জেলা নির্বাচন করুন')
    if (!sameAsBilling) {
      if (!ship.fullName.trim()) next.ship_fullName = L('Enter the recipient name', 'প্রাপকের নাম লিখুন')
      if (!isValidPhone(ship.phone)) next.ship_phone = L('Enter a valid recipient mobile number', 'প্রাপকের সঠিক মোবাইল নম্বর দিন')
      if (ship.address.trim().length < 5) next.ship_address = L('Enter the recipient full address', 'প্রাপকের পূর্ণ ঠিকানা লিখুন')
      if (!ship.district) next.ship_district = L('Select a district', 'জেলা নির্বাচন করুন')
      if (ship.thana.trim().length < 2) next.ship_thana = L('Enter the thana / upazila', 'থানা / উপজেলার নাম লিখুন')
    }
    setErrors(next)
    return next
  }

  const clearError = (key: string) => setErrors((cur) => {
    if (!cur[key]) return cur
    const next = { ...cur }
    delete next[key]
    return next
  })

  const onPhoneChange = (raw: string) => {
    const value = toEnDigits(raw)
    set('phone', value)
    clearError('phone')
    if (phoneTimerRef.current) clearTimeout(phoneTimerRef.current)
    if (!value.trim()) return
    phoneTimerRef.current = setTimeout(async () => {
      if (!isValidPhone(value)) {
        setErrors((cur) => ({ ...cur, phone: L('Enter a valid mobile number (e.g. 01XXXXXXXXX)', '১১ ডিজিটের সঠিক মোবাইল নম্বর দিন (যেমন: 01XXXXXXXXX)') }))
        return
      }
      const flagged = await checkPhone(normalizePhone(value).slice(-10)).catch(() => null)
      if (flagged?.isFake) setErrors((cur) => ({ ...cur, phone: flagged.message || L('Please use a different valid phone number.', 'অনুগ্রহ করে অন্য একটি সঠিক মোবাইল নম্বর ব্যবহার করুন।') }))
    }, 1000)
  }

  const onEmailChange = (value: string) => {
    set('email', value)
    clearError('email')
    if (emailTimerRef.current) clearTimeout(emailTimerRef.current)
    if (!value.trim()) return
    emailTimerRef.current = setTimeout(async () => {
      if (!isValidEmail(value)) {
        setErrors((cur) => ({ ...cur, email: L('Enter a valid email', 'সঠিক ইমেইল লিখুন') }))
        return
      }
      const flagged = await checkPhone('', value.trim().toLowerCase()).catch(() => null)
      if (flagged?.isFake) setErrors((cur) => ({ ...cur, email: flagged.message || L('Please use a different email.', 'অনুগ্রহ করে অন্য একটি ইমেইল ব্যবহার করুন।') }))
    }, 1000)
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
    if (!agreed) return toast.error(L('Please accept the terms to continue', 'অর্ডার করতে শর্তাবলীতে সম্মতি প্রদান করুন।'))

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
        paymentMethod: 'Cash on Delivery',
        giftWrap: false,
        subtotal,
        shippingFee: totals.fee,
        shippingTotalAmount: totals.fee,
        tax: 0,
        discountTotalAmount: totals.discount,
        couponCode: coupon ? coupon.code : null,
        // Only claimed when no other offer already made delivery free
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
      setPixelUserData(billing)
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
        <p className="mt-1 text-base text-foreground/75">{L('Fill in your delivery details — pay cash on delivery when the package arrives.', 'ডেলিভারির জন্য আপনার সঠিক তথ্য দিন — পার্সেল হাতে পেয়ে মূল্য পরিশোধ করুন।')}</p>
      </div>

      <form onSubmit={submit} noValidate className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        {/* Left: delivery details */}
        <div className="space-y-6 lg:col-span-7">
          <div className="space-y-5 rounded-3xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="font-display text-xl font-bold">{L('Delivery details', 'ডেলিভারি তথ্য')}</h2>
              <span className="rounded-md bg-secondary px-2.5 py-1 text-sm font-semibold text-secondary-foreground">{L('Step 1', 'ধাপ ১')}</span>
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
                  onChange={(e) => onPhoneChange(e.target.value)}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="01XXXXXXXXX"
                />
              </Field>
              <Field label={`${L('Email', 'ইমেইল')} ${L('(optional)', '(ঐচ্ছিক)')}`} error={errors.email} htmlFor="email">
                <input
                  id="email"
                  type="email"
                  className={fieldClass(errors.email)}
                  value={form.email}
                  onChange={(e) => onEmailChange(e.target.value)}
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
              <Field label={`${L('Thana / Upazila', 'থানা / উপজেলা')} ${L('(optional)', '(ঐচ্ছিক)')}`} error={errors.thana} htmlFor="billingThana">
                <input
                  id="billingThana"
                  className={fieldClass(errors.thana)}
                  value={form.thana}
                  onChange={(e) => set('thana', e.target.value)}
                  autoComplete="address-level3"
                  placeholder={L('e.g. Mirpur, Savar', 'যেমন: মিরপুর, সাভার')}
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

          </div>

          {/* Delivery charge tiers — auto-calculated from the selected location */}
          <div className="space-y-3 rounded-3xl border border-border bg-secondary/20 p-5">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <h3 className="flex items-center gap-1.5 text-base font-bold">📦 {L('Delivery charge', 'ডেলিভারি চার্জ')}</h3>
              <span className="text-sm text-foreground/75">{L('Auto-calculated', 'স্বয়ংক্রিয় নির্ধারিত')}</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {DELIVERY_TIERS.map((tier) => {
                const active = totals.baseFee === tier.fee && !!destDistrict
                return (
                  <div
                    key={tier.fee}
                    className={`flex items-center justify-between rounded-2xl border p-3 transition ${
                      active ? 'border-primary bg-accent/40 font-semibold text-foreground shadow-xs' : 'border-border bg-card text-foreground/75 opacity-70'
                    }`}
                  >
                    <div>
                      <span className="block text-sm font-bold">{tier.label}</span>
                      <span className="text-xs text-foreground/75">{tier.time}</span>
                    </div>
                    {freeShipping && active ? (
                      <span className="font-mono text-sm font-bold text-emerald-600">
                        <span className="mr-1 text-xs font-normal text-foreground/75 line-through">{taka(tier.fee)}</span>
                        {L('FREE', 'ফ্রি')}
                      </span>
                    ) : (
                      <span className="font-mono text-sm font-bold">{taka(tier.fee)}</span>
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
              <h2 className="text-base font-bold uppercase tracking-wider">{L('Payment method', 'পেমেন্ট পদ্ধতি')}</h2>
              <span className="rounded-md bg-emerald-50 px-2.5 py-0.5 text-sm font-semibold text-emerald-700">{L('Verified', 'যাচাইকৃত')}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border-2 border-primary bg-accent/30 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">✓</div>
                <div>
                  <span className="block text-base font-bold">{L('Cash on Delivery', 'ক্যাশ অন ডেলিভারি')}</span>
                  <span className="text-sm text-foreground/75">{L('Pay when you receive the product', 'পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন')}</span>
                </div>
              </div>
              <span className="rounded bg-secondary px-2 py-0.5 text-sm font-bold text-secondary-foreground">{L('Primary', 'প্রধান')}</span>
            </div>
          </div>

          <aside className="space-y-4 rounded-3xl border border-border bg-card p-5 sm:p-6">
            <h2 className="font-display text-xl font-bold">{L('Order summary', 'অর্ডার সামারি')}</h2>
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
                    <p className="truncate text-base font-semibold">{product.name}</p>
                    <p className="text-sm text-foreground/75">
                      {taka(product.price)} × {bn(qty)}
                    </p>
                  </div>
                  <span className="text-base font-semibold">{taka(product.price * qty)}</span>
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
              {couponError && <p className="mt-1 text-sm text-destructive">{couponError}</p>}
            </div>

            <dl className="space-y-1.5 border-t border-border pt-4 text-base">
              <div className="flex justify-between">
                <dt className="text-foreground/75">{L('Subtotal', 'সাবটোটাল')}</dt>
                <dd>{taka(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-foreground/75">
                  {L('Delivery charge', 'ডেলিভারি চার্জ')}{destDistrict ? ` · ${destDistrict}` : ''}
                </dt>
                <dd>
                  {freeShipping ? (
                    <span className="flex items-center gap-1.5">
                      <span className="text-sm text-foreground/75 line-through">{taka(totals.baseFee)}</span>
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
              <div className="flex justify-between border-t border-border pt-2 text-lg font-bold">
                <dt>{L('Total', 'সর্বমোট')}</dt>
                <dd>{taka(totals.total)}</dd>
              </div>
            </dl>

            {/* Terms */}
            <div className="space-y-2 rounded-2xl border border-border bg-secondary/30 p-3.5">
              <div className="flex items-center gap-2 text-base font-bold">📋 {L('Terms & Conditions', 'শর্তাবলী')}</div>
              <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-foreground/75">
                <li>{L('Please check the product before paying the delivery man. Once received, the product cannot be returned.', 'ডেলিভারিম্যানকে টাকা দেওয়ার আগে পণ্য দেখে নিন। গ্রহণ করার পর পণ্য ফেরত নেওয়া হবে না।')}</li>
                <li>{L('Products sold loose (not as a full sealed pack) are not eligible for return.', 'খুচরা বিক্রিত পণ্য (সম্পূর্ণ সিল করা প্যাক নয়) ফেরতযোগ্য নয়।')}</li>
                <li>{L('Your package is sealed and shipped with care.', 'আপনার পার্সেল যত্নসহকারে সিল করে পাঠানো হয়।')}</li>
              </ol>
            </div>

            <label className="flex cursor-pointer select-none items-start gap-3 text-base">
              <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-primary" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
              <span>{L('I agree to the terms and refund policy.', 'আমি নিশ্চিত করছি যে আমি শর্তাবলী ও রিফান্ড পলিসি মেনে নিচ্ছি।')}</span>
            </label>

            <Button type="submit" size="lg" className="h-12 w-full rounded-full text-lg" disabled={submitting}>
              {submitting ? (<span className="flex items-center gap-2"><span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />{L('Placing order...', 'অর্ডার প্রক্রিয়াধীন...')}</span>) : `${L('Confirm order', 'অর্ডার কনফার্ম করুন')} · ${taka(totals.total)}`}
            </Button>
          </aside>
        </div>
      </form>
    </div>
  )
}
