import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ProductArtIcon } from '@/components/icons/ArtIcons'
import { catBg } from '@/data/products'
import { DISTRICT_NAMES, FALLBACK_THANAS } from '@/data/districts'
import LocationSelect from '@/components/checkout/LocationSelect'
import { useCart } from '@/context/CartContext'
import { ApiError } from '@/lib/api/client'
import { getCoupon } from '@/lib/api/catalog'
import { getThanasByDistrict } from '@/lib/api/locations'
import { checkPhone, createOrder, type NewOrderPayload, type OrderAddress } from '@/lib/api/orders'
import { fetchMyPromo, getCustomerToken } from '@/lib/api/customer-auth'
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
  { label: 'Inside Dhaka', time: 'Within 1–2 days', fee: 70 },
  { label: 'Dhaka Suburbs & Nearby', time: 'Within 2–3 days', fee: 90 },
  { label: 'Outside Dhaka', time: 'Within 2–3 days', fee: 120 },
]

// Thana list for a district: live from the API, bundled list as a fallback
const thanaCache: Record<string, string[]> = {}
function useThanas(district: string) {
  const [options, setOptions] = useState<string[]>([])
  useEffect(() => {
    if (!district) {
      setOptions([])
      return
    }
    if (thanaCache[district]) {
      setOptions(thanaCache[district])
      return
    }
    let cancelled = false
    const fallback = FALLBACK_THANAS[district] ?? []
    setOptions(fallback)
    getThanasByDistrict<{ data?: { name: string }[] }>(district)
      .then((res) => {
        const names = (res.data ?? []).map((t) => t.name).filter(Boolean)
        const next = names.length > 0 ? names : fallback
        if (next.length > 0) thanaCache[district] = next
        if (!cancelled) setOptions(next)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [district])
  return options
}

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

  const thanas = useThanas(form.district)
  const shipThanas = useThanas(sameAsBilling ? '' : ship.district)
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
    if (!code) return setCouponError('Enter a coupon code.')
    setApplying(true)
    setCouponError('')
    try {
      const res = await getCoupon<{ data?: Coupon }>(code)
      const found = res.data
      const now = new Date()
      if (!found || !found.active) throw new Error('This coupon is invalid or inactive.')
      if (found.validFrom && now < new Date(found.validFrom)) throw new Error('This coupon offer has not started yet.')
      if (found.validTo && now > new Date(found.validTo)) throw new Error('This coupon has expired.')
      if (subtotal < Number(found.minOrderAmount || 0))
        throw new Error(`This coupon needs a minimum order of ${taka(Number(found.minOrderAmount))}.`)
      if (isComboOnlyCoupon(code) && comboSubtotal(lines) <= 0)
        throw new Error('This coupon applies only to combo products. Add a combo to your cart.')
      setCoupon({ ...found, code })
      toast.success(`Coupon "${code}" applied`)
    } catch (err) {
      setCoupon(null)
      setCouponError(err instanceof ApiError ? 'This coupon code is invalid or expired.' : (err as Error).message)
    } finally {
      setApplying(false)
    }
  }

  const validate = () => {
    const next: Record<string, string> = {}
    if (!form.fullName.trim()) next.fullName = 'Enter your name'
    if (!isValidPhone(form.phone)) next.phone = 'Enter a valid mobile number (e.g. 01XXXXXXXXX)'
    // Email is optional at checkout
    if (form.email.trim() && !isValidEmail(form.email)) next.email = 'Enter a valid email'
    if (form.address.trim().length < 5) next.address = 'Enter your full address with house, road and area'
    if (!form.district) next.district = 'Select a district'
    else if (thanas.length > 0 && !thanas.includes(form.thana)) next.thana = 'Select a thana / upazila'
    if (!sameAsBilling) {
      if (!ship.fullName.trim()) next.ship_fullName = 'Enter the recipient name'
      if (!isValidPhone(ship.phone)) next.ship_phone = 'Enter a valid recipient mobile number'
      if (ship.address.trim().length < 5) next.ship_address = 'Enter the recipient full address'
      if (!ship.district) next.ship_district = 'Select a district'
      else if (shipThanas.length > 0 && !shipThanas.includes(ship.thana)) next.ship_thana = 'Select a thana / upazila'
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
      return toast.error(`${totals.groupShort.rule.name} needs at least ${taka(totals.groupShort.rule.minOrderAmount)} in pieces. Add more or remove it from your cart.`)
    if (!agreed) return toast.error('Please accept the terms to continue')

    submittingRef.current = true
    setSubmitting(true)
    try {
      const phone = normalizePhone(form.phone)
      // Blocked only by phone or email (fake-order / spam list), never by IP
      const flagged = await checkPhone(phone.slice(-10)).catch(() => null)
      if (flagged?.isFake) {
        const msg = flagged.message || 'Please use a different valid phone number.'
        setErrors({ phone: msg })
        throw new Error(msg)
      }
      const email = form.email.trim().toLowerCase()
      if (email) {
        const flaggedEmail = await checkPhone('', email).catch(() => null)
        if (flaggedEmail?.isFake) {
          const msg = flaggedEmail.message || 'Please use a different email.'
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
        toast.error('Sorry, this order cannot be placed online. Please contact us.')
      } else {
        toast.error(err instanceof Error ? err.message : 'Could not place the order. Please try again.')
      }
    }
  }

  if (count === 0) return null

  return (
    <div id="checkout" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:py-10 lg:px-8">
      <div className="mb-6 border-b border-border pb-5">
        <h1 className="font-display text-2xl font-bold md:text-3xl">Checkout</h1>
        <p className="mt-1 text-sm text-muted-foreground">Fill in your delivery details — pay cash on delivery when the package arrives.</p>
      </div>

      <form onSubmit={submit} noValidate className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        {/* Left: delivery details */}
        <div className="space-y-6 lg:col-span-7">
          <div className="space-y-5 rounded-3xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="font-display text-lg font-bold">Delivery details</h2>
              <span className="rounded-md bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">Step 1</span>
            </div>

            <Field label="Your name" required error={errors.fullName} htmlFor="fullName">
              <input
                id="fullName"
                className={fieldClass(errors.fullName)}
                value={form.fullName}
                onChange={(e) => set('fullName', e.target.value)}
                autoComplete="name"
                placeholder="Full name"
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Mobile number" required error={errors.phone} htmlFor="phone">
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
              <Field label="Email (optional)" error={errors.email} htmlFor="email">
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

            <Field label="Full address" required error={errors.address} htmlFor="address">
              <textarea
                id="address"
                rows={2}
                className={`${fieldClass(errors.address)} resize-y`}
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                autoComplete="street-address"
                placeholder="House, road, area"
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="District" required error={errors.district} htmlFor="billingDistrict">
                <LocationSelect
                  id="billingDistrict"
                  value={form.district}
                  options={DISTRICT_NAMES}
                  onSelect={(name) => set('district', name)}
                  placeholder="Select a district"
                  error={errors.district}
                />
              </Field>
              <Field label="Thana / Upazila" required error={errors.thana} htmlFor="billingThana">
                <LocationSelect
                  id="billingThana"
                  value={form.thana}
                  options={thanas}
                  disabled={!form.district}
                  onSelect={(name) => set('thana', name)}
                  placeholder={form.district ? 'Select a thana' : 'Select a district first'}
                  error={errors.thana}
                />
              </Field>
            </div>

            <Field label="Order note (optional)" htmlFor="notes">
              <textarea
                id="notes"
                rows={2}
                className={`${fieldClass()} resize-y`}
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                placeholder="Anything we should know about your order?"
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
                Deliver to a different address
              </label>
            </div>

            {!sameAsBilling && (
              <div className="space-y-5 rounded-2xl border border-border bg-secondary/30 p-4 sm:p-5">
                <h3 className="flex items-center gap-2 font-semibold">🚚 Recipient details</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Recipient name" required error={errors.ship_fullName} htmlFor="shipFullName">
                    <input
                      id="shipFullName"
                      className={fieldClass(errors.ship_fullName)}
                      value={ship.fullName}
                      onChange={(e) => setShipField('fullName', e.target.value)}
                      placeholder="Full name"
                    />
                  </Field>
                  <Field label="Recipient mobile" required error={errors.ship_phone} htmlFor="shipPhone">
                    <input
                      id="shipPhone"
                      className={`${fieldClass(errors.ship_phone)} font-mono`}
                      value={ship.phone}
                      onChange={(e) => setShipField('phone', toEnDigits(e.target.value))}
                      inputMode="tel"
                      placeholder="01XXXXXXXXX"
                    />
                  </Field>
                  <Field label="District" required error={errors.ship_district} htmlFor="shipDistrict">
                    <LocationSelect
                      id="shipDistrict"
                      value={ship.district}
                      options={DISTRICT_NAMES}
                      onSelect={(name) => setShipField('district', name)}
                      placeholder="Select a district"
                      error={errors.ship_district}
                    />
                  </Field>
                  <Field label="Thana / Upazila" required error={errors.ship_thana} htmlFor="shipThana">
                    <LocationSelect
                      id="shipThana"
                      value={ship.thana}
                      options={shipThanas}
                      disabled={!ship.district}
                      onSelect={(name) => setShipField('thana', name)}
                      placeholder={ship.district ? 'Select a thana' : 'Select a district first'}
                      error={errors.ship_thana}
                    />
                  </Field>
                </div>
                <Field label="Recipient full address" required error={errors.ship_address} htmlFor="shipAddress">
                  <textarea
                    id="shipAddress"
                    rows={2}
                    className={`${fieldClass(errors.ship_address)} resize-y`}
                    value={ship.address}
                    onChange={(e) => setShipField('address', e.target.value)}
                    placeholder="House, road, area"
                  />
                </Field>
              </div>
            )}
          </div>

          {/* Delivery charge tiers — auto-calculated from the selected location */}
          <div className="space-y-3 rounded-3xl border border-border bg-secondary/20 p-5">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <h3 className="flex items-center gap-1.5 text-sm font-bold">📦 Delivery charge</h3>
              <span className="text-xs text-muted-foreground">Auto-calculated</span>
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
                        FREE
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
              <h2 className="text-sm font-bold uppercase tracking-wider">Payment method</h2>
              <span className="rounded-md bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">Verified</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border-2 border-primary bg-accent/30 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">✓</div>
                <div>
                  <span className="block text-sm font-bold">Cash on Delivery</span>
                  <span className="text-[11px] text-muted-foreground">Pay when you receive the product</span>
                </div>
              </div>
              <span className="rounded bg-secondary px-2 py-0.5 text-xs font-bold text-secondary-foreground">Primary</span>
            </div>
          </div>

          <aside className="space-y-4 rounded-3xl border border-border bg-card p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold">Order summary</h2>
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
                  placeholder="Coupon code"
                  disabled={!!coupon}
                />
                {coupon ? (
                  <Button type="button" variant="outline" onClick={() => { setCoupon(null); setCouponInput('') }}>
                    Remove
                  </Button>
                ) : (
                  <Button type="button" variant="outline" onClick={applyCoupon} disabled={applying}>
                    {applying ? '...' : 'Apply'}
                  </Button>
                )}
              </div>
              {couponError && <p className="mt-1 text-xs text-destructive">{couponError}</p>}
            </div>

            <dl className="space-y-1.5 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{taka(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  Delivery charge{destDistrict ? ` · ${destDistrict}` : ''}
                  {totals.newUserFree && !hasFreeDelivery(lines) && <span className="block text-xs text-emerald-600">New customer offer</span>}
                  {newUserFreeMin != null && !totals.newUserFree && (
                    <span className="block text-xs text-emerald-600">Add {taka(newUserFreeMin - subtotal)} more for free delivery</span>
                  )}
                </dt>
                <dd>
                  {freeShipping ? (
                    <span className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground line-through">{taka(totals.baseFee)}</span>
                      <span className="font-semibold text-emerald-600">Free</span>
                    </span>
                  ) : totals.fee ? (
                    taka(totals.fee)
                  ) : (
                    'Free'
                  )}
                </dd>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-primary">
                  <dt>Discount</dt>
                  <dd>−{taka(totals.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                <dt>Total</dt>
                <dd>{taka(totals.total)}</dd>
              </div>
            </dl>

            {/* Terms */}
            <div className="space-y-2 rounded-2xl border border-border bg-secondary/30 p-3.5">
              <div className="flex items-center gap-2 text-sm font-bold">📋 Terms &amp; Conditions</div>
              <ol className="list-decimal space-y-1.5 pl-5 text-xs leading-relaxed text-muted-foreground">
                <li>Please check the product before paying the delivery man. Once received, the product cannot be returned.</li>
                <li>Products sold loose (not as a full sealed pack) are not eligible for return.</li>
                <li>Your package is shipped fully discreetly.</li>
              </ol>
            </div>

            <label className="flex cursor-pointer select-none items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1 h-4 w-4 accent-primary" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
              <span>I agree to the terms and refund policy, and I am 18 or older.</span>
            </label>

            {/* Above the order limit the order goes through WhatsApp instead of the website */}
            {isOverLimit ? (
              <>
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                  Orders above {taka(ORDER_LIMIT)} are taken on WhatsApp. Tap below to send your order details.
                </p>
                <a
                  href={whatsappOrderHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 w-full items-center justify-center rounded-full bg-[#25D366] text-base font-semibold text-white hover:opacity-90"
                >
                  Order on WhatsApp
                </a>
              </>
            ) : (
              <Button type="submit" size="lg" className="h-12 w-full rounded-full text-base" disabled={submitting}>
                {submitting ? 'Placing order...' : `Confirm order · ${taka(totals.total)}`}
              </Button>
            )}
          </aside>
        </div>
      </form>
    </div>
  )
}
