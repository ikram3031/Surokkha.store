// Meta (Facebook) browser pixel. Purchase uses the order number as eventID so it
// de-duplicates against the server-side CAPI Purchase the backend sends with the same id.
const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || '1840805450442709'

type Fbq = ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue: unknown[][]; loaded?: boolean; version?: string; push?: unknown }

declare global {
  interface Window {
    fbq?: Fbq
    _fbq?: Fbq
  }
}

let initialised = false

export function initPixel() {
  if (initialised || !PIXEL_ID || typeof window === 'undefined') return
  initialised = true
  // Standard Meta pixel bootstrap (stub queue + async fbevents.js)
  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args)
    else fbq.queue.push(args)
  } as Fbq
  fbq.push = fbq
  fbq.loaded = true
  fbq.version = '2.0'
  fbq.queue = []
  window.fbq = fbq
  window._fbq = fbq
  const script = document.createElement('script')
  script.async = true
  script.src = 'https://connect.facebook.net/en_US/fbevents.js'
  document.head.appendChild(script)
  fbq('init', PIXEL_ID)
}

export function pixelTrack(event: string, data?: Record<string, unknown>, eventId?: string) {
  try {
    initPixel()
    window.fbq?.('track', event, data ?? {}, eventId ? { eventID: eventId } : undefined)
  } catch {
    /* tracking must never break the storefront */
  }
}

function cookie(name: string): string {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : ''
}

/** _fbp / _fbc let the server-side event match this browser session. */
export function getFbIdentifiers(): { fbp?: string; fbc?: string } {
  try {
    let fbc = cookie('_fbc')
    if (!fbc) {
      const fbclid = new URLSearchParams(window.location.search).get('fbclid')
      if (fbclid) {
        fbc = `fb.1.${Date.now()}.${fbclid}`
        document.cookie = `_fbc=${encodeURIComponent(fbc)}; path=/; max-age=7776000; SameSite=Lax`
      }
    }
    return { fbp: cookie('_fbp') || undefined, fbc: fbc || undefined }
  } catch {
    return {}
  }
}
