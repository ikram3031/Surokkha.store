import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProductArtIcon } from '@/components/icons/ArtIcons'
import { catBg } from '@/data/products'
import { DISTRICT_NAMES, FALLBACK_THANAS } from '@/data/districts'
import { useCart } from '@/context/CartContext'
import { ApiError } from '@/lib/api/client'
import { getCoupon } from '@/lib/api/catalog'
import { getThanasByDistrict } from '@/lib/api/locations'
import { checkPhone, createOrder, type NewOrderPayload, type OrderAddress } from '@/lib/api/orders'
import {
  comboSubtotal,
  couponDiscount,
  groupOfferTotals,
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

const selectClass =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-primary disabled:opacity-50 aria-invalid:border-destructive'

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error && <span className="block text-xs text-destructive">{error}</span>}
    </label>
  )
}

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

  const thanas = useThanas(form.district)
  const shipThanas = useThanas(sameAsBilling ? '' : ship.district)
  const set = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value, ...(key === 'district' ? { thana: '' } : {}) }))
    setErrors((e) => ({ ...e, [key]: '' }))
  }

  const setShipField = (key: keyof typeof ship, value: string) => {
    setShip((f) => ({ ...f, [key]: value, ...(key === 'district' ? { thana: '' } : {}) }))
    setErrors((e) => ({ ...e, [`ship_${key}`]: '' }))
  }

  const checkoutTracked = useRef(false)
  useEffect(() => {
    if (count === 0 || checkoutTracked.current) return
    checkoutTracked.current = true
    pixelTrack('InitiateCheckout', {
      content_ids: lines.map((l) => l.product.did ?? l.product.slug ?? String(l.product.id)),
      content_type: 'product',
      num_items: count,
      value: subtotal,
      currency: 'BDT',
    })
  }, [count, lines, subtotal])

  // An empty cart has nothing to check out
  useEffect(() => {
    if (count === 0 && !submittingRef.current) navigate('/', { replace: true })
  }, [count])

  const totals = useMemo(() => {
    const dest = sameAsBilling ? form : ship
    const baseFee = count > 0 ? deliveryFee(dest.district, dest.thana) : 0
    const { discount: couponOff, fee } = couponDiscount(coupon, subtotal, baseFee, lines)
    const group = groupOfferTotals(lines)
    const discount = couponOff + group.discount
    return { fee, baseFee, discount, groupDiscount: group.discount, groupShort: group.short, total: Math.max(0, subtotal + fee - discount) }
  }, [count, sameAsBilling, form, ship, coupon, subtotal, cart])

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
    if (!form.email.trim()) next.email = 'Enter your email'
    else if (!isValidEmail(form.email)) next.email = 'Enter a valid email'
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
      const flagged = await checkPhone(phone.slice(-10)).catch(() => null)
      if (flagged?.isFake) {
        setErrors({ phone: 'Please use a different valid phone number.' })
        throw new Error('Please use a different valid phone number.')
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
        ...getFbIdentifiers(),
      }

      const res = await createOrder(payload)
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
    <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
      <h1 className="font-display text-2xl font-bold md:text-3xl">Checkout</h1>
      <form onSubmit={submit} noValidate className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4 rounded-3xl border border-border bg-card p-5 md:p-6">
          <h2 className="font-display text-lg font-bold">Delivery details</h2>
          <Field label="Your name" error={errors.fullName}>
            <Input value={form.fullName} onChange={(e) => set('fullName', e.target.value)} autoComplete="name" aria-invalid={!!errors.fullName} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mobile number" error={errors.phone}>
              <Input
                value={form.phone}
                onChange={(e) => set('phone', toEnDigits(e.target.value))}
                inputMode="tel"
                autoComplete="tel"
                placeholder="01XXXXXXXXX"
                aria-invalid={!!errors.phone}
              />
            </Field>
            <Field label="Email" error={errors.email}>
              <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" aria-invalid={!!errors.email} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="District" error={errors.district}>
              <select className={selectClass} value={form.district} onChange={(e) => set('district', e.target.value)} aria-invalid={!!errors.district}>
                <option value="">Select a district</option>
                {DISTRICT_NAMES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Thana / Upazila" error={errors.thana}>
              <select className={selectClass} value={form.thana} onChange={(e) => set('thana', e.target.value)} disabled={!form.district} aria-invalid={!!errors.thana}>
                <option value="">{form.district ? 'Select a thana' : 'Select a district first'}</option>
                {thanas.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Full address" error={errors.address}>
            <Input value={form.address} onChange={(e) => set('address', e.target.value)} autoComplete="street-address" placeholder="House, road, area" aria-invalid={!!errors.address} />
          </Field>
          <Field label="Order note (optional)">
            <Input value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </Field>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={!sameAsBilling} onChange={(e) => setSameAsBilling(!e.target.checked)} />
            Deliver to a different address
          </label>
          {!sameAsBilling && (
            <div className="space-y-4 rounded-2xl border border-border p-4">
              <h3 className="font-semibold">Recipient details</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Recipient name" error={errors.ship_fullName}>
                  <Input value={ship.fullName} onChange={(e) => setShipField('fullName', e.target.value)} aria-invalid={!!errors.ship_fullName} />
                </Field>
                <Field label="Recipient mobile" error={errors.ship_phone}>
                  <Input value={ship.phone} onChange={(e) => setShipField('phone', toEnDigits(e.target.value))} inputMode="tel" placeholder="01XXXXXXXXX" aria-invalid={!!errors.ship_phone} />
                </Field>
                <Field label="District" error={errors.ship_district}>
                  <select className={selectClass} value={ship.district} onChange={(e) => setShipField('district', e.target.value)} aria-invalid={!!errors.ship_district}>
                    <option value="">Select a district</option>
                    {DISTRICT_NAMES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Thana / Upazila" error={errors.ship_thana}>
                  <select className={selectClass} value={ship.thana} onChange={(e) => setShipField('thana', e.target.value)} disabled={!ship.district} aria-invalid={!!errors.ship_thana}>
                    <option value="">{ship.district ? 'Select a thana' : 'Select a district first'}</option>
                    {shipThanas.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Recipient full address" error={errors.ship_address}>
                <Input value={ship.address} onChange={(e) => setShipField('address', e.target.value)} placeholder="House, road, area" aria-invalid={!!errors.ship_address} />
              </Field>
            </div>
          )}
          <p className="rounded-xl bg-secondary px-4 py-3 text-sm">Payment: cash on delivery — pay when you receive the product. Your package is shipped fully discreetly.</p>
        </div>

        <aside className="h-fit space-y-4 rounded-3xl border border-border bg-card p-5 md:p-6">
          <h2 className="font-display text-lg font-bold">Order summary</h2>
          <ul className="space-y-3">
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
              <Input value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="Coupon code" disabled={!!coupon} />
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

          <dl className="space-y-1 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{taka(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery charge</dt>
              <dd>{totals.fee ? taka(totals.fee) : 'Free'}</dd>
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

          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span>I agree to the terms and refund policy, and I am 18 or older.</span>
          </label>

          <Button type="submit" size="lg" className="h-12 w-full rounded-full text-base" disabled={submitting}>
            {submitting ? 'Placing order...' : `Confirm order · ${taka(totals.total)}`}
          </Button>
        </aside>
      </form>
    </div>
  )
}
