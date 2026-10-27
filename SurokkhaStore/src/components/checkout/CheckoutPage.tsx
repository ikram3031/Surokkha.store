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
  couponDiscount,
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

const selectClass =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 aria-invalid:border-destructive'

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

  // An empty cart has nothing to check out
  useEffect(() => {
    if (count === 0 && !submittingRef.current) navigate('/', { replace: true })
  }, [count])

  const totals = useMemo(() => {
    const dest = sameAsBilling ? form : ship
    const baseFee = count > 0 ? deliveryFee(dest.district, dest.thana) : 0
    const { discount, fee } = couponDiscount(coupon, subtotal, baseFee)
    return { fee, baseFee, discount, total: Math.max(0, subtotal + fee - discount) }
  }, [count, sameAsBilling, form, ship, coupon, subtotal])

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase()
    if (!code) return setCouponError('কুপন কোড লিখুন।')
    setApplying(true)
    setCouponError('')
    try {
      const res = await getCoupon<{ data?: Coupon }>(code)
      const found = res.data
      const now = new Date()
      if (!found || !found.active) throw new Error('কুপনটি সঠিক নয় বা সক্রিয় নয়।')
      if (found.validFrom && now < new Date(found.validFrom)) throw new Error('কুপনের অফারটি এখনো শুরু হয়নি।')
      if (found.validTo && now > new Date(found.validTo)) throw new Error('কুপনের মেয়াদ শেষ হয়ে গেছে।')
      if (subtotal < Number(found.minOrderAmount || 0))
        throw new Error(`এই কুপনের জন্য সর্বনিম্ন ${taka(Number(found.minOrderAmount))} টাকার অর্ডার প্রয়োজন।`)
      setCoupon({ ...found, code })
      toast(`কুপন "${code}" প্রয়োগ হয়েছে`)
    } catch (err) {
      setCoupon(null)
      setCouponError(err instanceof ApiError ? 'কুপন কোডটি সঠিক নয় বা মেয়াদ শেষ।' : (err as Error).message)
    } finally {
      setApplying(false)
    }
  }

  const validate = () => {
    const next: Record<string, string> = {}
    if (!form.fullName.trim()) next.fullName = 'নাম লিখুন'
    if (!isValidPhone(form.phone)) next.phone = 'সঠিক মোবাইল নম্বর দিন (যেমন 01XXXXXXXXX)'
    if (!form.email.trim()) next.email = 'ইমেইল লিখুন'
    else if (!isValidEmail(form.email)) next.email = 'সঠিক ইমেইল দিন'
    if (form.address.trim().length < 5) next.address = 'বাসা, রোড ও এলাকাসহ পূর্ণ ঠিকানা লিখুন'
    if (!form.district) next.district = 'জেলা নির্বাচন করুন'
    else if (thanas.length > 0 && !thanas.includes(form.thana)) next.thana = 'থানা / উপজেলা নির্বাচন করুন'
    if (!sameAsBilling) {
      if (!ship.fullName.trim()) next.ship_fullName = 'প্রাপকের নাম লিখুন'
      if (!isValidPhone(ship.phone)) next.ship_phone = 'প্রাপকের সঠিক মোবাইল নম্বর দিন'
      if (ship.address.trim().length < 5) next.ship_address = 'প্রাপকের পূর্ণ ঠিকানা লিখুন'
      if (!ship.district) next.ship_district = 'জেলা নির্বাচন করুন'
      else if (shipThanas.length > 0 && !shipThanas.includes(ship.thana)) next.ship_thana = 'থানা / উপজেলা নির্বাচন করুন'
    }
    setErrors(next)
    return next
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submittingRef.current) return
    const found = validate()
    if (Object.keys(found).length > 0) {
      toast(Object.values(found)[0])
      return
    }
    if (!agreed) return toast('শর্তাবলীতে সম্মতি দিন')

    submittingRef.current = true
    setSubmitting(true)
    try {
      const phone = normalizePhone(form.phone)
      const flagged = await checkPhone(phone.slice(-10)).catch(() => null)
      if (flagged?.isFake) {
        setErrors({ phone: 'অনুগ্রহ করে অন্য একটি বৈধ ফোন নম্বর ব্যবহার করুন।' })
        throw new Error('অনুগ্রহ করে অন্য একটি বৈধ ফোন নম্বর ব্যবহার করুন।')
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
          productId: product.apiId,
          productDid: product.did ?? product.slug,
          itemType: 'product',
          name: product.apiName ?? product.name,
          image: product.image,
          quantity: qty,
          unitPrice: product.price,
          size: 'Standard Pack',
        })),
        paymentDetails: null,
        timestamp: new Date().toISOString(),
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
      clear()
      navigate('/order-confirmed', { replace: true })
    } catch (err) {
      submittingRef.current = false
      setSubmitting(false)
      const body = err instanceof ApiError ? (err.body as { code?: string; message?: string } | null) : null
      if (body?.code === 'CONTACT_REQUIRED') {
        toast('দুঃখিত, অনলাইনে এই অর্ডার করা যাচ্ছে না। অনুগ্রহ করে আমাদের সাথে যোগাযোগ করুন।')
      } else {
        toast(err instanceof Error ? err.message : 'অর্ডার সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।')
      }
    }
  }

  if (count === 0) return null

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <h1 className="font-display text-2xl font-bold md:text-3xl">চেকআউট</h1>
      <form onSubmit={submit} noValidate className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4 rounded-3xl border border-border bg-card p-5 md:p-6">
          <h2 className="font-display text-lg font-bold">ডেলিভারির তথ্য</h2>
          <Field label="আপনার নাম" error={errors.fullName}>
            <Input value={form.fullName} onChange={(e) => set('fullName', e.target.value)} autoComplete="name" aria-invalid={!!errors.fullName} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="মোবাইল নম্বর" error={errors.phone}>
              <Input
                value={form.phone}
                onChange={(e) => set('phone', toEnDigits(e.target.value))}
                inputMode="tel"
                autoComplete="tel"
                placeholder="01XXXXXXXXX"
                aria-invalid={!!errors.phone}
              />
            </Field>
            <Field label="ইমেইল" error={errors.email}>
              <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" aria-invalid={!!errors.email} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="জেলা" error={errors.district}>
              <select className={selectClass} value={form.district} onChange={(e) => set('district', e.target.value)} aria-invalid={!!errors.district}>
                <option value="">জেলা নির্বাচন করুন</option>
                {DISTRICT_NAMES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="থানা / উপজেলা" error={errors.thana}>
              <select className={selectClass} value={form.thana} onChange={(e) => set('thana', e.target.value)} disabled={!form.district} aria-invalid={!!errors.thana}>
                <option value="">{form.district ? 'থানা নির্বাচন করুন' : 'আগে জেলা নির্বাচন করুন'}</option>
                {thanas.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="পূর্ণ ঠিকানা" error={errors.address}>
            <Input value={form.address} onChange={(e) => set('address', e.target.value)} autoComplete="street-address" placeholder="বাসা, রোড, এলাকা" aria-invalid={!!errors.address} />
          </Field>
          <Field label="অর্ডার নোট (ঐচ্ছিক)">
            <Input value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </Field>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={!sameAsBilling} onChange={(e) => setSameAsBilling(!e.target.checked)} />
            অন্য ঠিকানায় ডেলিভারি দিন
          </label>
          {!sameAsBilling && (
            <div className="space-y-4 rounded-2xl border border-border p-4">
              <h3 className="font-semibold">প্রাপকের তথ্য</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="প্রাপকের নাম" error={errors.ship_fullName}>
                  <Input value={ship.fullName} onChange={(e) => setShipField('fullName', e.target.value)} aria-invalid={!!errors.ship_fullName} />
                </Field>
                <Field label="প্রাপকের মোবাইল" error={errors.ship_phone}>
                  <Input value={ship.phone} onChange={(e) => setShipField('phone', toEnDigits(e.target.value))} inputMode="tel" placeholder="01XXXXXXXXX" aria-invalid={!!errors.ship_phone} />
                </Field>
                <Field label="জেলা" error={errors.ship_district}>
                  <select className={selectClass} value={ship.district} onChange={(e) => setShipField('district', e.target.value)} aria-invalid={!!errors.ship_district}>
                    <option value="">জেলা নির্বাচন করুন</option>
                    {DISTRICT_NAMES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="থানা / উপজেলা" error={errors.ship_thana}>
                  <select className={selectClass} value={ship.thana} onChange={(e) => setShipField('thana', e.target.value)} disabled={!ship.district} aria-invalid={!!errors.ship_thana}>
                    <option value="">{ship.district ? 'থানা নির্বাচন করুন' : 'আগে জেলা নির্বাচন করুন'}</option>
                    {shipThanas.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="প্রাপকের পূর্ণ ঠিকানা" error={errors.ship_address}>
                <Input value={ship.address} onChange={(e) => setShipField('address', e.target.value)} placeholder="বাসা, রোড, এলাকা" aria-invalid={!!errors.ship_address} />
              </Field>
            </div>
          )}
          <p className="rounded-xl bg-secondary px-4 py-3 text-sm">পেমেন্ট: ক্যাশ অন ডেলিভারি — পণ্য হাতে পেয়ে টাকা দিন। প্যাকেজ সম্পূর্ণ গোপনীয়ভাবে পাঠানো হয়।</p>
        </div>

        <aside className="h-fit space-y-4 rounded-3xl border border-border bg-card p-5 md:p-6">
          <h2 className="font-display text-lg font-bold">অর্ডার সারাংশ</h2>
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
              <Input value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="কুপন কোড" disabled={!!coupon} />
              {coupon ? (
                <Button type="button" variant="outline" onClick={() => { setCoupon(null); setCouponInput('') }}>
                  মুছুন
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={applyCoupon} disabled={applying}>
                  {applying ? '...' : 'প্রয়োগ'}
                </Button>
              )}
            </div>
            {couponError && <p className="mt-1 text-xs text-destructive">{couponError}</p>}
          </div>

          <dl className="space-y-1 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">সাবটোটাল</dt>
              <dd>{taka(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">ডেলিভারি চার্জ</dt>
              <dd>{totals.fee ? taka(totals.fee) : 'ফ্রি'}</dd>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between text-primary">
                <dt>ছাড়</dt>
                <dd>−{taka(totals.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
              <dt>মোট</dt>
              <dd>{taka(totals.total)}</dd>
            </div>
          </dl>

          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span>আমি শর্তাবলী ও রিফান্ড নীতিতে সম্মত এবং আমার বয়স ১৮ বা তার বেশি।</span>
          </label>

          <Button type="submit" size="lg" className="h-12 w-full rounded-full text-base" disabled={submitting}>
            {submitting ? 'অর্ডার হচ্ছে...' : `অর্ডার কনফার্ম করুন · ${taka(totals.total)}`}
          </Button>
        </aside>
      </form>
    </div>
  )
}
