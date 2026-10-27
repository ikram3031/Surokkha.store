import { api } from '@/lib/api/client'

/** CMS-driven data the storefront needs before it first renders (GET /store/v1/site-config). */
export interface SiteConfig {
  cms: {
    /** section key → image path, e.g. { categories: "/uploads/cms/categories.webp?v=…" } */
    sectionBackgrounds: Record<string, string>
  }
}

const EMPTY: SiteConfig = { cms: { sectionBackgrounds: {} } }

let current: SiteConfig = EMPTY
let loading: Promise<SiteConfig> | null = null
const listeners = new Set<() => void>()

/** Starts (once) and returns the site-config request. Never rejects: on failure the empty config stays. */
export function loadSiteConfig(): Promise<SiteConfig> {
  loading ??= api
    .get<{ data?: Partial<SiteConfig> }>('/site-config')
    .then((res) => {
      current = { cms: { sectionBackgrounds: res.data?.cms?.sectionBackgrounds ?? {} } }
      listeners.forEach((fn) => fn())
      return current
    })
    .catch(() => current)
  return loading
}

export const getSiteConfig = () => current

/** For useSyncExternalStore: lets late-arriving config (slow API) still update the page. */
export function subscribeSiteConfig(fn: () => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
