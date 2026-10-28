import { useEffect, useState } from 'react'
import { api, resolveMediaUrl } from '@/lib/api/client'
import type { OfferProduct } from '@/data/offerProducts'
import picks from '@/data/offer-picks.json'

// Store products shown first on the page, loaded live from the StoreWeb API by their catalog id (did).
// Using the did as the pixel content id keeps these products matched to the store's Meta catalog.
// Products shown first on the page; the list lives in offer-picks.json
export const TOP_PRODUCTS = picks.top as { path: string; entity: 'product' | 'item' }[]

interface ApiProduct {
  id?: string
  _id?: string
  did: string
  name?: string
  price?: number | null
  stockStatus?: string
  description?: string
  tagline?: string | null
  benefits?: { title?: string }[]
  thumbnailUrl?: string | null
  featuredImage?: string | null
  gallery?: string[]
  slug?: string
  categories?: ({ slug?: string; name?: string } | string)[]
  category?: { slug?: string; name?: string } | string
  variants?: { size?: string; price?: number | null; sku?: string; imageUrl?: string; stockStatus?: string }[] | null
}

const inStock = (s?: string) => String(s ?? '').toLowerCase().replace(/[\s_-]/g, '') !== 'outofstock'

const plain = (html?: string | null) =>
  (html ?? '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()

function toOfferProduct(p: ApiProduct, entity: 'product' | 'item' = 'product'): OfferProduct {
  const variants = (p.variants ?? [])
    .filter((v) => v.size && v.price != null)
    .map((v, i) => ({ id: String(i), label: v.size!, price: Number(v.price), sku: v.sku || `${p.did}-${i}`, inStock: inStock(v.stockStatus) }))
  const images = [p.thumbnailUrl, p.featuredImage, ...(p.gallery ?? []), ...(p.variants ?? []).map((v) => v.imageUrl)]
    .map((src) => resolveMediaUrl(src ?? undefined))
    .filter((src, i, all): src is string => !!src && all.indexOf(src) === i)
  const benefits = p.benefits ?? []
  return {
    id: p.did,
    apiId: p.id ?? p._id ?? '',
    did: p.did,
    entity,
    sku: p.did,
    name: p.name ?? p.did,
    desc: p.tagline || plain(p.description).slice(0, 90),
    details: benefits.map((b) => b.title ?? '').filter(Boolean).slice(0, 4),
    // Regular price; the page's tiered discount is applied on top
    price: variants.length ? Math.min(...variants.map((v) => v.price)) : Number(p.price ?? 0),
    inStock: variants.length ? variants.some((v) => v.inStock) : inStock(p.stockStatus),
    art: 'box',
    c1: '#F4919F',
    c2: '#C9475F',
    images,
    // A single-variant product (e.g. "Pack One") is just sold as itself
    variants: variants.length > 1 ? variants : undefined,
    variantLabel: variants.length > 1 ? 'Option' : undefined,
  }
}

export function useCatalogProducts() {
  const [products, setProducts] = useState<OfferProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    Promise.all(
      TOP_PRODUCTS.map(({ path, entity }) =>
        api
          .get<{ data?: ApiProduct }>(path, undefined, { signal: controller.signal })
          .then((res) => (res?.data?.did ? toOfferProduct(res.data, entity) : null))
          .catch(() => null),
      ),
    ).then((list) => {
      if (controller.signal.aborted) return
      setProducts(list.filter((p): p is OfferProduct => !!p))
      setLoading(false)
    })
    return () => controller.abort()
  }, [])

  return { products, loading }
}

const isCombo = (p: ApiProduct) =>
  [...(p.categories ?? []), p.category].some((c) => {
    const slug = typeof c === 'string' ? c : c?.slug || c?.name
    return String(slug ?? '').toLowerCase() === 'combo'
  })

/** In-stock products and items from the store's "Combo" category, for the ready-made combo section */
export function useComboProducts() {
  const [products, setProducts] = useState<OfferProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    const opts = { signal: controller.signal }
    const list = (path: string) =>
      api
        .get<{ data?: ApiProduct[] }>(path, { limit: 100 }, opts)
        .then((res) => res?.data ?? [])
        .catch(() => [] as ApiProduct[])
    Promise.all([list('/products'), list('/items')]).then(([prods, items]) => {
      if (controller.signal.aborted) return
      const combos = [
        ...prods.filter(isCombo).map((p) => toOfferProduct(p, 'product')),
        ...items.filter(isCombo).map((p) => toOfferProduct(p, 'item')),
      ]
        .filter((p) => p.inStock)
        .map((p) => ({ ...p, readyCombo: true }))
      setProducts(combos)
      setLoading(false)
    })
    return () => controller.abort()
  }, [])

  return { products, loading }
}

/** The Trial Pack is one ordinary product (no group offer, no special pricing); it gets the page's common discount. */
export const TRIAL_PACK_SLUG = 'mo-trial-pack-6-pcs'

export function useTrialPack() {
  const [product, setProduct] = useState<OfferProduct | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const opts = { signal: controller.signal }
    const load = (entity: 'product' | 'item') =>
      api.get<{ data?: ApiProduct }>(`/${entity}s/${TRIAL_PACK_SLUG}`, undefined, opts).then((res) => {
        if (!res?.data?.did) throw new Error('not found')
        return toOfferProduct(res.data, entity)
      })
    // The pack lives in the products or the items collection depending on how it was set up in the dashboard
    load('product')
      .catch(() => load('item'))
      .then((p) => !controller.signal.aborted && setProduct(p))
      .catch(() => {})
    return () => controller.abort()
  }, [])

  return product
}
