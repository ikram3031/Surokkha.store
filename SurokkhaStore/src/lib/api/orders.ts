import { api } from '@/lib/api/client'

export interface OrderItemInput {
  productId?: string
  productDid?: string
  itemType: 'product' | 'item'
  name: string
  image?: string
  quantity: number
  unitPrice: number
  size?: string
}

export interface OrderAddress {
  fullName: string
  phone: string
  email?: string
  address: string
  city: string
  thana: string
  district: string
  state: string
  division: string
  zip: string
}

/** Payload accepted by POST /store/v1/orders/new-order (see backend OrdersController.createOrder). */
export interface NewOrderPayload {
  billingInfo: OrderAddress
  shippingInfo: OrderAddress | null
  shipToDifferentAddress: boolean
  orderPrefix: 'ST'
  orderNotes: string
  paymentMethod: 'cod'
  giftWrap: boolean
  subtotal: number
  shippingFee: number
  shippingTotalAmount: number
  tax: number
  discountTotalAmount: number
  couponCode: string | null
  total: number
  items: OrderItemInput[]
  paymentDetails: null
  timestamp: string
  /** Meta cookies so the server-side CAPI event matches this browser. */
  fbp?: string
  fbc?: string
}

export interface Order {
  orderNumber: string
  [key: string]: unknown
}

export interface CreateOrderResponse {
  status: 'success'
  data: Order
}

/** POST /store/v1/orders/new-order */
export function createOrder(payload: NewOrderPayload) {
  return api.post<CreateOrderResponse>('/orders/new-order', payload)
}

/** GET /store/v1/orders/check-phone — flags numbers on the fake-order list. */
export function checkPhone(phone: string) {
  return api.get<{ isFake?: boolean }>('/orders/check-phone', { phone })
}

/** GET /store/v1/orders/:orderId */
export function getOrder<T = Order>(orderId: string) {
  return api.get<T>(`/orders/${encodeURIComponent(orderId)}`)
}

/** GET /store/v1/orders/:orderId/invoice */
export function getOrderInvoice<T = unknown>(orderId: string) {
  return api.get<T>(`/orders/${encodeURIComponent(orderId)}/invoice`)
}
