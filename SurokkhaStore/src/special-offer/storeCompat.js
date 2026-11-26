import { pixelTrack } from '@/lib/pixel';
import { trackPageView, trackProductEvents } from '@/lib/api/productEvents';
import { DISTRICT_NAMES, DISTRICT_BN } from '@/data/districts';

// Store versions of the helpers the campaign pages were written against in SurokkhaShop; ordering lives in @/lib/checkout-core

export const SITE_CONFIG = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://web.surokkha.store/store/v1',
  orderPrefix: 'ST',
  siteKey: 'store',
  domain: typeof window !== 'undefined' ? window.location.hostname : 'surokkhastore.shop',
};

export const DISTRICTS = DISTRICT_NAMES.map((name) => ({ name }));

export { DISTRICT_BN, trackProductEvents, pixelTrack };

export const trackSitePage = (pageType) => trackPageView(pageType);
