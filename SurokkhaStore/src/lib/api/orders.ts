import { api } from '@/lib/api/client'

export interface OrderItemInput {
  productId: string
  qty: number
  [key: string]: unknown
}

export interface NewOrderPayload {
  items: OrderItemInput[]
  customer: {
    name: string
    phone: string
    address: string
    district?: string
    thana?: string
  }
  paymentMethod?: 'cod' | 'bkash' | 'nagad'
  couponCode?: string
  [key: string]: unknown
}

export interface Order {
  orderId: string
  /** Order numbers are prefixed "ST" (previously "SH"). */
  orderNumber: string
  [key: string]: unknown
}

/** POST /store/v1/orders/new-order */
export function createOrder(payload: NewOrderPayload) {
  return api.post<Order>('/orders/new-order', payload)
}

/** GET /store/v1/orders/:orderId */
export function getOrder<T = Order>(orderId: string) {
  return api.get<T>(`/orders/${encodeURIComponent(orderId)}`)
}

/** GET /store/v1/orders/:orderId/invoice */
export function getOrderInvoice<T = unknown>(orderId: string) {
  return api.get<T>(`/orders/${encodeURIComponent(orderId)}/invoice`)
}
