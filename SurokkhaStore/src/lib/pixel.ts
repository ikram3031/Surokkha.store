import { loadSiteConfig } from '@/lib/siteConfig'

// Meta (Facebook) browser pixel. Purchase uses the order number as eventID so it
// de-duplicates against the server-side CAPI Purchase the backend sends with the same id.
//
// Which pixel fires:
// - offer.surokkha.shop keeps the offer page pixel (the backend sends OS orders' CAPI events there too).
// - The store uses the pixel saved in the dashboard (Settings > Meta Pixel > Store), served by
//   GET /store/v1/site-config, the same settings the backend's store CAPI events use.
const OFFER_PIXEL_ID = '1840805450442709'
// Used only when the site-config API cannot be reached, so tracking keeps working during an API outage
const STORE_FALLBACK_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || '2642398762860982'

type Fbq = ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue: unknown[][]; loaded?: boolean; version?: string; push?: unknown }

declare global {
  interface Window {
    fbq?: Fbq
    _fbq?: Fbq
  }
}

const isOfferHost = () => typeof window !== 'undefined' && window.location.hostname.startsWith('offer.')

/** Resolves the pixel id for this site, or '' when the dashboard has the browser pixel turned off. */
async function resolvePixelId(): Promise<string> {
  if (isOfferHost()) return OFFER_PIXEL_ID
  const { metaPixel } = await loadSiteConfig()
  if (!metaPixel) return STORE_FALLBACK_PIXEL_ID
  return metaPixel.enabled ? metaPixel.pixelId : ''
}

// Events fired before the pixel id is known wait here, then go out in order
let pending: unknown[][] | null = []
let starting = false

function bootstrap(pixelId: string) {
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
  fbq('init', pixelId)
}

export function initPixel() {
  if (starting || typeof window === 'undefined') return
  starting = true
  resolvePixelId()
    .catch(() => (isOfferHost() ? OFFER_PIXEL_ID : STORE_FALLBACK_PIXEL_ID))
    .then((pixelId) => {
      const queued = pending ?? []
      pending = null
      if (!pixelId) return // browser pixel disabled in the dashboard: drop queued events
      bootstrap(pixelId)
      queued.forEach((args) => window.fbq?.(...args))
    })
}

export function pixelTrack(event: string, data?: Record<string, unknown>, eventId?: string) {
  try {
    const args: unknown[] = ['track', event, data ?? {}, eventId ? { eventID: eventId } : undefined]
    if (pending) {
      pending.push(args)
      initPixel()
    } else {
      window.fbq?.(...args)
    }
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
