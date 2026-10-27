import { useEffect, useState } from 'react'
import { listCategories } from '@/lib/api/catalog'
import { unwrapList } from '@/lib/api/mappers'

export interface StoreCategory {
  slug: string
  label: string
}

interface ApiCategory {
  slug?: string
  name?: string
  name_bn?: string
  productCount?: number
  parent?: unknown
}

// One request per page load, shared by the header menu and the shop filter
let cache: StoreCategory[] | null = null
let inflight: Promise<StoreCategory[]> | null = null

function load(): Promise<StoreCategory[]> {
  inflight ??= listCategories<ApiCategory>({ limit: 100 })
    .then((res) => {
      cache = unwrapList<ApiCategory>(res)
        .filter((c) => c.slug && !c.parent && (c.productCount ?? 1) > 0)
        .map((c) => ({ slug: c.slug!, label: c.name || c.slug! }))
      return cache
    })
    .catch(() => {
      inflight = null
      return []
    })
  return inflight
}

/** Top-level categories that have products, as served by GET /store/v1/categories. */
export function useCategories() {
  const [categories, setCategories] = useState<StoreCategory[]>(cache ?? [])
  useEffect(() => {
    let cancelled = false
    load().then((c) => !cancelled && setCategories(c))
    return () => {
      cancelled = true
    }
  }, [])
  return categories
}
