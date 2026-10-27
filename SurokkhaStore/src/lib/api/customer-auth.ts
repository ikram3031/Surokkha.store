import { api } from '@/lib/api/client'

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
}

async function startSession(res: SessionResponse): Promise<Customer> {
  setCustomerToken(res.data.accessToken)
  return res.data.customer
}

/** POST /store/v1/customer-auth/register */
export async function register(payload: { name: string; email: string; password: string; phone?: string }) {
  return startSession(await api.post<SessionResponse>('/customer-auth/register', payload))
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
