import { api } from '@/lib/api/client'
import type { ListResponse, ListQuery } from '@/lib/api/types'

/** GET /store/v1/items — list (parallel to products, for the items collection). */
export function listItems<T = unknown>(query: ListQuery = {}) {
  return api.get<ListResponse<T>>('/items', query)
}

/** POST /store/v1/items/search */
export function searchItems<T = unknown>(payload: Record<string, unknown>) {
  return api.post<ListResponse<T>>('/items/search', payload)
}

/** GET /store/v1/items/:identifier — by _id, slug, or did. */
export function getItem<T = unknown>(identifier: string) {
  return api.get<T>(`/items/${encodeURIComponent(identifier)}`)
}
