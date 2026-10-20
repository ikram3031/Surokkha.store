import { api } from '@/lib/api/client'
import type { ListResponse } from '@/lib/api/types'

export interface ReviewPayload {
  productDid: string
  rating: number
  comment?: string
  [key: string]: unknown
}

/** GET /store/v1/reviews/product/:productDid */
export function getProductReviews<T = unknown>(productDid: string) {
  return api.get<ListResponse<T>>(`/reviews/product/${encodeURIComponent(productDid)}`)
}

/** POST /store/v1/reviews */
export function createReview<T = unknown>(payload: ReviewPayload) {
  return api.post<T>('/reviews', payload, { auth: true })
}

/** PUT /store/v1/reviews/:id */
export function updateReview<T = unknown>(id: string, payload: Partial<ReviewPayload>) {
  return api.put<T>(`/reviews/${encodeURIComponent(id)}`, payload, { auth: true })
}
