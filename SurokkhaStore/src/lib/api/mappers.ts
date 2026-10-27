import type { Product, ProductCategory } from '@/data/products'
import type { ProductArt } from '@/components/icons/ArtIcons'
import { resolveMediaUrl } from '@/lib/api/client'

/**
 * The real shape of a StoreWeb API product isn't pinned down yet, so this is
 * a loose, best-effort shape covering the field names such APIs commonly use.
 * Tighten this once a real `/products` response has been seen.
 */
export interface ApiProduct {
  _id?: string
  did?: string
  slug?: string
  id?: string | number
  name?: string
  title?: string
  description?: string
  shortDescription?: string
  price?: number
  salePrice?: number
  regularPrice?: number
  category?: string | { name?: string; slug?: string }
  categoryName?: string
  isNew?: boolean
  isBestSeller?: boolean
  badge?: string
  featuredImage?: string
  thumbnailUrl?: string
  imageUrl?: string
  gallery?: string[]
  offerPrice?: number | null
  longDescription?: string
  name_bn?: string
  description_bn?: string
  stockStatus?: string
  bn?: { name?: string; description?: string }
  [key: string]: unknown
}

const DEFAULT_ART_BY_CATEGORY: Record<ProductCategory, { art: ProductArt; c1: string; c2: string }> = {
  condom: { art: 'box', c1: '#F4919F', c2: '#C9475F' },
  lube: { art: 'bottle', c1: '#F5E6D3', c2: '#948B86' },
  combo: { art: 'combo', c1: '#F4919F', c2: '#C9475F' },
}

function categoryNameOf(raw: ApiProduct['category'] | string | undefined): string {
  if (!raw) return ''
  if (typeof raw === 'string') return raw
  return raw.name ?? raw.slug ?? ''
}

/** Best-effort guess at which of our three catalog buckets an API category belongs to. */
function normalizeCategory(raw: string): ProductCategory {
  const name = raw.toLowerCase()
  if (name.includes('condom') || name.includes('কনডম')) return 'condom'
  if (name.includes('lub') || name.includes('লুব')) return 'lube'
  return 'combo'
}

function toNumericId(raw: ApiProduct): number {
  const candidate = raw.id ?? raw._id ?? raw.did ?? raw.slug
  if (typeof candidate === 'number') return candidate
  if (typeof candidate === 'string') {
    // Deterministic numeric hash so the same product always gets the same id.
    let hash = 0
    for (let i = 0; i < candidate.length; i++) hash = (hash * 31 + candidate.charCodeAt(i)) | 0
    return Math.abs(hash)
  }
  return Math.floor(Math.random() * 1_000_000)
}

/** Maps a loosely-typed API product into the shape the UI (ProductCard, cart, filters) expects. */
export function mapApiProduct(raw: ApiProduct): Product {
  const categoryName = categoryNameOf(raw.category) || raw.categoryName || ''
  const cat = normalizeCategory(categoryName)
  const visual = DEFAULT_ART_BY_CATEGORY[cat]

  return {
    id: toNumericId(raw),
    cat,
    name: raw.name_bn || raw.bn?.name || raw.name || raw.title || 'পণ্য',
    desc: raw.description_bn || raw.bn?.description || raw.description || raw.shortDescription || '',
    // Same precedence as SurokkhaShop: active offer price, else list price
    price: Number(raw.offerPrice) > 0 ? Number(raw.offerPrice) : (raw.price ?? raw.salePrice ?? raw.regularPrice ?? 0),
    slug: raw.slug,
    apiName: raw.name ?? raw.title,
    apiId: raw._id ?? raw.id?.toString(),
    did: raw.did,
    gallery: (raw.gallery ?? []).map((g) => resolveMediaUrl(g)!).filter(Boolean),
    longDescription: raw.longDescription,
    regularPrice: raw.regularPrice,
    inStock: String(raw.stockStatus ?? 'instock').toLowerCase() !== 'outofstock',
    art: visual.art,
    c1: visual.c1,
    c2: visual.c2,
    badge: raw.badge ?? (raw.isNew ? 'নতুন' : raw.isBestSeller ? 'বেস্ট সেলার' : undefined),
    image: resolveMediaUrl(raw.thumbnailUrl || raw.featuredImage || raw.imageUrl || raw.gallery?.[0]),
  }
}

/** Unwraps the various list-response shapes an endpoint might return (data[] / items[] / raw array). */
export function unwrapList<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[]
  if (res && typeof res === 'object') {
    const obj = res as { data?: T[]; items?: T[] }
    if (Array.isArray(obj.data)) return obj.data
    if (Array.isArray(obj.items)) return obj.items
  }
  return []
}
