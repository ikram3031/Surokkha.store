import { api } from '@/lib/api/client'

export interface ContactPayload {
  name: string
  email: string
  message: string
  [key: string]: unknown
}

/** POST /store/v1/contact */
export function sendContactMessage(payload: ContactPayload) {
  return api.post<{ success: boolean }>('/contact', payload)
}

/** POST /store/v1/subscribers — newsletter/offer signup by email. */
export function subscribe(email: string) {
  return api.post<{ success: boolean }>('/subscribers', { email })
}
