import { api } from '@/lib/api/client'

/** POST /store/v1/events/add-to-cart — pixel/analytics event. Fire-and-forget. */
export function trackAddToCart(payload: { productId: string | number; qty?: number; price?: number }) {
  return api.post<void>('/events/add-to-cart', payload).catch(() => {
    /* analytics events should never block or surface errors to the user */
  })
}

/** POST /store/v1/events/view-content — pixel/analytics event. Fire-and-forget. */
export function trackViewContent(payload: { productId: string | number }) {
  return api.post<void>('/events/view-content', payload).catch(() => {
    /* analytics events should never block or surface errors to the user */
  })
}
