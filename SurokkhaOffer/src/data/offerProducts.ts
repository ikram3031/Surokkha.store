import type { ProductArt } from '@/components/icons/ArtIcons'
import { resolveMediaUrl } from '@/lib/api/client'

// Which store products the offer page shows, in order. Name, price, images, variants and stock
// all come from the StoreWeb API (/products and /items); only the pick and the badge live here.
export const OFFER_PICKS: { slug: string; source: 'products' | 'items'; badge?: string; art: ProductArt }[] = [
  { slug: 'mo-trial-pack', source: 'items', badge: 'ট্রায়াল প্যাক', art: 'box' },
  { slug: 'mo-micro-thin-latex-contraceptive-10-pcs', source: 'products', art: 'box' },
  { slug: 'mo-micro-ribbed-natural-latex-contraceptive-10-pcs', source: 'products', art: 'box' },
  { slug: 'mo-multi-textured-latex-contraceptive-10-pcs', source: 'products', art: 'box' },
  { slug: 'ky-jelly-personal-lubricant-gel-50g', source: 'items', art: 'bottle' },
]

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
  entity: 'product' | 'item'
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

interface ApiVariant {
  size?: string
  price?: number | null
  sku?: string
  imageUrl?: string
  stockStatus?: string
}

export interface ApiOfferProduct {
  id?: string
  _id?: string
  did?: string
  slug: string
  name?: string
  sku?: string | null
  price?: number | null
  stockStatus?: string
  description?: string
  description_bn?: string
  tagline_bn?: string | null
  bn?: { tagline?: string; benefits?: { title?: string }[] }
  benefits?: { title?: string }[]
  thumbnailUrl?: string | null
  imageUrl?: string | null
  featuredImage?: string | null
  gallery?: string[]
  variants?: ApiVariant[] | null
}

const inStock = (s?: string) => String(s ?? '').toLowerCase().replace(/[\s_-]/g, '') !== 'outofstock'

/** Plain text from the API's HTML descriptions, cut to one short line */
const plain = (html?: string | null) =>
  (html ?? '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()

export function mapOfferProduct(raw: ApiOfferProduct, pick: (typeof OFFER_PICKS)[number]): OfferProduct {
  const variants = (raw.variants ?? [])
    .filter((v) => v.size && v.price != null)
    .map((v, i) => ({
      id: String(i),
      label: v.size!,
      price: Number(v.price),
      sku: v.sku ?? '',
      inStock: inStock(v.stockStatus),
    }))
  const images = [
    raw.thumbnailUrl,
    raw.featuredImage,
    raw.imageUrl,
    ...(raw.gallery ?? []),
    ...(raw.variants ?? []).map((v) => v.imageUrl),
  ]
    .map((src) => resolveMediaUrl(src ?? undefined))
    .filter((src, i, all): src is string => !!src && all.indexOf(src) === i)
  const benefits = raw.bn?.benefits?.length ? raw.bn.benefits : raw.benefits ?? []
  const price = variants.length ? Math.min(...variants.map((v) => v.price)) : Number(raw.price ?? 0)

  return {
    id: raw.slug,
    apiId: raw.id ?? raw._id ?? '',
    did: raw.did ?? '',
    entity: pick.source === 'items' ? 'item' : 'product',
    sku: raw.sku ?? '',
    name: raw.name ?? raw.slug,
    desc: raw.bn?.tagline || raw.tagline_bn || plain(raw.description_bn || raw.description).slice(0, 90),
    details: benefits.map((b) => b.title ?? '').filter(Boolean).slice(0, 4),
    price,
    inStock: variants.length ? variants.some((v) => v.inStock) : inStock(raw.stockStatus),
    art: pick.art,
    c1: '#F4919F',
    c2: '#C9475F',
    badge: pick.badge,
    images,
    variants: variants.length ? variants : undefined,
    variantLabel: variants.length ? 'অপশন' : undefined,
  }
}

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
