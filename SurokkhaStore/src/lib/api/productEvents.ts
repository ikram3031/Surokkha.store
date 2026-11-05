import { api } from '@/lib/api/client'

export type ProductEventType = 'view' | 'add_to_cart' | 'checkout' | 'purchase'

export interface ProductEvent {
  eventType: ProductEventType
  productKey: string
  productName: string
  quantity?: number
  value?: number
}

const VISITOR_KEY = '_sk_ext_id'
const VIEW_REPEAT_WINDOW_MS = 30 * 60 * 1000

/** Persistent anonymous id of this browser; the dashboard counts unique visitors with it. */
function getVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY)
    if (!id) {
      id = `sk_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
      localStorage.setItem(VISITOR_KEY, id)
    }
    return id
  } catch {
    return `sk_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  }
}

function resolveTrafficSource(): string {
  try {
    const params = new URLSearchParams(window.location.search)
    const utm = params.get('utm_source')
    if (utm) return utm.toLowerCase().slice(0, 60)
    if (params.has('fbclid')) return 'facebook'
    if (document.referrer) {
      const host = new URL(document.referrer).hostname.replace(/^www\./, '')
      if (host && host !== window.location.hostname.replace(/^www\./, '')) return host
    }
  } catch {
    /* fall through to direct */
  }
  return 'direct'
}

/** POST /store/v1/product-events — first-party product funnel for the dashboard. Fire-and-forget. */
export function trackProductEvents(events: ProductEvent[]) {
  if (typeof window === 'undefined' || events.length === 0) return
  const visitorId = getVisitorId()
  const source = resolveTrafficSource()
  const referrer = document.referrer || ''
  const pageUrl = window.location.href
  api
    .post<void>(
      '/product-events',
      { events: events.map((e) => ({ visitorId, source, referrer, pageUrl, ...e })) },
      { keepalive: true },
    )
    .catch(() => {
      /* analytics should never block or surface errors to the user */
    })
}

/** The key the dashboard groups a product by (same as the shop: slug, else id). */
export const productKeyOf = (p: { slug?: string; apiId?: string; id: number }) => p.slug ?? p.apiId ?? String(p.id)

/** One "view" per visitor per product per 30 minutes, so refreshes and back/forward don't inflate the count. */
export function trackProductView(productKey: string, productName: string) {
  const storageKey = `_sk_pv_${productKey}`
  try {
    const last = Number(sessionStorage.getItem(storageKey) || 0)
    if (last && Date.now() - last < VIEW_REPEAT_WINDOW_MS) return
    sessionStorage.setItem(storageKey, String(Date.now()))
  } catch {
    /* storage blocked: count the view */
  }
  trackProductEvents([{ eventType: 'view', productKey, productName }])
}
