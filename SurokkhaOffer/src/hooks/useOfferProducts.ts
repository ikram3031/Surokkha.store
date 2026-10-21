import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/api/client'
import { OFFER_PICKS, mapOfferProduct, type ApiOfferProduct, type OfferProduct } from '@/data/offerProducts'

const unwrap = (res: unknown): ApiOfferProduct[] => {
  if (Array.isArray(res)) return res
  const data = (res as { data?: unknown })?.data
  return Array.isArray(data) ? data : []
}

/** Loads the picked offer products from the StoreWeb API, keeping OFFER_PICKS order */
export function useOfferProducts() {
  const [products, setProducts] = useState<OfferProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const opts = { signal: controller.signal }
    setLoading(true)
    setError(null)

    Promise.all([
      api.get<unknown>('/products', { limit: 100 }, opts),
      api.get<unknown>('/items', { limit: 100 }, opts),
    ])
      .then(([prods, items]) => {
        const bySource = { products: unwrap(prods), items: unwrap(items) }
        setProducts(
          OFFER_PICKS.flatMap((pick) => {
            const raw = bySource[pick.source].find((p) => p.slug === pick.slug)
            return raw ? [mapOfferProduct(raw, pick)] : []
          }),
        )
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : 'পণ্য লোড করা যায়নি')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [attempt])

  const retry = useCallback(() => setAttempt((a) => a + 1), [])
  return { products, loading, error, retry }
}
