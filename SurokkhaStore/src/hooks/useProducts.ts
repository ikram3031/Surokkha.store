import { useEffect, useState } from 'react'
import { listProducts } from '@/lib/api/products'
import { listItems } from '@/lib/api/items'
import { mapApiProduct, unwrapList, type ApiProduct } from '@/lib/api/mappers'
import type { Product } from '@/data/products'

// The catalog is split across two collections (products + items); fetch both once and share
// the result between the shop grid and the featured carousel.
let inflight: Promise<Product[]> | null = null

function loadCatalog(): Promise<Product[]> {
  inflight ??= Promise.allSettled([listProducts<ApiProduct>({ limit: 100 }), listItems<ApiProduct>({ limit: 100 })]).then(
    ([productsRes, itemsRes]) => {
      if (productsRes.status === 'rejected' && itemsRes.status === 'rejected') {
        inflight = null // allow a retry on the next mount
        throw productsRes.reason
      }
      const raw = [
        ...(productsRes.status === 'fulfilled' ? unwrapList<ApiProduct>(productsRes.value) : []),
        ...(itemsRes.status === 'fulfilled' ? unwrapList<ApiProduct>(itemsRes.value) : []),
      ]
      const seen = new Set<string>()
      return raw
        .filter((p) => p.isActive !== false)
        .map(mapApiProduct)
        .filter((p) => {
          const key = p.slug ?? String(p.id)
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
    },
  )
  return inflight
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    loadCatalog()
      .then((list) => !cancelled && setProducts(list))
      .catch((err) => {
        if (cancelled) return
        setProducts([])
        setError(err instanceof Error ? err.message : 'পণ্য লোড করা যায়নি।')
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  return { products, loading, error }
}
