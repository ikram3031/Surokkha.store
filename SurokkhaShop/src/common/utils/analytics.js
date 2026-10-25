/**
 * Analytics Utility for Meta Pixel, Meta Conversions API (CAPI), and Google Analytics (gtag)
 * Implements Meta Pixel & CAPI with Event Deduplication (eventID matching) and robust EMQ
 */

import { SITE_CONFIG } from '../config/siteConfig.js';

export const META_PIXEL_ID = SITE_CONFIG.pixelId;

const isBrowser = typeof window !== 'undefined';

// Helper: Extract cookie value by name
function getCookie(name) {
  if (!isBrowser || !document.cookie) return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

// Helper: Get _fbc cookie, localStorage, or build from URL fbclid parameter
export function getFbc() {
  const fbcCookie = getCookie('_fbc');
  if (fbcCookie) return fbcCookie;

  const storedFbc = safeStorageGet('_sk_fbc');
  if (storedFbc) return storedFbc;

  if (isBrowser && window.location.search) {
    const urlParams = new URLSearchParams(window.location.search);
    const fbclid = urlParams.get('fbclid');
    if (fbclid) {
      const generatedFbc = `fb.1.${Date.now()}.${fbclid}`;
      safeStorageSet('_sk_fbc', generatedFbc);
      try {
        document.cookie = `_fbc=${encodeURIComponent(generatedFbc)}; path=/; max-age=7776000; SameSite=Lax`;
      } catch (_) {}
      return generatedFbc;
    }
  }
  return null;
}

// Immediately capture fbclid on script load if present
if (isBrowser) {
  try {
    getFbc();
  } catch (_) {}
}

// Safe Storage Helpers (Protects against Safari/Private mode DOMExceptions)
function safeStorageGet(key) {
  try {
    if (isBrowser && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch (e) {
    // Storage access restricted
  }
  return null;
}

function safeStorageSet(key, value) {
  try {
    if (isBrowser && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch (e) {
    // Storage access restricted
  }
}

// Helper: Get or generate persistent _fbp Browser ID
export function getFbp() {
  const cookieFbp = getCookie('_fbp');
  if (cookieFbp) return cookieFbp;
  
  let localFbp = safeStorageGet('_sk_fbp');
  if (!localFbp) {
    localFbp = `fb.1.${Date.now()}.${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    safeStorageSet('_sk_fbp', localFbp);
  }
  return localFbp;
}

// Helper: Get or generate persistent External ID
export function getExternalId() {
  let extId = safeStorageGet('_sk_ext_id');
  if (!extId) {
    extId = 'sk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
    safeStorageSet('_sk_ext_id', extId);
  }
  return extId;
}

// Helper: Get or extract Facebook Login ID (App-Scoped User ID)
export function getFbLoginId() {
  const cookieFbLoginId = getCookie('fb_login_id') || getCookie('_fb_login_id') || getCookie('fblid');
  if (cookieFbLoginId) return cookieFbLoginId;

  const storedFbLoginId = safeStorageGet('_sk_fb_login_id') || safeStorageGet('fb_login_id');
  if (storedFbLoginId) return storedFbLoginId;

  if (isBrowser) {
    if (window._fb_login_id) return String(window._fb_login_id);
    if (window.fbLoginId) return String(window.fbLoginId);

    // Extract from Facebook JS SDK authResponse if active
    try {
      if (typeof window.FB?.getUserID === 'function') {
        const uid = window.FB.getUserID();
        if (uid) {
          safeStorageSet('_sk_fb_login_id', String(uid));
          return String(uid);
        }
      }
      if (typeof window.FB?.getAuthResponse === 'function') {
        const auth = window.FB.getAuthResponse();
        if (auth?.userID) {
          safeStorageSet('_sk_fb_login_id', String(auth.userID));
          return String(auth.userID);
        }
      }
    } catch (_) {}

    // Check URL parameters (e.g. redirected from Facebook Login or social callback)
    if (window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const urlFbId = params.get('fb_login_id') || params.get('fbLoginId') || params.get('fb_id');
      if (urlFbId) {
        safeStorageSet('_sk_fb_login_id', urlFbId);
        try {
          document.cookie = `fb_login_id=${encodeURIComponent(urlFbId)}; path=/; max-age=7776000; SameSite=Lax`;
        } catch (_) {}
        return urlFbId;
      }
    }
  }

  return null;
}

// Setter helper: Store Facebook Login ID into browser cache and cookie
export function setFbLoginId(fbLoginId) {
  if (!fbLoginId) return;
  const cleanId = String(fbLoginId).trim();
  if (!cleanId) return;
  safeStorageSet('_sk_fb_login_id', cleanId);
  if (isBrowser) {
    window._fb_login_id = cleanId;
    try {
      document.cookie = `fb_login_id=${encodeURIComponent(cleanId)}; path=/; max-age=7776000; SameSite=Lax`;
    } catch (_) {}
  }
}

// Helper: SHA-256 hash in lowercase hex
async function sha256(str) {
  if (!str) return null;
  const clean = String(str).trim().toLowerCase();
  if (!clean) return null;
  if (isBrowser && window.crypto && window.crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(clean);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      return null;
    }
  }
  return null;
}

const API_BASE_URL = SITE_CONFIG.apiBaseUrl;

// Helper: Get cached user data from browser storage for Advanced Matching
export function getStoredUserData() {
  const phone = safeStorageGet('_sk_user_phone') || '';
  const email = safeStorageGet('_sk_user_email') || '';
  const name = safeStorageGet('_sk_user_name') || '';
  const district = safeStorageGet('_sk_user_district') || '';
  const extId = getExternalId();
  const fbLoginId = getFbLoginId();

  return {
    phone,
    email,
    name,
    district,
    city: district || 'Dhaka',
    state: district || 'Dhaka',
    division: district || 'Dhaka',
    externalId: extId,
    fb_login_id: fbLoginId || undefined,
  };
}

let metaPixelInitialised = false;

// Sync user identity to Meta Pixel Advanced Matching
export function syncMetaUserProperties(overrideData = null) {
  if (!isBrowser || typeof window.fbq !== 'function') return;
  const user = overrideData || getStoredUserData();
  if (user.phone || user.email || user.name) {
    const userProps = {
      country: 'bd',
      external_id: user.externalId || getExternalId(),
    };
    if (user.email) userProps.em = user.email.trim().toLowerCase();
    if (user.phone) {
      let rawPhone = String(user.phone).replace(/\D/g, '');
      rawPhone = rawPhone.replace(/^0+/, '');
      if (!rawPhone.startsWith('880')) {
        if (rawPhone.startsWith('88') && rawPhone.length > 10) {
          rawPhone = '880' + rawPhone.slice(2);
        } else if (rawPhone.startsWith('1')) {
          rawPhone = '880' + rawPhone;
        }
      }
      userProps.ph = rawPhone;
    }
    if (user.name) {
      const parts = user.name.trim().split(/\s+/);
      userProps.fn = parts[0] || '';
      userProps.ln = parts.slice(1).join(' ') || parts[0] || '';
    }
    if (user.district) {
      userProps.ct = user.district.toLowerCase();
      userProps.st = user.district.toLowerCase();
    }
    // The pixel is already initialised once in index.html. Re-running fbq('init') for the same ID
    // registers a duplicate pixel instance and every event (incl. Purchase) is then sent twice.
    // Advanced matching data is still delivered hashed through the server-side CAPI event.
    try {
      const alreadyInit = !!window.fbq?.instance?.pixelsByID?.[META_PIXEL_ID];
      if (!alreadyInit && !metaPixelInitialised) {
        metaPixelInitialised = true;
        window.fbq('set', 'autoConfig', false, META_PIXEL_ID);
        window.fbq('init', META_PIXEL_ID, userProps);
      }
    } catch (_) {}
  }
}

// Auto-sync stored user properties on script load
if (isBrowser) {
  try {
    syncMetaUserProperties();
  } catch (_) {}
}

// Global in-memory cache for resolved client IP address
let cachedClientIp = null;
let clientIpFetchPromise = null;

// Helper: Resolve public Client IP address for Meta CAPI compliance
export async function getClientIp() {
  if (cachedClientIp) return cachedClientIp;
  const storedIp = safeStorageGet('_sk_cip');
  if (storedIp) {
    cachedClientIp = storedIp;
    return storedIp;
  }

  if (clientIpFetchPromise) return clientIpFetchPromise;

  clientIpFetchPromise = (async () => {
    try {
      // 1. Try our own backend API endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);

      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/client-ip`, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const json = await res.json();
          if (json?.ip) {
            cachedClientIp = json.ip.trim();
            safeStorageSet('_sk_cip', cachedClientIp);
            return cachedClientIp;
          }
        }
      } catch (_) {}

      // 2. High-speed multi-source public IP fallback
      const fallbackController = new AbortController();
      const fbTimeout = setTimeout(() => fallbackController.abort(), 1500);

      try {
        const ipRes = await Promise.any([
          fetch('https://api.ipify.org?format=json', { signal: fallbackController.signal }).then(r => r.json()).then(d => d.ip),
          fetch('https://api64.ipify.org?format=json', { signal: fallbackController.signal }).then(r => r.json()).then(d => d.ip),
          fetch('https://cloudflare.com/cdn-cgi/trace', { signal: fallbackController.signal }).then(r => r.text()).then(t => {
            const m = t.match(/ip=([^\n]+)/);
            return m ? m[1] : null;
          })
        ]);
        clearTimeout(fbTimeout);
        if (ipRes && typeof ipRes === 'string') {
          cachedClientIp = ipRes.trim();
          safeStorageSet('_sk_cip', cachedClientIp);
          return cachedClientIp;
        }
      } catch (_) {}
    } catch (_) {}
    return null;
  })();

  return clientIpFetchPromise;
}

// Prefetch client IP immediately upon module initialization
if (isBrowser) {
  getClientIp();
}

// Generate unique event ID for Pixel/CAPI deduplication
export function generateEventId(prefix = 'evt') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Short-window duplicate guard.
 * Blocks accidental repeat fires of the same event (React re-renders, multiple
 * call sites, back/forward navigation) while still allowing genuine repeated
 * user actions that happen outside the window. Each distinct event signature
 * (eventName + key params) may fire at most once per DEDUP_WINDOW_MS.
 * Returns true when the caller should SKIP the event.
 */
const DEDUP_WINDOW_MS = 2000;
const recentEventSignatures = new Map();
export const isDuplicateEvent = (signature) => {
  if (!signature) return false;
  const now = Date.now();
  // Opportunistic prune so the map can't grow unbounded
  if (recentEventSignatures.size > 50) {
    for (const [key, ts] of recentEventSignatures) {
      if (now - ts > DEDUP_WINDOW_MS) recentEventSignatures.delete(key);
    }
  }
  const last = recentEventSignatures.get(signature);
  if (last && now - last < DEDUP_WINDOW_MS) return true;
  recentEventSignatures.set(signature, now);
  return false;
};

/**
 * Send Meta Conversions API (CAPI) Server Event (Managed securely via backend server)
 */
export async function sendMetaCAPI() {
  // Client-side direct CAPI dispatch is deprecated for security and deduplication accuracy.
  // All CAPI Purchase and Ecommerce events are dispatched server-side with exact event_id matching.
  return;
}

// Safe helper for Meta Pixel (Browser)
export const fbqTrack = (eventName, params = {}, eventId = null) => {
  if (isBrowser && typeof window.fbq === 'function') {
    try {
      const options = eventId ? { eventID: eventId } : undefined;
      if (params && Object.keys(params).length > 0) {
        window.fbq('track', eventName, params, options);
      } else {
        window.fbq('track', eventName, {}, options);
      }
    } catch (e) {
      console.warn('[Meta Pixel Error]:', e);
    }
  }
};

// Safe helper for Google Analytics (gtag)
export const gtagEvent = (eventName, params = {}) => {
  if (isBrowser && typeof window.gtag === 'function') {
    try {
      window.gtag('event', eventName, params);
    } catch (e) {
      console.warn('[Google Analytics Error]:', e);
    }
  }
};

// Canonical Catalog DID Lookup Mapping for 100% Meta Catalog Match Rate
const CATALOG_DID_MAP = {
  // Canonical Full Product Slugs
  'mo-ultimate-3-in-1-latex-contraceptive-30-pcs-combo': '3c9a5f2e8b1d704e',
  'mo-multi-textured-latex-contraceptive-10-pcs': 'b9de8b186df2b554',
  'mo-micro-thin-latex-contraceptive-10-pcs': '788b855254ac89fa',
  'mo-micro-ribbed-natural-latex-contraceptive-10-pcs': '68c019a9c15c38dc',
  'mo-multi-textured-latex-contraceptive-20-pcs-combo': '9e0ce2f921b03ba7',
  'mo-micro-ribbed-natural-latex-contraceptive-20-pcs-combo': '855cf887fda956ad',
  'mo-micro-thin-latex-contraceptive-20-pcs-combo': '11660f3830f449eb',
  // Short Slugs & Catalog Links
  'dotted-condoms-20pcs-combo': '9e0ce2f921b03ba7',
  'ribbed-condoms-20pcs-combo': '855cf887fda956ad',
  'ultra-thin-condoms-20pcs-combo': '11660f3830f449eb',
  'mo-dotted-condom': 'b9de8b186df2b554',
  'mo-ultra-thin-condom': '788b855254ac89fa',
  'mo-ultra-ribbed-condom': '68c019a9c15c38dc',
  'variety-condoms-30pcs-combo': '3c9a5f2e8b1d704e',
  // Legacy aliases
  'mo-dotted': 'b9de8b186df2b554',
  'mo-ultra-thin': '788b855254ac89fa',
  'mo-ultra-ribbed': '68c019a9c15c38dc',
  'combo-26': '3c9a5f2e8b1d704e',
  'combo-duo-passion': '9e0ce2f921b03ba7',
  'combo-duo-intensity': '855cf887fda956ad'
};

// Helper: Resolve canonical Meta Catalog content_id
export const resolveCatalogId = (itemOrKey, fallbackObj = null) => {
  if (!itemOrKey) return 'b9de8b186df2b554';
  if (typeof itemOrKey === 'object') {
    if (itemOrKey.did && String(itemOrKey.did).length >= 12) return String(itemOrKey.did);
    const key = itemOrKey.slug || itemOrKey.id;
    if (key && CATALOG_DID_MAP[key]) return CATALOG_DID_MAP[key];
    if (itemOrKey.id && CATALOG_DID_MAP[itemOrKey.id]) return CATALOG_DID_MAP[itemOrKey.id];
    return String(itemOrKey.did || CATALOG_DID_MAP[itemOrKey.slug] || itemOrKey.id || itemOrKey.slug || 'b9de8b186df2b554');
  }
  const keyStr = String(itemOrKey);
  if (CATALOG_DID_MAP[keyStr]) return CATALOG_DID_MAP[keyStr];
  if (fallbackObj && fallbackObj[keyStr]?.did) return String(fallbackObj[keyStr].did);
  return keyStr;
}

/**
 * 1. Track PageView (Pixel + CAPI + GA4)
 */
export const trackPageView = (pageName = 'home', path = '/') => {
  if (isDuplicateEvent(`PageView|${path}`)) return;
  const eventId = generateEventId('pv');
  fbqTrack('PageView', {}, eventId);
  sendMetaCAPI({ eventName: 'PageView', eventId });
  gtagEvent('page_view', {
    page_title: `${SITE_CONFIG.brandName} - ${pageName}`,
    page_location: isBrowser ? window.location.href : '',
    page_path: path
  });
};

/**
 * 2. Track ViewContent (Pixel + Backend CAPI + GA4)
 */
export const trackViewContent = (product) => {
  if (!product) return;
  
  const isItem = product.itemType === 'item' || product.type === 'item';
  if (isItem) return;
  const value = Number(product.price) || 400;
  const catalogId = resolveCatalogId(product);
  const contentName = product.name || 'MO Wellness Product';
  if (isDuplicateEvent(`ViewContent|${catalogId}`)) return;
  const eventId = generateEventId(`vc_${catalogId}`);
  const customData = {
    content_name: contentName,
    content_ids: [catalogId],
    contents: [
      {
        id: catalogId,
        quantity: 1,
        item_price: value
      }
    ],
    content_type: 'product',
    value: value,
    currency: 'BDT'
  };

  syncMetaUserProperties();
  fbqTrack('ViewContent', customData, eventId);

  // Dispatch to backend CAPI proxy with full advanced matching user payload
  const user = getStoredUserData();
  const fbp = getFbp();
  const fbc = getFbc();
  const fbLoginId = getFbLoginId();
  try {
    fetch(`${API_BASE_URL}/api/v1/events/view-content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productDid: catalogId,
        productName: contentName,
        price: value,
        category: product.brand || 'Personal Wellness',
        fbp,
        fbc,
        fb_login_id: fbLoginId || undefined,
        eventId,
        eventSourceUrl: isBrowser ? window.location.href : '',
        user
      }),
      keepalive: true
    }).catch(() => {});
  } catch (_) {}

  gtagEvent('view_item', {
    currency: 'BDT',
    value: value,
    items: [
      {
        item_id: catalogId,
        item_name: contentName,
        price: value,
        item_brand: product.brand || 'MO',
        item_category: 'Personal Wellness',
        quantity: 1
      }
    ]
  });
};

/**
 * 3. Track AddToCart (Pixel + Backend CAPI + GA4)
 */
export const trackAddToCart = (product, quantity = 1) => {
  if (!product) return;
  
  const isItem = product.itemType === 'item' || product.type === 'item';
  if (isItem) return;

  const unitPrice = Number(product.price) || 400;
  const totalPrice = unitPrice * quantity;
  const catalogId = resolveCatalogId(product);
  const contentName = product.name || 'MO Wellness Product';
  if (isDuplicateEvent(`AddToCart|${catalogId}|${quantity}|${totalPrice}`)) return;
  const eventId = generateEventId(`atc_${catalogId}`);
  const customData = {
    content_name: contentName,
    content_ids: [catalogId],
    contents: [
      {
        id: catalogId,
        quantity: quantity,
        item_price: unitPrice
      }
    ],
    content_type: 'product',
    value: totalPrice,
    currency: 'BDT',
    num_items: quantity
  };

  syncMetaUserProperties();
  fbqTrack('AddToCart', customData, eventId);

  // Dispatch to backend CAPI proxy with full advanced matching user payload
  const user = getStoredUserData();
  const fbp = getFbp();
  const fbc = getFbc();
  const fbLoginId = getFbLoginId();
  try {
    fetch(`${API_BASE_URL}/api/v1/events/add-to-cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productDid: catalogId,
        productName: contentName,
        price: unitPrice,
        quantity,
        currency: 'BDT',
        category: product.brand || 'Personal Wellness',
        fbp,
        fbc,
        fb_login_id: fbLoginId || undefined,
        eventId,
        eventSourceUrl: isBrowser ? window.location.href : '',
        user
      }),
      keepalive: true
    }).catch(() => {});
  } catch (_) {}

  gtagEvent('add_to_cart', {
    currency: 'BDT',
    value: totalPrice,
    items: [
      {
        item_id: catalogId,
        item_name: contentName,
        price: unitPrice,
        item_brand: product.brand || 'MO',
        quantity: quantity
      }
    ]
  });
};

/**
 * 4. Track Add Combo 26 to Cart (Pixel + Backend CAPI + GA4)
 */
export const trackAddComboToCart = (products = {}, productKeys = [], price = 800) => {
  const comboCatalogId = '3c9a5f2e8b1d704e'; // MO Ultimate 3-in-1 Combo
  if (isDuplicateEvent(`AddToCart|${comboCatalogId}|1|${price}`)) return;
  const eventId = generateEventId('atc_combo');

  const customData = {
    content_name: 'MO Ultimate 3-in-1 Latex Contraceptive (30 Pcs Combo)',
    content_ids: [comboCatalogId],
    contents: [
      {
        id: comboCatalogId,
        quantity: 1,
        item_price: price
      }
    ],
    content_type: 'product',
    value: price,
    currency: 'BDT',
    num_items: 1
  };

  syncMetaUserProperties();
  fbqTrack('AddToCart', customData, eventId);

  const user = getStoredUserData();
  const fbp = getFbp();
  const fbc = getFbc();
  const fbLoginId = getFbLoginId();
  try {
    fetch(`${API_BASE_URL}/api/v1/events/add-to-cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productDid: comboCatalogId,
        productName: 'MO Ultimate 3-in-1 Latex Contraceptive (30 Pcs Combo)',
        price: price,
        quantity: 1,
        currency: 'BDT',
        category: 'Personal Wellness',
        fbp,
        fbc,
        fb_login_id: fbLoginId || undefined,
        eventId,
        eventSourceUrl: isBrowser ? window.location.href : '',
        user
      }),
      keepalive: true
    }).catch(() => {});
  } catch (_) {}

  gtagEvent('add_to_cart', {
    currency: 'BDT',
    value: price,
    items: [
      {
        item_id: comboCatalogId,
        item_name: 'MO Ultimate 3-in-1 Latex Contraceptive (30 Pcs Combo)',
        price: price,
        item_brand: 'MO',
        quantity: 1
      }
    ]
  });
};

/**
 * 5. Track InitiateCheckout (Pixel + CAPI + GA4)
 */
// One id per checkout visit: shared by the browser InitiateCheckout event, the saved checkout lead and the order
export function getCheckoutSessionId() {
  let id = safeStorageGet('_sk_checkout_sid');
  if (!id) {
    id = generateEventId('co').replace(/[^\w-]/g, '');
    safeStorageSet('_sk_checkout_sid', id);
  }
  return id;
}

// Called after an order is placed so the next checkout starts a fresh session
export const resetCheckoutSession = () => safeStorageSet('_sk_checkout_sid', '');

let lastInitiateCheckoutData = null;
export const getLastInitiateCheckoutData = () => lastInitiateCheckoutData;

export const trackInitiateCheckout = (cart = {}, products = {}, totals = {}) => {
  const cartEntries = Object.entries(cart).filter(([slug, qty]) => {
    if (qty <= 0) return false;
    const baseSlug = slug.split(':::')[0];
    const p = products[baseSlug];
    if (p && (p.itemType === 'item' || p.type === 'item')) return false;
    return true;
  });

  if (cartEntries.length === 0) return;

  const grandTotal = Number(totals.grandTotal || totals.subtotal || 0);
  const itemCount = cartEntries.reduce((sum, [_, q]) => sum + q, 0);
  if (isDuplicateEvent(`InitiateCheckout|${grandTotal}|${itemCount}`)) return;
  // Same id on the server InitiateCheckout (sent with the saved checkout lead) so Meta merges the pair
  const eventId = `ic_${getCheckoutSessionId()}`;

  const catalogIds = [...new Set(cartEntries.map(([slug]) => resolveCatalogId(slug, products)).filter(Boolean))];
  const contents = cartEntries.map(([slug, qty]) => {
    const p = products[slug];
    const catId = resolveCatalogId(slug, products);
    return {
      id: catId,
      quantity: qty || 1,
      item_price: Number(p?.price || 400)
    };
  });

  const customData = {
    content_ids: catalogIds,
    contents: contents,
    content_type: 'product',
    value: grandTotal,
    currency: 'BDT',
    num_items: itemCount
  };
  lastInitiateCheckoutData = customData;

  fbqTrack('InitiateCheckout', customData, eventId);
  sendMetaCAPI({ eventName: 'InitiateCheckout', eventId, customData });

  gtagEvent('begin_checkout', {
    currency: 'BDT',
    value: grandTotal,
    items: cartEntries.map(([slug, qty]) => {
      const p = products[slug];
      return {
        item_id: resolveCatalogId(slug, products),
        item_name: p?.name || slug,
        price: Number(p?.price || 400),
        quantity: qty || 1
      };
    })
  });
};

/**
 * 6. Track AddPaymentInfo (Pixel + CAPI + GA4)
 */
export const trackAddPaymentInfo = (paymentType = 'Cash on Delivery', totals = {}, cart = {}, products = {}) => {
  const cartEntries = typeof cart === 'object' && cart !== null ? Object.entries(cart).filter(([slug, qty]) => {
    if (qty <= 0) return false;
    const baseSlug = slug.split(':::')[0];
    const p = products[baseSlug];
    if (p && (p.itemType === 'item' || p.type === 'item')) return false;
    return true;
  }) : [];

  if (cartEntries.length === 0) return;

  const grandTotal = Number(totals.grandTotal || totals.subtotal || 0);
  if (isDuplicateEvent(`AddPaymentInfo|${grandTotal}|${paymentType}`)) return;
  const eventId = generateEventId('api');
  const catalogIds = [...new Set(cartEntries.map(([slug]) => resolveCatalogId(slug, products)).filter(Boolean))];

  const customData = {
    content_ids: catalogIds,
    content_type: 'product',
    value: grandTotal,
    currency: 'BDT',
    payment_type: paymentType
  };

  fbqTrack('AddPaymentInfo', customData, eventId);
  sendMetaCAPI({ eventName: 'AddPaymentInfo', eventId, customData });

  gtagEvent('add_payment_info', {
    currency: 'BDT',
    value: grandTotal,
    payment_type: paymentType
  });
};

/**
 * 7. Track Purchase (Pixel + CAPI with User Data + GA4)
 */
const trackedPurchaseOrders = new Set();

export const trackPurchase = (order, products = {}) => {
  if (!order || !order.totals) return;

  // IMPORTANT: Priority must be orderNumber to exactly match the backend CAPI event_id for Meta deduplication!
  const orderId = String(order.orderNumber || order.orderId || ('SS-' + Date.now())).trim();
  if (!orderId) return;

  // 1. In-memory Set deduplication guard
  if (trackedPurchaseOrders.has(orderId)) return;
  trackedPurchaseOrders.add(orderId);

  // 2. Persistent sessionStorage guard to prevent duplicate Purchase events across re-renders and back/forward navigation
  if (isBrowser && typeof window.sessionStorage !== 'undefined') {
    try {
      const sessionKey = `_sk_purchased_${orderId}`;
      if (window.sessionStorage.getItem(sessionKey)) {
        return;
      }
      window.sessionStorage.setItem(sessionKey, String(Date.now()));
    } catch (_) {}
  }
  const purchasedItems = Object.entries(order.items || {}).filter(([slug, qty]) => {
    if (qty <= 0) return false;
    const baseSlug = slug.split(':::')[0];
    const p = products[baseSlug];
    if (p && (p.itemType === 'item' || p.type === 'item')) return false;
    return true;
  });

  if (purchasedItems.length === 0) return;

  const grandTotal = Number(order.totals.grandTotal || order.totals.subtotal || 0);
  const itemCount = purchasedItems.reduce((sum, [_, q]) => sum + q, 0);
  
  const catalogIds = [...new Set(purchasedItems.map(([slug]) => resolveCatalogId(slug, products)).filter(Boolean))];
  const contents = purchasedItems.map(([slug, qty]) => {
    const p = products[slug];
    const catId = resolveCatalogId(slug, products);
    return {
      id: catId,
      quantity: qty || 1,
      item_price: Number(p?.price || 400)
    };
  });

  // Meta requires Purchase value to be present and > 0. Fall back to the sum of
  // line items if the order total is missing/zero so value is never absent.
  const itemsTotal = contents.reduce((sum, c) => sum + (Number(c.item_price) || 0) * (Number(c.quantity) || 1), 0);
  const purchaseValue = grandTotal > 0 ? grandTotal : itemsTotal;

  const customData = {
    content_ids: catalogIds,
    contents: contents,
    content_type: 'product',
    value: purchaseValue,
    currency: 'BDT',
    num_items: itemCount,
    order_id: orderId
  };

  const fbLoginId = order.fb_login_id || order.fbLoginId || getFbLoginId();
  const userData = {
    name: order.customer?.name,
    phone: order.customer?.mobile,
    district: order.customer?.district,
    address: order.customer?.address,
    external_id: orderId,
    ...(fbLoginId ? { fb_login_id: fbLoginId } : {})
  };

  // Browser Pixel with orderId as eventID (Deduplicated with server-side CAPI)
  fbqTrack('Purchase', customData, orderId);

  // Google Analytics 4 purchase event
  gtagEvent('purchase', {
    transaction_id: orderId,
    value: purchaseValue,
    currency: 'BDT',
    shipping: Number(order.totals.deliveryFee || 0),
    items: purchasedItems.map(([slug, qty]) => {
      const p = products[slug];
      return {
        item_id: resolveCatalogId(slug, products),
        item_name: p?.name || slug,
        price: Number(p?.price || 400),
        quantity: qty || 1
      };
    })
  });
};

/**
 * 8. Track Contact
 */
export const trackContact = (channel = 'support') => {
  if (isDuplicateEvent(`Contact|${channel}`)) return;
  const eventId = generateEventId('contact');
  const customData = { contact_channel: channel };

  fbqTrack('Contact', customData, eventId);
  sendMetaCAPI({ eventName: 'Contact', eventId, customData });

  gtagEvent('contact', {
    method: channel
  });
};


/**
 * Save what the customer has typed at checkout so an abandoned checkout is kept in the database and
 * (once a phone number is known) Meta gets one InitiateCheckout carrying the customer data.
 */
export const saveCheckoutLead = (details = {}, keepalive = false) => {
  if (!isBrowser) return;
  try {
    const base = (SITE_CONFIG.apiBaseUrl || '').replace(/\/$/, '');
    fetch(`${base}/api/v1/checkout-leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive,
      body: JSON.stringify({
        sessionId: getCheckoutSessionId(),
        ...details,
        customData: getLastInitiateCheckoutData(),
        fbp: getFbp(),
        fbc: getFbc(),
        sourceUrl: window.location.href
      })
    }).catch(() => {});
  } catch (_) {}
};
