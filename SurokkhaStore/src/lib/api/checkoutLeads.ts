import { api } from '@/lib/api/client'

const SESSION_KEY = '_sk_checkout_sid'

export interface CheckoutLeadPayload {
  fullName: string
  phone: string
  email: string
  address: string
  district: string
  thana: string
  cartTotal: number
  items: { slug: string; name: string; quantity: number; unitPrice: number }[]
  customData?: Record<string, unknown>
  fbp?: string
  fbc?: string
  /** Visitor id (_sk_ext_id) the pixel uses as external_id */
  externalId?: string
}

/** One id per checkout attempt: ties the saved lead, the Meta InitiateCheckout and the placed order together. */
export function getCheckoutSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY)
    if (!id) {
      id = `co${Date.now()}${Math.random().toString(36).slice(2, 8)}`
      localStorage.setItem(SESSION_KEY, id)
    }
    return id
  } catch {
    return `co${Date.now()}${Math.random().toString(36).slice(2, 8)}`
  }
}

/** Called after an order is placed so the next checkout starts a fresh session. */
export function resetCheckoutSession() {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    /* ignore storage errors */
  }
}

/** POST /store/v1/checkout-leads — keeps what the customer typed so far. Fire-and-forget. */
export function saveCheckoutLead(payload: CheckoutLeadPayload, keepalive = false) {
  return api
    .post<void>(
      '/checkout-leads',
      { sessionId: getCheckoutSessionId(), ...payload, sourceUrl: window.location.href },
      { keepalive },
    )
    .catch(() => {
      /* capturing a lead must never block or surface errors to the customer */
    })
}
