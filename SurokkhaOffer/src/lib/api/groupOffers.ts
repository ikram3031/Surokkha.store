import { api } from '@/lib/api/client'

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
