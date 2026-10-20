import { api } from '@/lib/api/client'
import type { ListResponse } from '@/lib/api/types'

// --- Assets ----------------------------------------------------------------

/** GET /store/v1/assets */
export function listAssets<T = unknown>() {
  return api.get<ListResponse<T>>('/assets')
}

// --- Images ------------------------------------------------------------------

/** GET /store/v1/images */
export function listImages<T = unknown>() {
  return api.get<ListResponse<T>>('/images')
}
