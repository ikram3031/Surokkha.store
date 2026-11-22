import { getExternalId, getFbIdentifiers, pixelTrack, setPixelUserData } from '@/lib/pixel';
import { trackPageView, trackProductEvents } from '@/lib/api/productEvents';
import { getCheckoutSessionId, resetCheckoutSession, saveCheckoutLead as storeSaveCheckoutLead } from '@/lib/api/checkoutLeads';
import { DISTRICT_NAMES, DISTRICT_BN } from '@/data/districts';

// Store versions of the helpers the special offer page was written against in SurokkhaShop

export const SITE_CONFIG = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://web.surokkha.store/store/v1',
  orderPrefix: 'ST',
  siteKey: 'store',
  domain: typeof window !== 'undefined' ? window.location.hostname : 'surokkhastore.shop',
};

export const DISTRICTS = DISTRICT_NAMES.map((name) => ({ name }));

export { DISTRICT_BN, getCheckoutSessionId, resetCheckoutSession, getExternalId, trackProductEvents, pixelTrack };

export const getFbp = () => getFbIdentifiers().fbp || '';

export const getFbc = () => getFbIdentifiers().fbc || '';

export const getFbLoginId = () => '';

export const trackSitePage = (pageType) => trackPageView(pageType);

// Purchase pixel event (eventID = order number, so Meta dedupes it with the server CAPI event) plus product funnel lines
export const trackPurchase = (order, products = {}) => {
  const entries = Object.entries(order.items || {});
  if (!entries.length) return;
  if (order.customer) {
    setPixelUserData({ phone: order.customer.mobile, email: order.customer.email, fullName: order.customer.name, district: order.customer.district });
  }
  pixelTrack('Purchase', {
    content_ids: entries.map(([did]) => did),
    contents: entries.map(([did, qty]) => ({ id: did, quantity: qty, item_price: Number(products[did]?.price) || 0 })),
    content_type: 'product',
    num_items: entries.reduce((s, [, qty]) => s + qty, 0),
    value: order.totals?.grandTotal || 0,
    currency: 'BDT',
  }, order.orderNumber || undefined);
  trackProductEvents(entries.map(([did, qty]) => ({
    eventType: 'purchase',
    productKey: products[did]?.slug || did,
    productName: products[did]?.name || did,
    quantity: qty,
    value: (Number(products[did]?.price) || 0) * qty,
  })));
};

// Abandoned-checkout lead with the Meta identifiers the server needs to match this browser
export const saveCheckoutLead = (details, keepalive = false) => {
  const { fbp, fbc } = getFbIdentifiers();
  return storeSaveCheckoutLead({ ...details, fbp, fbc, externalId: getExternalId() }, keepalive);
};
