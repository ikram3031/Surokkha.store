import { useEffect, useMemo, useState } from 'react'
import { getStoreUtils } from '@/lib/api/store-config'
import { useProducts } from '@/hooks/useProducts'

type Showcase = 'featured' | 'onSale' | 'bestSeller'
type Ref = string | { _id?: string; id?: string }
interface StoreUtils {
  data?: Partial<Record<Showcase, Ref[]>>
}

const idOf = (v: Ref) => (typeof v === 'string' ? v : (v._id ?? v.id ?? ''))

// One request shared by every showcase section on the page
let inflight: Promise<StoreUtils> | null = null
const loadUtils = () => (inflight ??= getStoreUtils<StoreUtils>().catch(() => ({}) as StoreUtils))

/** Products picked in the dashboard (Settings → Products Showcases), in the order they were set. */
export function useShowcaseProducts(key: Showcase) {
  const { products, loading: catalogLoading } = useProducts()
  const [ids, setIds] = useState<string[] | null>(null)

  useEffect(() => {
    let cancelled = false
    loadUtils().then((res) => !cancelled && setIds((res.data?.[key] ?? []).map(idOf).filter(Boolean)))
    return () => {
      cancelled = true
    }
  }, [key])

  const list = useMemo(() => {
    if (!ids) return []
    const byId = new Map(products.map((p) => [p.apiId, p]))
    return ids.map((id) => byId.get(id)).filter((p): p is NonNullable<typeof p> => !!p && p.inStock !== false)
  }, [ids, products])

  return { products: list, loading: catalogLoading || ids === null }
}
