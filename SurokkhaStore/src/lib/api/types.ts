/** Generic shape returned by paginated list endpoints. The backend's exact
 * field names aren't pinned down yet, so this stays loose/partial —
 * tighten it once the real response shape is confirmed. */
export interface ListResponse<T> {
  data?: T[]
  items?: T[]
  total?: number
  count?: number
  limit?: number
  skip?: number
  [key: string]: unknown
}

export interface ListQuery {
  q?: string
  limit?: number
  skip?: number
  sortBy?: string
  order?: 'asc' | 'desc'
  [key: string]: string | number | boolean | undefined | null
}
