// Resolves site configuration for Surokkha Shop with health and wellness defaults
export const getSiteConfig = () => {
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

  const siteTitle = 'সুরক্ষা | Surokkha Shop – স্বাস্থ্য ও সুস্থতা এবং পার্সোনাল কেয়ার অনলাইন শপ';

  const siteDescription =
    'সুরক্ষা (Surokkha Shop) – বাংলাদেশে প্রিমিয়াম স্বাস্থ্য, সুস্থতা ও পার্সোনাল কেয়ার পণ্য অনলাইনে কিনুন। ক্যাশ অন ডেলিভারি এবং সারা দেশে দ্রুত হোম ডেলিভারি।';

  const siteDescriptionEn =
    'Surokkha Shop – Premium health, wellness and personal care essentials online in Bangladesh.';

  const slogan = 'স্বাস্থ্য ও সুস্থতায় আপনার বিশ্বস্ত সঙ্গী';

  const sloganEn = 'Your Trusted Partner in Health & Wellness';

  const categories = ['Personal Care', 'Skin Care', 'Health & Wellness', 'Daily Essentials', 'Wellness Combo'];

  const categoriesBn = ['পার্সোনাল কেয়ার', 'স্কিন কেয়ার', 'স্বাস্থ্য ও সুস্থতা', 'দৈনন্দিন প্রয়োজনীয়', 'ওয়েলনেস কম্বো'];

  const meta = {
    title: siteTitle,
    description: siteDescription,
    keywords: 'স্বাস্থ্য ও সুস্থতা, পার্সোনাল কেয়ার, স্কিন কেয়ার, Health & Wellness, Personal Care, Wellness Essentials',
    ogImage: 'https://surokkha.shop/fav.png',
  };

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
    siteTitle,
    siteDescription,
    siteDescriptionEn,
    slogan,
    sloganEn,
    categories,
    categoriesBn,
    meta,
    isShop: true,
    isStore: false,
  };
};

export const SITE_CONFIG = getSiteConfig();
export default SITE_CONFIG;
