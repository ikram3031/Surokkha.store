import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import '@/lib/print-engine/printStyles.css';
import './i18n';
import App from './App.jsx';
import { clientConfig, applyConfigOverrides } from './clientConfig';
import { apiClient, resolveImageUrl } from './lib/api-client';

// Automatically recovers from stale chunk errors when a new deployment occurs
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    window.location.reload();
  });
}

// Fetches the Site Config overrides saved from the dashboard; the cached copy is used if this fails
const loadSiteConfig = async () => {
  try {
    const res = await apiClient.get('/api/v1/settings/public/site-config', { timeout: 3000 });
    const overrides = res.data?.data?.overrides;
    if (overrides && typeof overrides === 'object') applyConfigOverrides(overrides);
  } catch {}
};

// Initialize dynamic page title and favicon per client tenant
const applyBranding = () => {
  if (typeof document === 'undefined') return;
  const brandName = clientConfig?.brandName || '';
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
};

loadSiteConfig().finally(() => {
  applyBranding();
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
