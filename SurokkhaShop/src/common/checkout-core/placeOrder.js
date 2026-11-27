import { SITE_CONFIG } from '../config/siteConfig';
import { getCustomerToken } from '../utils/customerAuth';
import { getCheckoutSessionId, resetCheckoutSession, getFbp, getFbc, getExternalId, getFbLoginId } from '../utils/analytics';
import { collectClientSignals, minDelay } from './botGuard';
import { ORDER_PREFIX, PAYMENT_METHOD } from './config';

// Turns a checkout form into the address block the order API expects
export const toAddress = (c) => ({
  fullName: (c.name || c.fullName || '').trim(),
  phone: (c.phone || '').trim(),
  email: (c.email || '').trim(),
  address: (c.address || '').trim(),
  city: (c.city || c.district || '').trim(),
  thana: (c.thana || '').trim(),
  district: (c.district || '').trim(),
  state: (c.division || c.district || '').trim(),
  division: (c.division || c.district || '').trim(),
  zip: (c.zip || '').trim(),
});

// Sends an order through the one shared path every Shop checkout uses: common fields, bot signals, API call and session reset.
// Returns { ok: true, orderNumber, asLead, data, payload } or { ok: false, reason: 'contact_required' | 'failed', code, message }
export const sendOrder = async (payload, { honeypot = '', withToken = false } = {}) => {
  const nowIso = new Date().toISOString();
  const body = {
    checkoutSessionId: getCheckoutSessionId(),
    fbp: getFbp() || undefined,
    fbc: getFbc() || undefined,
    fb_login_id: getFbLoginId() || undefined,
    externalId: getExternalId() || undefined,
    siteKey: SITE_CONFIG.siteKey,
    clientDomain: SITE_CONFIG.domain,
    orderPrefix: ORDER_PREFIX,
    paymentMethod: PAYMENT_METHOD,
    giftWrap: false,
    tax: 0,
    paymentDetails: null,
    timestamp: nowIso,
    createdAt: nowIso,
    ...payload,
    clientSignals: collectClientSignals(honeypot),
  };
  const token = withToken ? getCustomerToken() : null;
  const base = (SITE_CONFIG.apiBaseUrl || 'https://api.surokkha.store').replace(/\/$/, '');
  try {
    const res = await minDelay(fetch(`${base}/api/v1/orders/new-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    }));
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      if (json?.code === 'CONTACT_REQUIRED') {
        return { ok: false, reason: 'contact_required', code: json.code, contactReason: json.reason, message: json.message || '' };
      }
      return { ok: false, reason: 'failed', code: json?.code, message: json?.errors?.join(', ') || json?.message || `Server returned error ${res.status}` };
    }
    const data = json?.data || {};
    const orderNumber = String(data.orderNumber || data.id || json?.orderNumber || '').trim();
    resetCheckoutSession();
    return { ok: true, orderNumber, asLead: data.setNewOrderAsLead === true, data, payload: body };
  } catch (_) {
    return { ok: false, reason: 'failed', message: 'Failed to reach order server. Please check your connection.' };
  }
};

// Builds and sends a single-address order (landing pages): customer, lines and totals in, result out
export const placeOrder = ({ customer, items, subtotal, shippingFee, total, discount = 0, couponCode = null, notes = '', promo, honeypot, extra }) => sendOrder({
  billingInfo: toAddress(customer),
  shippingInfo: null,
  shipToDifferentAddress: false,
  orderNotes: (notes || '').trim(),
  subtotal,
  shippingFee,
  shippingTotalAmount: shippingFee,
  discountTotalAmount: discount,
  couponCode,
  total,
  items,
  ...(promo ? { promo } : {}),
  ...(extra || {}),
}, { honeypot, withToken: !!promo });
