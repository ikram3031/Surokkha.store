import { api, setAccessToken } from '@/lib/api/client'

export interface LoginPayload {
  email: string
  password: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken?: string
  user?: unknown
  [key: string]: unknown
}

/** POST /store/v1/auth/login — also stores the returned access token. */
export async function login(payload: LoginPayload) {
  const res = await api.post<AuthResponse>('/auth/login', payload)
  if (res.accessToken) setAccessToken(res.accessToken)
  return res
}

/** POST /store/v1/auth/google */
export async function loginWithGoogle(idToken: string) {
  const res = await api.post<AuthResponse>('/auth/google', { idToken })
  if (res.accessToken) setAccessToken(res.accessToken)
  return res
}

/** POST /store/v1/auth/refresh-token */
export async function refreshToken(refreshToken: string) {
  const res = await api.post<AuthResponse>('/auth/refresh-token', { refreshToken })
  if (res.accessToken) setAccessToken(res.accessToken)
  return res
}

/** POST /store/v1/auth/logout — also clears the stored access token. */
export async function logout() {
  try {
    await api.post<void>('/auth/logout', undefined, { auth: true })
  } finally {
    setAccessToken(null)
  }
}

/** POST /store/v1/auth/2fa/send-qr */
export function send2faQr() {
  return api.post<{ qr: string }>('/auth/2fa/send-qr', undefined, { auth: true })
}

/** POST /store/v1/auth/2fa/verify */
export function verify2fa(code: string) {
  return api.post<{ verified: boolean }>('/auth/2fa/verify', { code }, { auth: true })
}

/** GET /store/v1/auth/invite/verify */
export function verifyInvite<T = unknown>(token: string) {
  return api.get<T>('/auth/invite/verify', { token })
}

/** POST /store/v1/auth/invite/accept */
export function acceptInvite(payload: Record<string, unknown>) {
  return api.post<AuthResponse>('/auth/invite/accept', payload)
}
