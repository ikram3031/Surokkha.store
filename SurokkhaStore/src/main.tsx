import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { loadSiteConfig } from '@/lib/siteConfig'

// The site config (CMS content) loads before anything else renders, so CMS images are
// there on the first paint. A slow API never blocks the site for more than a moment:
// after the timeout the app renders and picks the config up as soon as it arrives.
const SITE_CONFIG_TIMEOUT_MS = 1500

Promise.race([loadSiteConfig(), new Promise((resolve) => setTimeout(resolve, SITE_CONFIG_TIMEOUT_MS))]).then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
