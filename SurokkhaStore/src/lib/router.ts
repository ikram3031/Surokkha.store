import { useEffect, useState } from 'react'

// Minimal History-API router: the store only has a handful of pages, so no router library.
export type Route =
  | { name: 'home' }
  | { name: 'home-classic' }
  | { name: 'product'; slug: string }
  | { name: 'offer' }
  | { name: 'group-offer'; slug: string }
  | { name: 'category'; slug: string }
  | { name: 'checkout' }
  | { name: 'account' }
  | { name: 'confirmation' }

export function parseRoute(pathname: string): Route {
  const parts = pathname.split('/').filter(Boolean)
  if (parts[0] === 'product' && parts[1]) return { name: 'product', slug: decodeURIComponent(parts[1]) }
  if (parts[0] === 'offer') return { name: 'offer' }
  if (parts[0] === 'group-offer' && parts[1]) return { name: 'group-offer', slug: decodeURIComponent(parts[1]) }
  if (parts[0] === 'category' && parts[1]) return { name: 'category', slug: decodeURIComponent(parts[1]) }
  if (parts[0] === 'home-classic') return { name: 'home-classic' }
  if (parts[0] === 'checkout') return { name: 'checkout' }
  if (parts[0] === 'account') return { name: 'account' }
  if (parts[0] === 'order-confirmed') return { name: 'confirmation' }
  // offer.surokkha.shop serves the offer page at its root
  if (parts.length === 0 && typeof window !== 'undefined' && window.location.hostname.startsWith('offer.')) return { name: 'offer' }
  return { name: 'home' }
}

export const categoryPath = (slug: string) => `/category/${encodeURIComponent(slug)}`

export const groupOfferPath = (slug: string) => `/group-offer/${encodeURIComponent(slug)}`

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
