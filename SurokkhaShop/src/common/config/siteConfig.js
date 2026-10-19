/**
 * Site Configuration Helper — Surokkha.shop (dedicated project)
 * Resolves configuration parameters from Vite environment variables (build-time)
 * with hardcoded shop defaults. No multi-site/hostname detection — this project
 * only ever serves surokkha.shop.
 */

export function getSiteConfig() {
  const siteKey = 'shop';

  const domain = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SITE_DOMAIN) || 'surokkha.shop';

  const brandName = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BRAND_NAME) || 'Surokkha Shop';

  const orderPrefix = 'SH';

  const pixelId = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_META_PIXEL_ID) || '';

  const domainVerification = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FACEBOOK_DOMAIN_VERIFICATION) || '';

  const gaMeasurementId = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GA_MEASUREMENT_ID) || 'G-3JHW9WK6GG';

  const apiBaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || 'https://api.surokkha.store';

  const supportEmail = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPPORT_EMAIL) || 'support@surokkha.shop';

  const supportPhone = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPPORT_PHONE) || '01600905774';

  const whatsappNumber = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_WHATSAPP_NUMBER) || '01600905774';

  const facebookUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FACEBOOK_URL) || 'https://www.facebook.com/surokkha.store.bd';

  const instagramUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_INSTAGRAM_URL) || 'https://instagram.com/surokkha.shop';

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
    isShop: true,
    isStore: false,
  };
}

export const SITE_CONFIG = getSiteConfig();
export default SITE_CONFIG;
