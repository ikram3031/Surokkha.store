import { useEffect, useState } from 'react'
import { listProducts } from '@/lib/api/products'
import { mapApiProduct, unwrapList, type ApiProduct } from '@/lib/api/mappers'
import type { Product } from '@/data/products'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)

    listProducts<ApiProduct>({ limit: 50 }, { signal: controller.signal })
      .then((res) => {
        const items = unwrapList<ApiProduct>(res).map(mapApiProduct)
        setProducts(items)
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        setProducts([])
        setError(err instanceof Error ? err.message : 'পণ্য লোড করা যায়নি।')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [])

  return { products, loading, error }
}
