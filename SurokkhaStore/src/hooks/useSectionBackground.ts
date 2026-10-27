import { useSyncExternalStore } from 'react'
import { getSiteConfig, subscribeSiteConfig } from '@/lib/siteConfig'
import { resolveMediaUrl } from '@/lib/api/client'

/** Background image URL set in the dashboard (CMS → Section Backgrounds) for a homepage section, if any. */
export function useSectionBackground(key: string): string | undefined {
  const path = useSyncExternalStore(subscribeSiteConfig, () => getSiteConfig().cms.sectionBackgrounds[key])
  return resolveMediaUrl(path)
}
