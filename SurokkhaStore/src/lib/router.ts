import { useEffect, useState } from 'react'

// Minimal History-API router: the store only has a handful of pages, so no router library.
export type Route =
  | { name: 'home' }
  | { name: 'product'; slug: string }
  | { name: 'checkout' }
  | { name: 'confirmation' }

export function parseRoute(pathname: string): Route {
  const parts = pathname.split('/').filter(Boolean)
  if (parts[0] === 'product' && parts[1]) return { name: 'product', slug: decodeURIComponent(parts[1]) }
  if (parts[0] === 'checkout') return { name: 'checkout' }
  if (parts[0] === 'order-confirmed') return { name: 'confirmation' }
  return { name: 'home' }
}

export const productPath = (slug: string) => `/product/${encodeURIComponent(slug)}`

const NAV_EVENT = 'surokkha:navigate'

export function navigate(path: string, { replace = false } = {}) {
  if (replace) window.history.replaceState(null, '', path)
  else window.history.pushState(null, '', path)
  window.dispatchEvent(new Event(NAV_EVENT))
  window.scrollTo({ top: 0 })
}

export function useRoute(): Route {
  const [path, setPath] = useState(() => window.location.pathname)
  useEffect(() => {
    const sync = () => setPath(window.location.pathname)
    window.addEventListener('popstate', sync)
    window.addEventListener(NAV_EVENT, sync)
    return () => {
      window.removeEventListener('popstate', sync)
      window.removeEventListener(NAV_EVENT, sync)
    }
  }, [])
  return parseRoute(path)
}
