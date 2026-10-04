import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './lib/print-engine/printStyles.css';
import './i18n';
import App from './App.jsx';
import { clientConfig } from './clientConfig';
import { resolveImageUrl } from './lib/api-client';

// Automatically recovers from stale chunk errors when a new deployment occurs
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    window.location.reload();
  });
}

// Initialize dynamic page title and favicon immediately per client tenant
if (typeof document !== 'undefined') {
  const brandName = clientConfig?.brandName || 'Flexivia';
  document.title = `Dashboard - ${brandName}`;

  const rawFavicon = clientConfig?.siteIconUrl || clientConfig?.logoUrl || '/uploads/assets/logo.webp';
  const cleanFavicon = (!rawFavicon || rawFavicon.includes('demo_logo')) ? '/uploads/assets/logo.webp' : rawFavicon;
  const resolvedFavicon = resolveImageUrl(cleanFavicon);
  if (resolvedFavicon) {
    const version = typeof window !== 'undefined' ? localStorage.getItem('brand_logo_version') || '' : '';
    const link = document.querySelector("link[rel~='icon']");
    if (link) {
      link.href = version ? `${resolvedFavicon}${resolvedFavicon.includes('?') ? '&' : '?'}v=${version}` : resolvedFavicon;
    }
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
