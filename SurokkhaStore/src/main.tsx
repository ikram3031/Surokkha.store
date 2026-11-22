import { StrictMode, type ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
import { loadSiteConfig } from '@/lib/siteConfig'

// The site config (CMS content) loads before anything else renders, so CMS images are
// there on the first paint. A slow API never blocks the site for more than a moment:
// after the timeout the app renders and picks the config up as soon as it arrives.
const SITE_CONFIG_TIMEOUT_MS = 1500

// /special-offer is a standalone campaign page: it loads alone, without the app or its global styles
const isSpecialOffer = window.location.pathname.replace(/\/$/, '') === '/special-offer'

const loadRoot = async (): Promise<ComponentType> => {
  if (isSpecialOffer) {
    // @ts-ignore -- plain JSX page shared with SurokkhaShop, no type declarations
    return (await import('./special-offer/SpecialOfferView.jsx')).default as ComponentType
  }
  const [app] = await Promise.all([import('./App.tsx'), import('./index.css')])
  return app.default
}

Promise.all([
  loadRoot(),
  Promise.race([loadSiteConfig(), new Promise((resolve) => setTimeout(resolve, SITE_CONFIG_TIMEOUT_MS))]),
]).then(([Root]) => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Root />
    </StrictMode>,
  )
})
