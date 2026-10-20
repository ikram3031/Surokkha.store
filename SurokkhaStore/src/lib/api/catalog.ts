import { api } from '@/lib/api/client'
import type { ListResponse, ListQuery } from '@/lib/api/types'

// --- Categories ---------------------------------------------------------

/** GET /store/v1/categories */
export function listCategories<T = unknown>(query: ListQuery = {}) {
  return api.get<ListResponse<T>>('/categories', query)
}

// --- Brands --------------------------------------------------------------

/** GET /store/v1/brands */
export function listBrands<T = unknown>(query: ListQuery = {}) {
  return api.get<ListResponse<T>>('/brands', query)
}

// --- Coupons ---------------------------------------------------------------

/** GET /store/v1/coupons */
export function listCoupons<T = unknown>(query: ListQuery = {}) {
  return api.get<ListResponse<T>>('/coupons', query, { auth: true })
}

/** GET /store/v1/coupons/:code — validate a single coupon code. */
export function getCoupon<T = unknown>(code: string) {
  return api.get<T>(`/coupons/${encodeURIComponent(code)}`)
}
