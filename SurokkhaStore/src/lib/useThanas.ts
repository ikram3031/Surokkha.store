import { useEffect, useState } from 'react'
import { FALLBACK_THANAS } from '@/data/districts'
import { getThanasByDistrict } from '@/lib/api/locations'

// Thana list for a district: live from the API, bundled list as a fallback
const thanaCache: Record<string, string[]> = {}

export function useThanas(district: string) {
  const [options, setOptions] = useState<string[]>([])
  useEffect(() => {
    if (!district) {
      setOptions([])
      return
    }
    if (thanaCache[district]) {
      setOptions(thanaCache[district])
      return
    }
    let cancelled = false
    const fallback = FALLBACK_THANAS[district] ?? []
    setOptions(fallback)
    getThanasByDistrict<{ data?: { name: string }[] }>(district)
      .then((res) => {
        const names = (res.data ?? []).map((t) => t.name).filter(Boolean)
        const next = names.length > 0 ? names : fallback
        if (next.length > 0) thanaCache[district] = next
        if (!cancelled) setOptions(next)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [district])
  return options
}
