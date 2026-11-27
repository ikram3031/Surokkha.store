import { fbqTrack, trackPurchase, trackProductEvents, syncMetaUserProperties, getStoredUserData } from '../utils/analytics';
import { firstTime, noteAction } from './botGuard';

// Counts a cart click for the bot signals; the Shop's own AddToCart pixel code still sends the event
export const noteCartAction = () => noteAction('cart');

// Counts a checkout step for the bot signals
export const noteCheckoutAction = () => noteAction('checkout');

// Sends Purchase, or Lead for a lead-first order, once per order number.
// order = { orderNumber, items: { key: qty }, totals: { subtotal, grandTotal, deliveryFee }, customer: { name, mobile, email, district, address } }
export const trackOrderPlaced = (order, products = {}, asLead = false) => {
  if (!order?.orderNumber) return;
  if (!asLead) {
    trackPurchase(order, products);
    return;
  }
  if (!firstTime(`lead:${order.orderNumber}`)) return;
  try {
    const stored = getStoredUserData();
    syncMetaUserProperties({
      ...stored,
      phone: order.customer?.mobile || stored.phone,
      email: order.customer?.email || stored.email,
      name: order.customer?.name || stored.name,
      district: order.customer?.district || stored.district,
    });
  } catch (_) { /* advanced matching is optional */ }
  const lines = Object.entries(order.items || {}).filter(([, q]) => q > 0).map(([key, qty]) => {
    const p = products[key.split(':::')[0]] || {};
    return { id: p.did || key, slug: p.slug || key, name: p.name || key, price: Number(p.price) || 0, qty };
  });
  fbqTrack('Lead', {
    content_ids: lines.map((l) => l.id),
    contents: lines.map((l) => ({ id: l.id, quantity: l.qty, item_price: l.price })),
    content_type: 'product',
    num_items: lines.reduce((s, l) => s + l.qty, 0),
    value: Number(order.totals?.grandTotal || 0),
    currency: 'BDT',
  }, order.orderNumber);
  trackProductEvents(lines.map((l) => ({ eventType: 'purchase', productKey: l.slug, productName: l.name, quantity: l.qty, value: l.price * l.qty })));
};
