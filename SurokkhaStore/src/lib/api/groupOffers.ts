import { api, resolveMediaUrl } from '@/lib/api/client'

export interface GroupDiscount {
  discountType: 'percentage' | 'fixed'
  discountValue: number
}

/** Rules a Group Offer carries into the cart so checkout can price the group without refetching. */
export interface GroupOfferRule {
  id: string
  name: string
  slug: string
  minOrderAmount: number
  minPerProduct: number
  pricingMode: 'fixed' | 'conditional'
  fixedDiscount?: GroupDiscount
  conditions: (GroupDiscount & { minOrderAmount: number })[]
}

export interface GroupOfferProduct {
  id: string
  did: string
  slug: string
  name: string
  unitPrice: number
  image: string
  inStock: boolean
}

export interface GroupOffer extends GroupOfferRule {
  did: string
  description: string
  imageUrl: string
  products: GroupOfferProduct[]
}

/** GET /store/v1/group-offers/:slug */
export function getGroupOffer(slug: string, options?: { signal?: AbortSignal }) {
  return api.get<{ data?: GroupOffer }>(`/group-offers/${encodeURIComponent(slug)}`, undefined, options)
}

/** GET /store/v1/group-offers — active offers. */
export function listGroupOffers(options?: { signal?: AbortSignal }) {
  return api.get<{ data?: GroupOffer[] }>('/group-offers', undefined, options)
}

const applyDiscount = (d: GroupDiscount, amount: number) =>
  Math.min(amount, Math.max(0, d.discountType === 'percentage' ? Math.round((amount * d.discountValue) / 100) : d.discountValue))

/** Discount for a group's pieces total: `eligible` is false below the offer's minimum order amount. */
export function groupOfferDiscount(rule: GroupOfferRule, amount: number) {
  if (amount <= 0 || amount < rule.minOrderAmount) return { discount: 0, eligible: false, next: undefined as GroupDiscount & { minOrderAmount: number } | undefined }
  if (rule.pricingMode === 'fixed') {
    return { discount: rule.fixedDiscount ? applyDiscount(rule.fixedDiscount, amount) : 0, eligible: true, next: undefined }
  }
  const sorted = [...rule.conditions].sort((a, b) => a.minOrderAmount - b.minOrderAmount)
  const hit = [...sorted].reverse().find((c) => amount >= c.minOrderAmount)
  const next = sorted.find((c) => amount < c.minOrderAmount)
  return { discount: hit ? applyDiscount(hit, amount) : 0, eligible: true, next }
}

interface TrialVariant {
  size?: string
  price?: number | null
  offerPrice?: number | null
  imageUrl?: string
  stockStatus?: string
}

interface TrialItem {
  id?: string
  _id?: string
  did?: string
  slug?: string
  name?: string
  description?: string
  imageUrl?: string
  isActive?: boolean
  variants?: TrialVariant[]
}

/**
 * The Trial Pack is a variant item in the dashboard (one variant per piece), not a Group Offer document.
 * Loads the Group Offer if one exists, otherwise builds the same shape from the item's variants.
 */
export async function getTrialPack(slug: string, options?: { signal?: AbortSignal }): Promise<GroupOffer | null> {
  try {
    const res = await getGroupOffer(slug, options)
    if (res.data) return res.data
  } catch {
    // not a Group Offer; fall through to the item
  }
  const res = await api.get<{ data?: TrialItem }>(`/items/${encodeURIComponent(slug)}`, undefined, options)
  const item = res.data
  const variants = (item?.variants ?? []).filter((v) => v?.size)
  if (!item || item.isActive === false || variants.length === 0) return null
  const itemId = String(item.id ?? item._id ?? '')
  const did = String(item.did ?? '')
  return {
    id: itemId,
    did,
    name: item.name ?? 'Trial Pack',
    slug,
    description: item.description ?? '',
    imageUrl: resolveMediaUrl(item.imageUrl) ?? '',
    minOrderAmount: 0,
    minPerProduct: 2,
    pricingMode: 'fixed',
    conditions: [],
    products: variants.map((v) => {
      const price = Number(v.price) || 0
      const offer = Number(v.offerPrice) || 0
      return {
        id: `${itemId}:${v.size}`,
        did,
        slug,
        name: String(v.size),
        unitPrice: offer > 0 && offer < price ? offer : price,
        image: resolveMediaUrl(v.imageUrl) ?? '',
        inStock: !['outofstock', 'out_of_stock'].includes(String(v.stockStatus ?? '').toLowerCase()),
      }
    }),
  }
}
