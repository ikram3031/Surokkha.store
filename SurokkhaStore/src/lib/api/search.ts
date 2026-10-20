import { api } from '@/lib/api/client'

/** GET /store/v1/search — autocomplete. */
export function autocomplete<T = unknown>(q: string, limit?: number) {
  return api.get<T[]>('/search', { q, limit })
}

/** GET /store/v1/search/popular — requires auth (JWT). */
export function getPopularSearches<T = unknown>() {
  return api.get<T[]>('/search/popular', undefined, { auth: true })
}

/** GET /store/v1/search/recent — requires auth (JWT). */
export function getRecentSearches<T = unknown>() {
  return api.get<T[]>('/search/recent', undefined, { auth: true })
}
