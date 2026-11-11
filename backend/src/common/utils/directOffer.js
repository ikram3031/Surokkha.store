import { DirectOfferModel } from "../models/directOffer.model.js";

const CACHE_TTL_MS = 30 * 1000;
let cache = { at: 0, offers: [] };

// Validates a dashboard Direct Offer payload and returns { errors, normalized }
export const normalizeDirectOfferPayload = (body = {}) => {
  const errors = [];
  const name = String(body.name || "").trim();
  if (!name) errors.push("Name is required");

  const discountPercent = Math.max(0, Number(body.discountPercent) || 0);
  if (discountPercent > 100) errors.push("Percentage discount cannot exceed 100%");
  const freeDelivery = body.freeDelivery === true;
  if (!(discountPercent > 0) && !freeDelivery) errors.push("Give a percentage discount, free delivery, or both");

  const products = [...new Set((Array.isArray(body.products) ? body.products : []).map((id) => String(id || "").trim()).filter(Boolean))];
  if (products.length === 0) errors.push("Select at least one product");

  // A date-only value (from the dashboard date picker) means the whole day in Bangladesh time,
  // so an offer ending on the 15th still runs through the 15th instead of stopping at its midnight
  const DAY_ONLY = /^\d{4}-\d{2}-\d{2}$/;
  const toDate = (v, endOfDay) => {
    if (!v) return null;
    const s = String(v).trim();
    return new Date(DAY_ONLY.test(s) ? `${s}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}+06:00` : s);
  };
  const validFrom = toDate(body.validFrom, false);
  const validTo = toDate(body.validTo, true);
  if ((validFrom && isNaN(validFrom)) || (validTo && isNaN(validTo))) errors.push("Invalid date");
  else if (validFrom && validTo && validTo < validFrom) errors.push("End date must be after the start date");

  return {
    errors,
    normalized: { name, isActive: body.isActive !== false, discountPercent, freeDelivery, validFrom, validTo, products },
  };
};

// Drops the cached active offers so the next storefront read sees a dashboard change in this process
export const clearDirectOfferCache = () => {
  cache = { at: 0, offers: [] };
};

// Active, in-date Direct Offers, cached briefly because every product response reads them
export const getActiveDirectOffers = async () => {
  if (Date.now() - cache.at < CACHE_TTL_MS) return cache.offers;
  const now = new Date();
  const offers = await DirectOfferModel.find({
    isActive: true,
    $and: [
      { $or: [{ validFrom: null }, { validFrom: { $lte: now } }] },
      { $or: [{ validTo: null }, { validTo: { $gte: now } }] },
    ],
  }).lean();
  cache = { at: Date.now(), offers };
  return offers;
};

// Best offer for one product id: highest percentage, and free delivery when any matching offer gives it
const offerFor = (offers, keys) => {
  const matches = offers.filter((o) => (o.products || []).some((id) => keys.has(id)));
  if (matches.length === 0) return null;
  const best = matches.reduce((a, b) => ((b.discountPercent || 0) > (a.discountPercent || 0) ? b : a));
  return {
    id: String(best._id),
    name: best.name,
    discountPercent: best.discountPercent || 0,
    freeDelivery: matches.some((o) => o.freeDelivery),
  };
};

// Direct Offer price: the percentage comes off the regular price, and the product's own offer price is
// ignored, so a Direct Offer always shows the real price struck through. No percentage means no sale price.
const discounted = (price, percent) => {
  const regular = Number(price) || 0;
  if (!(regular > 0) || !(percent > 0)) return null;
  return Math.round(regular * (1 - percent / 100));
};

// Applies active Direct Offers to serialized storefront products: replaces offerPrice and flags free delivery
export const applyDirectOffers = async (products) => {
  const list = (Array.isArray(products) ? products : [products]).filter(Boolean);
  if (list.length === 0) return products;
  const offers = await getActiveDirectOffers();
  if (offers.length === 0) return products;

  for (const p of list) {
    const keys = new Set([p.id, p._id, p.did].filter(Boolean).map(String));
    const offer = offerFor(offers, keys);
    if (!offer) continue;
    p.directOffer = offer;
    if (offer.freeDelivery) p.freeDelivery = true;
    p.offerPrice = discounted(p.price, offer.discountPercent);
    if (Array.isArray(p.variants)) {
      p.variants = p.variants.map((v) => ({ ...v, offerPrice: discounted(v.price, offer.discountPercent) }));
    }
  }
  return products;
};
