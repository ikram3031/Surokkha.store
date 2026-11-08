import { api } from '@/lib/api/client'
import { getFbIdentifiers } from '@/lib/pixel'

// Browser pixel and server CAPI send the same event_id, so Meta counts each view / add-to-cart once
export function newEventId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

interface ServerEvent {
  /** Catalog content id (product did); must match the pixel's content_ids */
  productDid: string
  productName?: string
  price?: number
  eventId: string
}

function post(path: string, payload: Record<string, unknown>) {
  return api
    .post<void>(path, { ...payload, ...getFbIdentifiers(), eventSourceUrl: window.location.href }, { keepalive: true })
    .catch(() => {
      /* analytics events should never block or surface errors to the user */
    })
}

/** POST /store/v1/events/add-to-cart — server-side AddToCart (Meta CAPI + TikTok). Fire-and-forget. */
export function trackAddToCart(payload: ServerEvent & { qty?: number }) {
  const { qty, ...rest } = payload
  return post('/events/add-to-cart', { ...rest, quantity: qty ?? 1 })
}

/** POST /store/v1/events/view-content — server-side ViewContent (Meta CAPI). Fire-and-forget. */
export function trackViewContent(payload: ServerEvent) {
  return post('/events/view-content', { ...payload })
}
