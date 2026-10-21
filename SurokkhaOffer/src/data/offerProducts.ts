import type { ProductArt } from '@/components/icons/ArtIcons'

// Products for the /offer landing page. Hardcoded on purpose: they are not
// dashboard/API products and go to the backend as custom order lines.

export interface OfferVariant {
  id: string
  label: string
  /** Overrides the product price for this variant */
  price?: number
  /** Quantity pre-selected when the page opens */
  defaultQty?: number
  c1?: string
  c2?: string
}

export interface OfferProduct {
  id: string
  name: string
  desc: string
  details: string[]
  price: number
  art: ProductArt
  c1: string
  c2: string
  badge?: string
  /** Real photos for the card and quick-view slider; the drawn art is used when empty */
  images?: string[]
  /** Present only on variable products: "+" opens the variant picker */
  variants?: OfferVariant[]
  variantLabel?: string
  /** Shown after the price instead of "থেকে", e.g. "প্রতি পিস" */
  unitLabel?: string
  /** Quantity pre-selected on simple products */
  defaultQty?: number
}

// Pack sizes shared by the MO condoms
const PACKS: OfferVariant[] = [
  { id: '5pcs', label: '৫ পিস', price: 250 },
  { id: '10pcs', label: '১০ পিস', price: 450 },
]

export const OFFER_PRODUCTS: OfferProduct[] = [
  {
    id: 'mo-trial-pack',
    name: 'MO Trial Pack',
    desc: 'Dotted, Ribbed, Ultra Thin — মিলিয়ে নিন',
    details: ['পছন্দমতো ধরন মিলিয়ে নিন', 'প্রতি পিস মাত্র ৳৪৫', 'যত পিস খুশি, ১টি করে বাড়ান'],
    price: 45,
    unitLabel: 'প্রতি পিস',
    art: 'box',
    c1: '#F4919F',
    c2: '#C9475F',
    badge: 'ট্রায়াল প্যাক',
    variantLabel: 'ধরন',
    variants: [
      { id: 'dotted', label: 'Dotted', defaultQty: 1, c1: '#F4919F', c2: '#C9475F' },
      { id: 'ribbed', label: 'Ribbed', defaultQty: 1, c1: '#C9475F', c2: '#3A322F' },
      { id: 'ultra-thin', label: 'Ultra Thin', defaultQty: 1, c1: '#F5E6D3', c2: '#948B86' },
    ],
  },
  {
    id: 'mo-ultra-thin',
    name: 'MO Ultra Thin Condoms',
    desc: 'অতিপাতলা, প্রাকৃতিক অনুভূতি',
    details: ['অতিপাতলা অনুভূতি', 'সিল্কি লুব্রিকেশন', 'ইলেকট্রনিক্যালি টেস্টেড'],
    price: 250,
    art: 'box',
    c1: '#F5E6D3',
    c2: '#948B86',
    images: ['https://web.surokkha.store/uploads/2609/260927/ultra-thin-condoms-20pcs-combo_main_1790487720034.webp'],
    variantLabel: 'প্যাক',
    variants: PACKS,
  },
  {
    id: 'mo-ultra-ribbed',
    name: 'MO Ultra Ribbed Condom',
    desc: 'রিবড টেক্সচার, বাড়তি অনুভূতি',
    details: ['রিবড টেক্সচার', 'বাড়তি অনুভূতি', 'ইলেকট্রনিক্যালি টেস্টেড'],
    price: 250,
    art: 'box',
    c1: '#C9475F',
    c2: '#3A322F',
    images: ['https://web.surokkha.store/uploads/2609/260927/ribbed-condoms-20pcs-combo_main_1790487642125.jpg'],
    variantLabel: 'প্যাক',
    variants: PACKS,
  },
  {
    id: 'mo-premium-dotted',
    name: 'MO Premium Dotted Condom',
    desc: 'ডটেড টেক্সচার, প্রিমিয়াম ফিল',
    details: ['ডটেড টেক্সচার', 'প্রিমিয়াম ফিল', 'ইলেকট্রনিক্যালি টেস্টেড'],
    price: 250,
    art: 'box',
    c1: '#F7B3BE',
    c2: '#F4919F',
    images: ['https://web.surokkha.store/uploads/2609/260927/thumb_mo-dotted-condom_main_1790487322565.jpg'],
    variantLabel: 'প্যাক',
    variants: PACKS,
  },
  {
    id: 'ry-lubricant-gel',
    name: 'RY Lubricant Gel',
    desc: '৫০ গ্রাম, পানিভিত্তিক জেল',
    details: ['পানিভিত্তিক, চটচটে নয়', 'কনডমের সাথে নিরাপদ', 'সহজে ধুয়ে যায়'],
    price: 350, // TODO: placeholder, set the current price
    art: 'bottle',
    c1: '#F5E6D3',
    c2: '#948B86',
    images: ['https://web.surokkha.store/uploads/2610/261003/ky-jelly-personal-lubricant-gel-50g_main_1791056700015.webp'],
  },
  {
    id: 'eazy-lubricant-gel',
    name: 'Eazy Lubricant Gel',
    desc: '৫০ গ্রাম, পানিভিত্তিক জেল',
    details: ['পানিভিত্তিক, চটচটে নয়', 'কনডমের সাথে নিরাপদ', 'সহজে ধুয়ে যায়'],
    price: 350, // TODO: placeholder, set the current price
    art: 'bottle',
    c1: '#F4919F',
    c2: '#C9475F',
    images: ['https://web.surokkha.store/uploads/2610/261003/eazy-gelly-50gm_main_1790996174325.webp'],
  },
]

/** Pre-selected quantities keyed like the page's selection ("product" or "product:variant") */
export const defaultSelection = (): Record<string, number> =>
  Object.fromEntries(
    OFFER_PRODUCTS.flatMap((p) =>
      p.variants?.length
        ? p.variants.filter((v) => v.defaultQty).map((v) => [`${p.id}:${v.id}`, v.defaultQty!])
        : p.defaultQty ? [[p.id, p.defaultQty]] : [],
    ),
  )

export const variantPrice = (p: OfferProduct, v?: OfferVariant) => v?.price ?? p.price

/** Lowest price, shown as "৳X থেকে" on variable products */
export const fromPrice = (p: OfferProduct) =>
  p.variants?.length ? Math.min(...p.variants.map((v) => variantPrice(p, v))) : p.price

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
