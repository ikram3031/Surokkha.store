import { loadSiteConfig } from '@/lib/siteConfig'

// Meta (Facebook) browser pixel. Purchase uses the order number as eventID so it
// de-duplicates against the server-side CAPI Purchase the backend sends with the same id.
// The pixel id is the one saved in the dashboard (Settings > Meta Pixel > Store), served by
// GET /store/v1/site-config: the same settings the backend's store CAPI events use.
// Used only when the site-config API cannot be reached, so tracking keeps working during an API outage
const STORE_FALLBACK_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || '2642398762860982'

type Fbq = ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue: unknown[][]; loaded?: boolean; version?: string; push?: unknown }

declare global {
  interface Window {
    fbq?: Fbq
    _fbq?: Fbq
  }
}

const EXTERNAL_ID_KEY = '_sk_ext_id'
let memoryExternalId = ''

/** Persistent anonymous id of this browser: pixel external_id, CAPI external_id and dashboard visitor id. */
export function getExternalId(): string {
  try {
    let id = localStorage.getItem(EXTERNAL_ID_KEY)
    if (!id) {
      id = memoryExternalId || `sk_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
      localStorage.setItem(EXTERNAL_ID_KEY, id)
    }
    return id
  } catch {
    memoryExternalId ||= `sk_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    return memoryExternalId
  }
}

/** Resolves the pixel id for this site, or '' when the dashboard has the browser pixel turned off. */
async function resolvePixelId(): Promise<string> {
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
  // Same visitor id the backend sends as external_id on every Conversions API event, so Meta pairs them.
  // Manual advanced matching: returning customers' saved checkout details go out with every event.
  activePixelId = pixelId
  fbq('init', pixelId, { ...loadMatchData(), external_id: getExternalId() })
}

// ---- Manual advanced matching (Meta normalises and hashes these in the browser) ----
const MATCH_KEY = '_sk_pixel_ud'
let activePixelId = ''
type MatchData = Record<string, string>

const loadMatchData = (): MatchData => {
  let saved: MatchData = {}
  try {
    saved = JSON.parse(localStorage.getItem(MATCH_KEY) || '{}') || {}
  } catch {
    saved = {}
  }
  return { country: 'bd', ...saved }
}

const toMatchData = (c: { phone?: string; email?: string; fullName?: string; district?: string }): MatchData => {
  const out: MatchData = {}
  let ph = String(c.phone || '').replace(/\D/g, '').replace(/^0+/, '')
  if (ph.startsWith('1')) ph = `880${ph}`
  if (ph) out.ph = ph
  const em = String(c.email || '').trim().toLowerCase()
  if (em) out.em = em
  const parts = String(c.fullName || '').trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (parts[0]) {
    out.fn = parts[0]
    out.ln = parts.slice(1).join(' ') || parts[0]
  }
  const place = String(c.district || '').toLowerCase().replace(/[^a-z]/g, '')
  if (place && place !== 'outsidedhaka') {
    out.ct = place
    out.st = place
  }
  return out
}

// Persists checkout user details and updates active pixel advanced matching before Purchase
export const setPixelUserData = (customer: { phone?: string; email?: string; fullName?: string; district?: string }) => {
  try {
    const data = { ...loadMatchData(), ...toMatchData(customer) }
    try {
      localStorage.setItem(MATCH_KEY, JSON.stringify(data))
    } catch {
      /* storage blocked */
    }
    if (activePixelId && window.fbq) {
      window.fbq('init', activePixelId, { ...data, external_id: getExternalId() })
    }
  } catch {
    /* tracking must never break the storefront */
  }
}

// Starts pixel initialization once after resolving pixel id from site-config
export const initPixel = () => {
  if (starting || typeof window === 'undefined') return
  starting = true
  captureFbclid()
  resolvePixelId()
    .catch(() => STORE_FALLBACK_PIXEL_ID)
    .then((pixelId) => {
      const queued = pending ?? []
      pending = null
      if (!pixelId) return
      bootstrap(pixelId)
      queued.forEach((args) => window.fbq?.(...args))
    })
}

// Tracks a standard Meta pixel event with optional deduplication eventID
export const pixelTrack = (event: string, data?: Record<string, unknown>, eventId?: string) => {
  try {
    const args: unknown[] = eventId ? ['track', event, data ?? {}, { eventID: eventId }] : ['track', event, data ?? {}]
    if (pending) {
      pending.push(args)
      initPixel()
    } else {
      window.fbq?.(...args)
    }
  } catch {
    return
  }
}

// Tracks a custom Meta pixel event (e.g. OrderPlaced) with optional deduplication eventID
export const pixelTrackCustom = (event: string, data?: Record<string, unknown>, eventId?: string) => {
  try {
    const args: unknown[] = eventId
      ? ['trackCustom', event, data ?? {}, { eventID: eventId }]
      : ['trackCustom', event, data ?? {}]
    if (pending) {
      pending.push(args)
      initPixel()
    } else {
      window.fbq?.(...args)
    }
  } catch {
    return
  }
}

// Reads a single cookie value by name
const cookie = (name: string): string => {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : ''
}

// Captures fbclid from the landing URL into the _fbc cookie before SPA navigation strips query params
export const captureFbclid = (): string => {
  try {
    if (typeof window === 'undefined') return ''
    const existing = cookie('_fbc')
    const fbclid = new URLSearchParams(window.location.search).get('fbclid')?.trim()
    if (fbclid && !existing.endsWith(`.${fbclid}`)) {
      const fbc = `fb.1.${Date.now()}.${fbclid}`
      document.cookie = `_fbc=${encodeURIComponent(fbc)}; path=/; max-age=7776000; SameSite=Lax`
      return fbc
    }
    return existing
  } catch {
    return ''
  }
}

// Returns _fbp, _fbc, and external_id so server-side CAPI events match this browser session
export const getFbIdentifiers = (): { fbp?: string; fbc?: string; externalId?: string } => {
  try {
    const fbc = captureFbclid()
    return { fbp: cookie('_fbp') || undefined, fbc: fbc || undefined, externalId: getExternalId() }
  } catch {
    return { externalId: getExternalId() }
  }
}

captureFbclid()
