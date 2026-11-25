import { StrictMode, type ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
import { loadSiteConfig } from '@/lib/siteConfig'
import { captureFbclid, initPixel } from '@/lib/pixel'

captureFbclid()
initPixel()

// The site config (CMS content) loads before anything else renders, so CMS images are
// there on the first paint. A slow API never blocks the site for more than a moment:
// after the timeout the app renders and picks the config up as soon as it arrives.
const SITE_CONFIG_TIMEOUT_MS = 1500

// Standalone campaign pages load alone, without the main app or global styles
const pathname = window.location.pathname.replace(/\/$/, '')
const isSpecialOffer = pathname === '/special-offer'
const isThreeInOne = pathname === '/3-in-1'

const loadRoot = async (): Promise<ComponentType> => {
  if (isSpecialOffer) {
    // @ts-ignore -- plain JSX page shared with SurokkhaShop, no type declarations
    return (await import('./special-offer/SpecialOfferView.jsx')).default as ComponentType
  }
  if (isThreeInOne) {
    // @ts-ignore -- plain JSX page, no type declarations
    return (await import('./three-in-one/ThreeInOneView.jsx')).default as ComponentType
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
