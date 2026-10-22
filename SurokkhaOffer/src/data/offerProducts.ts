import type { ProductArt } from '@/components/icons/ArtIcons'
import offerContent from './offer-products.json'

export interface OfferVariant {
  id: string
  label: string
  price: number
  sku: string
  inStock: boolean
}

export interface OfferProduct {
  /** Selection key: the product slug */
  id: string
  apiId: string
  did: string
  entity: 'product' | 'item' | 'custom'
  sku: string
  name: string
  desc: string
  details: string[]
  price: number
  inStock: boolean
  art: ProductArt
  c1: string
  c2: string
  badge?: string
  /** Card and Details slider photos; the drawn art is used when empty */
  images: string[]
  /** Present only on variable products: the card opens the variant picker */
  variants?: OfferVariant[]
  variantLabel?: string
  /** Pre-discount price, shown struck through (ready combos) */
  regularPrice?: number
  /** Shown in the "অথবা আমাদের কম্বো" section */
  readyCombo?: boolean
}

// Page content lives in offer-products.json: the "build your own combo" products now,
// ready-made combos later. Store ids are kept so orders still link to dashboard products.
interface JsonProduct {
  /** Offer product id, e.g. SC01P001; also used as the order line SKU */
  id: string
  type: 'custom'
  sku: string
  name: string
  desc: string
  details: string[]
  inStock: boolean
  images: string[]
  badge?: string
  options: { id: string; name: string; price: number; inStock?: boolean }[]
}

const fromJson = (p: JsonProduct): OfferProduct => ({
  id: p.id,
  apiId: '',
  did: '',
  entity: p.type,
  sku: p.sku,
  name: p.name,
  desc: p.desc,
  details: p.details,
  price: Math.min(...p.options.map((o) => o.price)),
  inStock: p.inStock,
  art: 'box',
  c1: '#F4919F',
  c2: '#C9475F',
  badge: p.badge,
  images: p.images,
  variants: p.options.map((o) => ({ id: o.id, label: o.name, price: o.price, sku: o.id, inStock: o.inStock ?? true })),
  variantLabel: 'অপশন',
})

// Ready combos are custom products too (ids SC01C001…): fixed price, no options, not linked to dashboard products
interface JsonReadyCombo {
  id: string
  type: 'custom'
  sku: string
  name: string
  desc: string
  details: string[]
  price: number
  regularPrice?: number
  inStock: boolean
  images: string[]
  badge?: string
}

const fromReadyJson = (p: JsonReadyCombo): OfferProduct => ({
  id: p.id,
  apiId: '',
  did: '',
  entity: p.type,
  sku: p.sku,
  name: p.name,
  desc: p.desc,
  details: p.details,
  price: p.price,
  regularPrice: p.regularPrice,
  inStock: p.inStock,
  art: 'combo',
  c1: '#F4919F',
  c2: '#C9475F',
  badge: p.badge,
  images: p.images,
  readyCombo: true,
})

const content = offerContent as {
  customCombo: { title: string; products: JsonProduct[] }
  readyCombos: { title: string; products: JsonReadyCombo[] }
}

export const CUSTOM_COMBO_PRODUCTS: OfferProduct[] = content.customCombo.products.map(fromJson)
export const READY_COMBOS: OfferProduct[] = content.readyCombos.products.map(fromReadyJson)
export const READY_COMBOS_TITLE = content.readyCombos.title

export const variantPrice = (p: OfferProduct, v?: OfferVariant) => v?.price ?? p.price

/** Lowest price, shown as "৳X থেকে" on variable products */
export const fromPrice = (p: OfferProduct) => p.price

// Combo discount by subtotal (no free delivery here, delivery is always charged)
export const DISCOUNT_TIERS = [
  { min: 200, off: 10 },
  { min: 500, off: 15 },
  { min: 1000, off: 20 },
  { min: 1500, off: 25 },
]

export const tierFor = (subtotal: number) => [...DISCOUNT_TIERS].reverse().find((t) => subtotal >= t.min)
export const nextTier = (subtotal: number) => DISCOUNT_TIERS.find((t) => subtotal < t.min)

// Same caps the backend enforces on /orders/new-order
export const MAX_QTY_PER_LINE = 10
export const MAX_QTY_PER_ORDER = 20
export const MAX_ORDER_AMOUNT = 3000

// Delivery charge, same tiers as SurokkhaShop's checkout (no free-delivery threshold on this page).
// Thana names are Pathao zones like "Bank Colony, Savar", so suburbs are matched by name fragment.
export const DELIVERY = { dhakaCity: 70, dhakaSuburbs: 90, outsideDhaka: 120 }
const DHAKA_SUBURB_THANAS = ['savar', 'ashulia', 'dhamrai', 'keraniganj', 'nawabganj', 'dohar']
const SUBURB_DISTRICTS = ['gazipur', 'narayanganj']

export type DeliveryZone = 'dhakaCity' | 'dhakaSuburbs' | 'outsideDhaka'

export function deliveryZone(district: string, thana: string): DeliveryZone {
  const d = district.trim().toLowerCase()
  const t = thana.trim().toLowerCase()
  if (d === 'dhaka') return DHAKA_SUBURB_THANAS.some((s) => t.includes(s)) ? 'dhakaSuburbs' : 'dhakaCity'
  if (SUBURB_DISTRICTS.includes(d)) return 'dhakaSuburbs'
  return d ? 'outsideDhaka' : 'dhakaCity'
}

export const ZONE_LABEL: Record<DeliveryZone, string> = {
  dhakaCity: 'ঢাকা সিটি',
  dhakaSuburbs: 'ঢাকার আশেপাশে',
  outsideDhaka: 'ঢাকার বাইরে',
}
