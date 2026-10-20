import { api } from '@/lib/api/client'
import type { ListResponse, ListQuery } from '@/lib/api/types'

/** GET /store/v1/payments */
export function listPayments<T = unknown>(query: ListQuery = {}) {
  return api.get<ListResponse<T>>('/payments', query, { auth: true })
}

/** POST /store/v1/payments */
export function createPayment<T = unknown>(payload: Record<string, unknown>) {
  return api.post<T>('/payments', payload, { auth: true })
}

/** PUT /store/v1/payments/:paymentId */
export function updatePayment<T = unknown>(paymentId: string, payload: Record<string, unknown>) {
  return api.put<T>(`/payments/${encodeURIComponent(paymentId)}`, payload, { auth: true })
}
