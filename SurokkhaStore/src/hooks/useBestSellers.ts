import { useEffect, useMemo, useState } from 'react'
import { getPopularity } from '@/lib/api/store-config'
import { useProducts } from '@/hooks/useProducts'
import type { Product } from '@/data/products'

type Counts = Record<string, { orders?: number }>

let inflight: Promise<Counts> | null = null
const loadCounts = () =>
  (inflight ??= getPopularity()
    .then((res) => res.data ?? {})
    .catch(() => ({})))

/** In-stock products ordered by completed-order count, most ordered first. Products never ordered are left out. */
export function useBestSellers(limit = 8) {
  const { products, loading: catalogLoading } = useProducts()
  const [counts, setCounts] = useState<Counts | null>(null)

  useEffect(() => {
    let cancelled = false
    loadCounts().then((c) => !cancelled && setCounts(c))
    return () => {
      cancelled = true
    }
  }, [])

  const list = useMemo(() => {
    if (!counts) return []
    const ordersOf = (p: Product) =>
      Math.max(
        ...[p.apiId, p.did, p.slug].map((k) => (k ? (counts[k]?.orders ?? 0) : 0)),
      )
    return products
      .filter((p) => p.inStock !== false)
      .map((p) => ({ p, orders: ordersOf(p) }))
      .filter((x) => x.orders > 0)
      .sort((a, b) => b.orders - a.orders)
      .slice(0, limit)
      .map((x) => x.p)
  }, [counts, products, limit])

  return { products: list, loading: catalogLoading || counts === null }
}
