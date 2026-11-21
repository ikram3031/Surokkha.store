import React from 'react'
import ReactDOM from 'react-dom/client'

const isSpecialOffer = typeof window !== 'undefined' && window.location.pathname.replace(/\/$/, '') === '/special-offer'

// Global guard preventing resource error events from bubbling
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (event && event.target && event.target instanceof Element) {
      if (typeof event.stopImmediatePropagation === 'function') {
        event.stopImmediatePropagation();
      }
    }
  }, true);
}

// Loads the standalone campaign page on /special-offer, otherwise the full shop app with its global styles
const boot = async () => {
  const Root = isSpecialOffer
    ? (await import('../common/views/SpecialOfferView.jsx')).default
    : (await Promise.all([import('../common/App.jsx'), import('../common/index.css')]))[0].default
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <Root />
    </React.StrictMode>,
  )
}

boot()
