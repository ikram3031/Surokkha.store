import { SITE_CONFIG } from '../../config/siteConfig';
import { DISTRICTS } from '../../data/districts';
import { fbqTrack, trackSitePage, trackProductEvents, getCheckoutSessionId } from '../../utils/analytics';
import { placeOrder as sendLandingOrder, trackOrderPlaced, noteCartAction, noteCheckoutAction, firstTime, minDelay, useCheckoutLead } from '../../checkout-core';

// Shop versions of the helpers the combo-offer page was written against in SurokkhaStore; ordering runs on the Shop checkout core

export { SITE_CONFIG, trackSitePage, trackProductEvents, minDelay, useCheckoutLead };
export { forgotPassword, verifyEmail } from '../../utils/customerAuth';

export const pixelTrack = (event, data, eventId) => fbqTrack(event, data, eventId);

export const STORE_WHATSAPP_NUMBER = `88${String(SITE_CONFIG.whatsappNumber || '01600905774').replace(/^\+?88/, '')}`;

/** Converts Bangla digits in a value to Western digits. */
export const toEnDigits = (value) => String(value).replace(/[০-৯]/g, (d) => '০১২৩৪৫৬৭৮৯'.indexOf(d));

/** Converts the Western digits in a value to Bangla digits. */
export const bn = (n) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);

/** Formats an amount as a Bangla taka string, e.g. tk(1470) -> "৳১,৪৭০". */
export const tk = (n) => '৳' + bn(Number(n).toLocaleString('en-IN'));

/** Normalises a typed phone number to the local 01XXXXXXXXX form. */
export const cleanPhone = (value) => {
  const digits = toEnDigits(value).replace(/[^\d]/g, '');
  return digits.startsWith('880') ? digits.slice(2) : digits;
};

/** Flags a phone number that is already wrong while it is still being typed. */
export const phoneWrongSoFar = (value) => {
  const p = cleanPhone(value);
  if (!p || '880'.startsWith(p)) return false;
  return !/^0(1([3-9]\d{0,8})?)?$/.test(p);
};

/** The district names the campaign pages offer, sorted for the picker. */
export const OFFER_DISTRICT_NAMES = DISTRICTS.map((d) => d.name).sort((a, b) => a.localeCompare(b));

/** Tells whether each mandatory checkout field value is acceptable. */
export const FIELD_OK = {
  name: (v) => v.trim().length >= 2,
  phone: (v) => /^01[3-9]\d{8}$/.test(cleanPhone(v)),
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
  district: (v) => OFFER_DISTRICT_NAMES.includes(v),
  thana: (v) => v.trim().length >= 2,
  address: (v) => v.trim().length >= 5,
};

// Sends AddToCart once per product per page session, counting every click for the bot signals
export const trackAddToCart = (line) => {
  noteCartAction();
  if (!firstTime(`atc:${line.id}`)) return;
  fbqTrack('AddToCart', { value: line.price, currency: 'BDT', content_ids: [line.id], content_name: line.name, content_type: 'product' });
  trackProductEvents([{ eventType: 'add_to_cart', productKey: line.slug || line.id, productName: line.name, quantity: 1, value: line.price }]);
};

// Sends InitiateCheckout once per checkout session with the ic_<sessionId> event id the server dedupes on
export const trackInitiateCheckout = (lines, total) => {
  noteCheckoutAction();
  if (!firstTime('ic')) return;
  fbqTrack('InitiateCheckout', {
    value: total,
    currency: 'BDT',
    content_ids: lines.map((l) => l.id),
    content_type: 'product',
    num_items: lines.reduce((s, l) => s + l.qty, 0),
  }, `ic_${getCheckoutSessionId()}`);
  trackProductEvents(lines.map((l) => ({ eventType: 'checkout', productKey: l.slug || l.id, productName: l.name, quantity: l.qty, value: l.price * l.qty })));
};

// Store-shaped placeOrder: sends through the Shop core, then fires Lead or Purchase from the track lines
export const placeOrder = async ({ customer, items, trackLines = [], subtotal, shippingFee, total, notes, asLead, honeypot }) => {
  const res = await sendLandingOrder({
    customer, items, subtotal, shippingFee, total, notes, honeypot,
    extra: asLead ? { setNewOrderAsLead: true } : undefined,
  });
  if (res.ok) {
    const orderItems = {};
    const products = {};
    trackLines.forEach((l) => {
      orderItems[l.id] = l.qty;
      products[l.id] = { did: l.id, slug: l.slug, name: l.name, price: l.price };
    });
    trackOrderPlaced({
      orderNumber: res.orderNumber,
      items: orderItems,
      totals: { subtotal, grandTotal: total, deliveryFee: shippingFee },
      customer: { name: customer.name, mobile: customer.phone, email: customer.email, district: customer.district, address: customer.address },
    }, products, res.asLead);
  }
  return res;
};
