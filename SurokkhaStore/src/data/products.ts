import type { ProductArt } from '@/components/icons/ArtIcons'

export type ProductCategory = 'condom' | 'lube' | 'combo'

export interface Product {
  id: number
  cat: ProductCategory
  name: string
  desc: string
  price: number
  art: ProductArt
  c1?: string
  c2?: string
  badge?: string
  image?: string
  /** Set for products loaded from the API; needed for the product page and order payload. */
  slug?: string
  /** Slugs of every API category the product belongs to (drives the dynamic category menu/filter). */
  categorySlugs?: string[]
  /** API's canonical (English) name — sent on orders, as SurokkhaShop does. */
  apiName?: string
  apiId?: string
  /** Which API collection the product comes from; orders reference items by `itemId`. */
  itemType?: 'product' | 'item'
  did?: string
  gallery?: string[]
  longDescription?: string
  regularPrice?: number
  inStock?: boolean
}

export const products: Product[] = [
  { id: 1, cat: 'condom', name: 'Surokkha Classic', desc: '3 pcs, smooth latex', price: 90, art: 'box', c1: '#F4919F', c2: '#C9475F', badge: 'Best Seller' },
  { id: 2, cat: 'condom', name: 'Ultra Thin', desc: '10 pcs, extra thin', price: 320, art: 'box', c1: '#F5E6D3', c2: '#948B86' },
  { id: 3, cat: 'condom', name: 'Dotted & Ribbed', desc: '12 pcs, textured', price: 420, art: 'box', c1: '#C9475F', c2: '#3A322F' },
  { id: 4, cat: 'condom', name: 'Fruity Flavour', desc: '3 pcs, strawberry flavour', price: 120, art: 'box', c1: '#F7B3BE', c2: '#F4919F', badge: 'New' },
  { id: 5, cat: 'lube', name: 'Water-Based Lube', desc: '100 ml, washes off easily', price: 350, art: 'bottle', c1: '#F5E6D3', c2: '#948B86', badge: 'Best Seller' },
  { id: 6, cat: 'lube', name: 'Silicone-Based Lube', desc: '50 ml, long lasting', price: 480, art: 'bottle', c1: '#F4919F', c2: '#C9475F' },
  { id: 7, cat: 'lube', name: 'Sensitive Skin Lube', desc: '75 ml, fragrance free', price: 390, art: 'bottle', c1: '#FBD6DB', c2: '#C9475F' },
  { id: 8, cat: 'combo', name: 'Starter Combo', desc: 'Classic 3 pcs + water-based lube 50 ml', price: 390, art: 'combo', badge: 'Great Value' },
]

export const catLabel: Record<ProductCategory, string> = {
  condom: 'Condoms',
  lube: 'Lubricants',
  combo: 'Combo Packs',
}

// Soft tint behind each product's art, grouped by category.
// These are decorative/product-grouping colors tied to brand hues,
// kept as theme tokens (muted/accent/secondary) so they still follow the theme.
export const catBg: Record<ProductCategory, string> = {
  condom: 'bg-secondary',
  lube: 'bg-accent',
  combo: 'bg-muted',
}

export const FREE_SHIP_AT = 1000
export const SHIP_FEE = 60
