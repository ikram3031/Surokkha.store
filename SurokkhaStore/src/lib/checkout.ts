import type { Order } from '@/lib/api/orders'
import { groupOfferDiscount, type GroupOfferRule } from '@/lib/api/groupOffers'

const BN_TO_EN: Record<string, string> = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' }

export const toEnDigits = (value: string) => value.replace(/[০-৯]/g, (c) => BN_TO_EN[c] ?? c)

/** Normalises a Bangladeshi mobile number to +8801XXXXXXXXX (same rules as SurokkhaShop). */
export function normalizePhone(value: string): string {
  const raw = toEnDigits(value).trim().replace(/[\s\-()]/g, '')
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('8801') && digits.length >= 13) return '+880' + digits.slice(3, 13)
  if (digits.startsWith('01') && digits.length >= 11) return '+88' + digits.slice(0, 11)
  if (digits.startsWith('1') && digits.length === 10) return '+880' + digits
  return raw.startsWith('+') ? '+' + digits : digits
}

export const isValidPhone = (value: string) => /^\+8801[3-9]\d{8}$/.test(normalizePhone(value))

export const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

const DHAKA_SUBURBS = ['savar', 'ashulia', 'dhamrai', 'keraniganj', 'nawabganj', 'dohar']

/** Delivery charge by destination — identical to SurokkhaShop's getCartTotals. */
export function deliveryFee(district: string, thana: string): number {
  const d = district.trim().toLowerCase()
  if (!d) return 70
  if (d === 'dhaka') return DHAKA_SUBURBS.includes(thana.trim().toLowerCase()) ? 90 : 70
  if (d === 'gazipur' || d === 'narayanganj') return 90
  return 120
}

export interface Coupon {
  code: string
  discountType?: 'free_shipping' | 'percentage' | 'fixed' | string
  discountValue?: number
  minOrderAmount?: number
  active?: boolean
  validFrom?: string | null
  validTo?: string | null
}

/** Coupons that only discount ready combos from the Products collection (not "items", not other products). */
export const COMBO_ONLY_COUPONS = ['COMBO20']

export const isComboOnlyCoupon = (code?: string) => COMBO_ONLY_COUPONS.includes(String(code ?? '').toUpperCase())

type CartLine = { product: { price: number; itemType?: string; categorySlugs?: string[]; groupOffer?: GroupOfferRule }; qty: number }

/** Pricing of every Group Offer in the cart: each group is discounted on its own pieces total. */
export function groupOfferTotals(lines: CartLine[]) {
  const groups = new Map<string, { rule: GroupOfferRule; subtotal: number }>()
  for (const { product, qty } of lines) {
    const rule = product.groupOffer
    if (!rule) continue
    const g = groups.get(rule.id) ?? { rule, subtotal: 0 }
    g.subtotal += product.price * qty
    groups.set(rule.id, g)
  }
  const list = [...groups.values()].map((g) => ({ ...g, ...groupOfferDiscount(g.rule, g.subtotal) }))
  return {
    groups: list,
    discount: list.reduce((s, g) => s + g.discount, 0),
    subtotal: list.reduce((s, g) => s + g.subtotal, 0),
    /** First group still under its minimum order amount (blocks checkout) */
    short: list.find((g) => !g.eligible),
  }
}

/** Sum of the cart lines a COMBO20-style coupon applies to: Products-collection items in the "combo" category. */
export function comboSubtotal(lines: CartLine[]) {
  return lines
    .filter(({ product }) => product.itemType !== 'item' && !product.groupOffer && product.categorySlugs?.includes('combo'))
    .reduce((sum, { product, qty }) => sum + product.price * qty, 0)
}

export function couponDiscount(coupon: Coupon | null, subtotal: number, fee: number, lines: CartLine[] = []) {
  if (!coupon || subtotal < Number(coupon.minOrderAmount || 0)) return { discount: 0, fee }
  if (coupon.discountType === 'free_shipping') return { discount: 0, fee: 0 }
  const value = Number(coupon.discountValue || 0)
  // Group Offer pieces already carry their own discount, so coupons never stack on them
  const base = isComboOnlyCoupon(coupon.code) ? comboSubtotal(lines) : subtotal - groupOfferTotals(lines).subtotal
  const raw = coupon.discountType === 'percentage' ? Math.round((base * value) / 100) : value
  return { discount: Math.max(0, Math.min(base, raw)), fee }
}

export interface ConfirmedOrder {
  orderNumber: string
  name: string
  phone: string
  address: string
  district: string
  thana: string
  items: { name: string; qty: number; price: number }[]
  subtotal: number
  shipping: number
  discount: number
  total: number
  serverOrder?: Order
}

const LAST_ORDER_KEY = 'surokkha-last-order'

export function saveLastOrder(order: ConfirmedOrder) {
  try {
    sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order))
  } catch {
    /* storage unavailable — confirmation page falls back to a generic message */
  }
}

export function loadLastOrder(): ConfirmedOrder | null {
  try {
    const raw = sessionStorage.getItem(LAST_ORDER_KEY)
    return raw ? (JSON.parse(raw) as ConfirmedOrder) : null
  } catch {
    return null
  }
}
