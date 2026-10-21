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

const content = offerContent as { customCombo: { title: string; products: JsonProduct[] } }

export const CUSTOM_COMBO_PRODUCTS: OfferProduct[] = content.customCombo.products.map(fromJson)

export const variantPrice = (p: OfferProduct, v?: OfferVariant) => v?.price ?? p.price

/** Lowest price, shown as "৳X থেকে" on variable products */
export const fromPrice = (p: OfferProduct) => p.price

// Combo discount by subtotal (no free delivery here, delivery is always charged)
export const DISCOUNT_TIERS = [
  { min: 200, off: 10 },
  { min: 400, off: 12 },
  { min: 1000, off: 15 },
  { min: 1500, off: 20 },
]

export const tierFor = (subtotal: number) => [...DISCOUNT_TIERS].reverse().find((t) => subtotal >= t.min)
export const nextTier = (subtotal: number) => DISCOUNT_TIERS.find((t) => subtotal < t.min)

// Same caps the backend enforces on /orders/new-order
export const MAX_QTY_PER_LINE = 10
export const MAX_QTY_PER_ORDER = 20
export const MAX_ORDER_AMOUNT = 3000

// Flat delivery charge (this page has no free-delivery threshold)
export const SHIP_FEE = 60
