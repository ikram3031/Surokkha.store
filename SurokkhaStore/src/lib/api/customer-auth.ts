import { api } from '@/lib/api/client'
import { L } from '@/lib/i18n'

export interface Customer {
  id: string
  did?: string
  name: string
  email: string
  phone: string
}

interface SessionResponse {
  data: { customer: Customer; accessToken: string }
}

const TOKEN_KEY = 'surokkha-customer-token'
/** Fired on window whenever the customer logs in or out, so the header can refresh. */
export const SESSION_EVENT = 'surokkha-customer-session'

export function getCustomerToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function setCustomerToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* storage may be blocked (private mode) — the session then lasts until the page closes */
  }
  window.dispatchEvent(new Event(SESSION_EVENT))
}

async function startSession(res: SessionResponse): Promise<Customer> {
  setCustomerToken(res.data.accessToken)
  return res.data.customer
}

/** POST /store/v1/customer-auth/register — emails a 6-digit code; the account opens after verifyEmail. */
export function register(payload: { name: string; email: string; password: string; phone: string }) {
  return api.post<{ data: { verificationRequired: boolean; email: string }; message?: string }>('/customer-auth/register', payload)
}

/** POST /store/v1/customer-auth/verify-email — finishes sign-up and logs the customer in. */
export async function verifyEmail(payload: { email: string; otp: string }) {
  return startSession(await api.post<SessionResponse>('/customer-auth/verify-email', payload))
}

/** POST /store/v1/customer-auth/resend-verification */
export function resendVerification(email: string) {
  return api.post<{ message: string }>('/customer-auth/resend-verification', { email })
}

export interface CheckoutAddress {
  fullName: string
  phone: string
  address: string
  district: string
  thana: string
}

/** GET /store/v1/customer-auth/checkout-details — the logged-in customer's details from their latest order (null when logged out). */
export async function fetchCheckoutDetails(): Promise<{ billing: CheckoutAddress & { email: string }; shipping: CheckoutAddress | null } | null> {
  const token = getCustomerToken()
  if (!token) return null
  try {
    const res = await api.get<{ data: { billing: CheckoutAddress & { email: string }; shipping: CheckoutAddress | null } }>('/customer-auth/checkout-details', undefined, { token })
    return res.data
  } catch {
    return null
  }
}

/** GET /store/v1/customer-auth/promo — preset offers the logged-in customer can use (null when logged out). */
export async function fetchMyPromo(): Promise<{ newUserFreeDelivery: { minOrderAmount: number } | null } | null> {
  const token = getCustomerToken()
  if (!token) return null
  try {
    const res = await api.get<{ data: { newUserFreeDelivery: { minOrderAmount: number } | null } }>('/customer-auth/promo', undefined, { token })
    return res.data
  } catch {
    return null
  }
}

/** POST /store/v1/customer-auth/login */
export async function login(payload: { email: string; password: string }) {
  return startSession(await api.post<SessionResponse>('/customer-auth/login', payload))
}

/** POST /store/v1/customer-auth/forgot-password — emails a 6-digit code (same answer whether or not the account exists). */
export function forgotPassword(email: string) {
  return api.post<{ message: string }>('/customer-auth/forgot-password', { email })
}

/** POST /store/v1/customer-auth/reset-password — also logs the customer in. */
export async function resetPassword(payload: { email: string; otp: string; password: string }) {
  return startSession(await api.post<SessionResponse>('/customer-auth/reset-password', payload))
}

/** GET /store/v1/customer-auth/me — null when there is no valid session (the stale token is dropped). */
export async function fetchCurrentCustomer(): Promise<Customer | null> {
  const token = getCustomerToken()
  if (!token) return null
  try {
    const res = await api.get<{ data: { customer: Customer } }>('/customer-auth/me', undefined, { token })
    return res.data.customer
  } catch {
    setCustomerToken(null)
    return null
  }
}

export function logout() {
  setCustomerToken(null)
}

export type CustomerOrderStatus = 'pending' | 'confirmed' | 'shipped' | 'out' | 'delivered' | 'cancelled' | 'returned'

export interface CustomerOrder {
  id: string
  status: CustomerOrderStatus
  createdAt: string
  updatedAt: string
  total: number
  subtotal: number
  shipping: number
  discount: number
  paymentMethod: string
  paymentStatus: string
  items: { name: string; qty: number; price: number; image: string; size: string }[]
  courier: {
    provider: string
    consignmentId: string
    trackingCode: string
    status: string
    dispatchedAt: string | null
    deliveredAt: string | null
    lastEventAt: string | null
  }
  shippingInfo: { fullName?: string; phone?: string; address?: string; thana?: string; district?: string } | null
}

export interface SavedAddress {
  id: number
  label: 'Home' | 'Office' | 'Other'
  name: string
  phone: string
  division: string
  district: string
  area: string
  address: string
  isDefault: boolean
}

function authed() {
  const token = getCustomerToken()
  if (!token) throw new Error(L('Please log in to continue', 'চালিয়ে যেতে লগইন করুন'))
  return { token }
}

/** GET /store/v1/customer-auth/orders — the logged-in customer's orders, newest first. */
export async function fetchMyOrders(): Promise<CustomerOrder[]> {
  const res = await api.get<{ data: CustomerOrder[] }>('/customer-auth/orders', undefined, authed())
  return res.data
}

/** GET /store/v1/customer-auth/addresses */
export async function fetchMyAddresses(): Promise<SavedAddress[]> {
  const res = await api.get<{ data: SavedAddress[] }>('/customer-auth/addresses', undefined, authed())
  return res.data
}

/** PUT /store/v1/customer-auth/addresses — replaces the saved list; returns what the server kept. */
export async function saveMyAddresses(addresses: SavedAddress[]): Promise<SavedAddress[]> {
  const res = await api.put<{ data: SavedAddress[] }>('/customer-auth/addresses', { addresses }, authed())
  return res.data
}
