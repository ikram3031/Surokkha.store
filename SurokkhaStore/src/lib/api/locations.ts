import { api } from '@/lib/api/client'

/** GET /store/v1/locations/districts/:district/thanas */
export function getThanasByDistrict<T = string[]>(district: string) {
  return api.get<T>(`/locations/districts/${encodeURIComponent(district)}/thanas`)
}
