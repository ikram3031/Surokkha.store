import { ApiError } from '@/lib/api/client'
import { createOrder, type NewOrderPayload, type OrderAddress, type OrderItemInput } from '@/lib/api/orders'
import { getCheckoutSessionId, resetCheckoutSession } from '@/lib/api/checkoutLeads'
import { getFbIdentifiers } from '@/lib/pixel'
import { normalizePhone } from '@/lib/checkout'
import { collectClientSignals, minDelay } from './botGuard'
import { ORDER_PREFIX, PAYMENT_METHOD } from './config'
import { trackOrderPlaced, type TrackLine } from './tracking'

export interface CustomerInput {
  name: string
  phone: string
  email?: string
  address: string
  district: string
  thana?: string
}

export interface PlaceOrderInput {
  customer: CustomerInput
  shipping?: CustomerInput | null
  items: OrderItemInput[]
  trackLines: TrackLine[]
  subtotal: number
  shippingFee: number
  discount?: number
  couponCode?: string | null
  total: number
  notes?: string
  asLead?: boolean
  promo?: NewOrderPayload['promo']
  token?: string | null
  honeypot?: string
  shipToBilling?: boolean
  extra?: Record<string, unknown>
}

export type PlaceOrderResult =
  | { ok: true; orderNumber: string; asLead: boolean; data: Record<string, unknown> }
  | { ok: false; reason: 'contact_required' | 'failed'; message: string }

// Turns the checkout form into the address block the order API expects
const toAddress = (c: CustomerInput): OrderAddress => ({
  fullName: c.name.trim(),
  phone: normalizePhone(c.phone),
  email: c.email?.trim() || '',
  address: c.address.trim(),
  city: c.district,
  thana: c.thana?.trim() || '',
  district: c.district,
  state: c.district,
  division: c.district,
  zip: '',
})

// Places an order through the one shared path every checkout uses: payload, API call, tracking and session reset
export const placeOrder = async (input: PlaceOrderInput): Promise<PlaceOrderResult> => {
  const { fbp, fbc, externalId } = getFbIdentifiers()
  const payload: NewOrderPayload = {
    billingInfo: toAddress(input.customer),
    shippingInfo: input.shipping ? toAddress(input.shipping) : input.shipToBilling ? toAddress(input.customer) : null,
    shipToDifferentAddress: !!input.shipping,
    orderPrefix: ORDER_PREFIX,
    orderNotes: input.notes?.trim() || '',
    paymentMethod: PAYMENT_METHOD,
    giftWrap: false,
    subtotal: input.subtotal,
    shippingFee: input.shippingFee,
    shippingTotalAmount: input.shippingFee,
    tax: 0,
    discountTotalAmount: input.discount || 0,
    couponCode: input.couponCode || null,
    total: input.total,
    items: input.items,
    paymentDetails: null,
    timestamp: new Date().toISOString(),
    checkoutSessionId: getCheckoutSessionId(),
    fbp,
    fbc,
    externalId,
    siteKey: 'store',
    clientDomain: typeof window !== 'undefined' ? window.location.hostname : '',
    clientSignals: collectClientSignals(input.honeypot),
    ...(input.asLead ? { setNewOrderAsLead: true } : {}),
    ...(input.promo ? { promo: input.promo } : {}),
    ...(input.extra || {}),
  }
  try {
    const res = await minDelay(createOrder(payload, input.token))
    const data = (res?.data || {}) as Record<string, unknown>
    const orderNumber = String(data.orderNumber || data.id || '').trim()
    const asLead = data.setNewOrderAsLead === true
    trackOrderPlaced(orderNumber, input.trackLines, input.total, asLead, {
      name: input.customer.name, phone: payload.billingInfo.phone, email: input.customer.email, district: input.customer.district,
    })
    resetCheckoutSession()
    return { ok: true, orderNumber, asLead, data }
  } catch (err) {
    const body = err instanceof ApiError ? (err.body as { code?: string; message?: string } | null) : null
    if (body?.code === 'CONTACT_REQUIRED') return { ok: false, reason: 'contact_required', message: body.message || '' }
    return { ok: false, reason: 'failed', message: err instanceof Error ? err.message : '' }
  }
}
