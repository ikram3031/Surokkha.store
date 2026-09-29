import { clientConfig, getActiveClientKey } from '@/clientConfig';

// Cleans and normalizes Looker Studio embed URLs (handles raw URLs, iframe snippets, and non-embed links)
export const cleanLookerStudioEmbedUrl = (rawUrl = '') => {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let url = rawUrl.trim();

  // If user pasted the whole <iframe> tag, extract the src attribute
  const srcMatch = url.match(/src=["']([^"']+)["']/i);
  if (srcMatch && srcMatch[1]) {
    url = srcMatch[1];
  }

  // Convert standard reporting URL to embed URL if needed
  if (url.includes('lookerstudio.google.com/reporting/') && !url.includes('lookerstudio.google.com/embed/reporting/')) {
    url = url.replace('lookerstudio.google.com/reporting/', 'lookerstudio.google.com/embed/reporting/');
  } else if (url.includes('datastudio.google.com/reporting/') && !url.includes('datastudio.google.com/embed/reporting/')) {
    url = url.replace('datastudio.google.com/reporting/', 'datastudio.google.com/embed/reporting/');
  }

  return url;
};

// Retrieves persistent GA4 settings prioritizing verified client configuration
export const getGA4Settings = () => {
  const clientGA = clientConfig?.googleAnalytics || {};
  const clientKey = getActiveClientKey() || 'default';
  const brandName = clientConfig?.brandName || 'Store';

  const defaults = {
    measurementId: clientGA.measurementId || '',
    googleTagId: clientGA.googleTagId || '',
    gtmId: clientGA.gtmId || '',
    streamId: clientGA.streamId || '',
    streamName: clientGA.streamName || (brandName ? `${brandName} Web Stream` : ''),
    propertyId: clientGA.propertyId || '',
    lookerStudioEmbedUrl: clientGA.lookerStudioEmbedUrl || '',
    isVerified: clientGA.isVerified ?? Boolean(clientGA.measurementId),
    enhancedMeasurement: clientGA.enhancedMeasurement ?? true,
  };

  if (typeof window === 'undefined') {
    return defaults;
  }

  try {
    const raw = localStorage.getItem(`ga4_config_${clientKey}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...defaults,
        ...parsed,
        measurementId: clientGA.measurementId || parsed.measurementId || defaults.measurementId,
        propertyId: clientGA.propertyId || parsed.propertyId || defaults.propertyId,
        lookerStudioEmbedUrl: parsed.lookerStudioEmbedUrl || clientGA.lookerStudioEmbedUrl || defaults.lookerStudioEmbedUrl,
      };
    }
  } catch {
    return defaults;
  }

  return defaults;
};

// Saves persistent GA4 settings to local storage
export const saveGA4Settings = (settings) => {
  if (typeof window === 'undefined') return;
  const clientKey = getActiveClientKey() || 'default';
  try {
    localStorage.setItem(`ga4_config_${clientKey}`, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save GA4 settings', error);
  }
};

// Generates the official gtag.js script snippet for storefront implementation
export const generateGtagScript = (measurementId) => {
  return `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', '${measurementId}', {
    send_page_view: true,
    cookie_flags: 'SameSite=None;Secure'
  });
</script>`;
};

// Returns verified GA4 URLs for direct reporting navigation
export const getGA4ReportUrls = (propertyId = '') => {
  const pId = propertyId || clientConfig?.googleAnalytics?.propertyId || '';
  const pPath = pId ? `#/p${pId}/` : '';
  return {
    console: pId ? `https://analytics.google.com/analytics/web/${pPath}reports/dashboard` : 'https://analytics.google.com/analytics/web/',
    realtime: pId ? `https://analytics.google.com/analytics/web/${pPath}realtime/overview` : 'https://analytics.google.com/analytics/web/',
    acquisition: pId ? `https://analytics.google.com/analytics/web/${pPath}reports/acquisition-overview` : 'https://analytics.google.com/analytics/web/',
    engagement: pId ? `https://analytics.google.com/analytics/web/${pPath}reports/engagement-overview` : 'https://analytics.google.com/analytics/web/',
    monetization: pId ? `https://analytics.google.com/analytics/web/${pPath}reports/lifecycle-monetization-overview` : 'https://analytics.google.com/analytics/web/',
    demographics: pId ? `https://analytics.google.com/analytics/web/${pPath}reports/user-demographics-overview` : 'https://analytics.google.com/analytics/web/',
    tech: pId ? `https://analytics.google.com/analytics/web/${pPath}reports/tech-overview` : 'https://analytics.google.com/analytics/web/',
    streams: pId ? `https://analytics.google.com/analytics/web/${pPath}admin/streams/table/` : 'https://analytics.google.com/analytics/web/',
    lookerStudioCreate: 'https://lookerstudio.google.com/reporting/create?ds.ds0.datasourceId=&ds.ds0.type=GA4',
    lookerStudioHome: 'https://lookerstudio.google.com/u/0/navigation/reporting',
  };
};

// Standard Google Analytics 4 Events reference
export const GA4_STANDARD_EVENTS = [
  { name: 'page_view', category: 'Engagement', desc: 'Fired automatically on every URL navigation & page view' },
  { name: 'view_item', category: 'Ecommerce', desc: 'Triggered when a visitor views any product detail page' },
  { name: 'add_to_cart', category: 'Ecommerce', desc: 'Triggered when customer clicks Add to Cart or selects variant' },
  { name: 'begin_checkout', category: 'Ecommerce', desc: 'Triggered when customer enters storefront checkout flow' },
  { name: 'purchase', category: 'Ecommerce', desc: 'Triggered on confirmed order with real transaction ID, revenue & item payload' },
  { name: 'scroll', category: 'Enhanced', desc: 'Fired when user scrolls 90% of page depth (Enhanced Measurement)' },
  { name: 'click', category: 'Enhanced', desc: 'Fired on outbound link clicks to external domains (Enhanced Measurement)' },
  { name: 'view_search_results', category: 'Search', desc: 'Fired when customer searches products on storefront (Enhanced Measurement)' },
];
