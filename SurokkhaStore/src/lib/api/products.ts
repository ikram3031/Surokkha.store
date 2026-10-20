import { api } from '@/lib/api/client'
import type { ListResponse, ListQuery } from '@/lib/api/types'

export interface ProductQuery extends ListQuery {
  category?: string
  brand?: string
  stockStatus?: string
  type?: string
  season?: string
  minPrice?: number
  maxPrice?: number
}

/** GET /store/v1/products — list with filters. */
export function listProducts<T = unknown>(query: ProductQuery = {}, options?: { signal?: AbortSignal }) {
  return api.get<ListResponse<T>>('/products', query, options)
}

/** POST /store/v1/products/search — list/search via JSON payload. */
export function searchProducts<T = unknown>(payload: Record<string, unknown>) {
  return api.post<ListResponse<T>>('/products/search', payload)
}

/** GET /store/v1/products/:identifier — by _id, slug, or did. */
export function getProduct<T = unknown>(identifier: string) {
  return api.get<T>(`/products/${encodeURIComponent(identifier)}`)
}

/** GET /store/v1/search-products — autocomplete alias. */
export function searchProductsAutocomplete<T = unknown>(q: string, limit?: number) {
  return api.get<T[]>('/search-products', { q, limit })
}
