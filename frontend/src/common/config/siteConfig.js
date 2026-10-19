/**
 * Site Configuration Helper
 * Resolves configuration parameters from Vite environment variables (build-time)
 * with robust runtime fallbacks based on window.location.hostname.
 */

const isBrowser = typeof window !== 'undefined';

export function getSiteConfig() {
  const hostname = isBrowser ? window.location.hostname.toLowerCase() : '';
  const isShopHost = hostname.includes('surokkha.shop') || (hostname.includes('shop') && !hostname.includes('store'));
  const isStoreHost = hostname.includes('surokkha.store') || hostname.includes('store');

  const envKey = typeof import.meta !== 'undefined' && import.meta.env?.VITE_SITE_KEY;
  // Browser hostname takes absolute precedence over build-time envKey to guarantee zero cross-talk between store and shop
  const siteKey = isShopHost ? 'shop' : isStoreHost ? 'store' : (envKey || 'store');

  const domain = isShopHost
    ? 'surokkha.shop'
    : isStoreHost
      ? 'surokkha.store'
      : ((typeof import.meta !== 'undefined' && import.meta.env?.VITE_SITE_DOMAIN) || (siteKey === 'shop' ? 'surokkha.shop' : 'surokkha.store'));

  const brandName = isShopHost
    ? 'Surokkha Shop'
    : isStoreHost
      ? 'Surokkha Store'
      : ((typeof import.meta !== 'undefined' && import.meta.env?.VITE_BRAND_NAME) || (siteKey === 'shop' ? 'Surokkha Shop' : 'Surokkha Store'));

  const orderPrefix = siteKey === 'shop' ? 'SSH' : 'SST';

  const pixelId = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_META_PIXEL_ID) ||
    (siteKey === 'shop' ? '1565104865301894' : '1840805450442709');

  const domainVerification = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FACEBOOK_DOMAIN_VERIFICATION) ||
    (siteKey === 'store' ? '19j8puwsyouoywx76lomib7lsa6g7t' : '');

  const gaMeasurementId = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GA_MEASUREMENT_ID) || 'G-3JHW9WK6GG';

  const apiBaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
    'https://api.surokkha.store';

  const supportEmail = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPPORT_EMAIL) ||
    (siteKey === 'shop' ? 'support@surokkha.shop' : 'support@surokkha.store');

  const supportPhone = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPPORT_PHONE) ||
    '01600905774';

  const whatsappNumber = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_WHATSAPP_NUMBER) ||
    '01600905774';

  const facebookUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FACEBOOK_URL) ||
    (siteKey === 'shop' ? 'https://www.facebook.com/surokkha.store.bd' : 'https://facebook.com/surokkha.store');

  const instagramUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_INSTAGRAM_URL) ||
    (siteKey === 'shop' ? 'https://instagram.com/surokkha.shop' : 'https://instagram.com/surokkha.store');

  return {
    siteKey,
    domain,
    brandName,
    orderPrefix,
    pixelId,
    domainVerification,
    gaMeasurementId,
    apiBaseUrl,
    supportEmail,
    supportPhone,
    whatsappNumber,
    facebookUrl,
    instagramUrl,
    isShop: siteKey === 'shop',
    isStore: siteKey === 'store',
  };
}

export const SITE_CONFIG = getSiteConfig();
export default SITE_CONFIG;
