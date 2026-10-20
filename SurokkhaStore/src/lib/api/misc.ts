import { api } from '@/lib/api/client'

/** GET /store/v1/client-ip */
export function getClientIp() {
  return api.get<{ ip: string }>('/client-ip')
}
