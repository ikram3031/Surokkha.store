import { api } from '@/lib/api/client'
import type { ListResponse } from '@/lib/api/types'

// --- Size charts ---------------------------------------------------------

/** GET /store/v1/size-charts */
export function listSizeCharts<T = unknown>() {
  return api.get<ListResponse<T>>('/size-charts')
}

/** GET /store/v1/size-charts/:id */
export function getSizeChart<T = unknown>(id: string) {
  return api.get<T>(`/size-charts/${encodeURIComponent(id)}`)
}

// --- Store utils -----------------------------------------------------------

/** GET /store/v1/store-utils — general store settings/config blob. */
export function getStoreUtils<T = unknown>() {
  return api.get<T>('/store-utils')
}

/** GET /store/v1/store-utils/popularity — completed-order count per product, keyed by _id, did and slug. */
export function getPopularity() {
  return api.get<{ data?: Record<string, { orders?: number; units?: number }> }>('/store-utils/popularity')
}
