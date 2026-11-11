import { PromoModel } from "../models/promo.model.js";
import { OrderModel } from "../models/order.model.js";

export const NEW_USER_FREE_DELIVERY = "new-user-free-delivery";

export const getPromo = async () => {
  const doc = await PromoModel.findOne({ key: "main" }).lean();
  return {
    banner: { isActive: false, imageUrl: "", text: "", link: "", ...(doc?.banner || {}) },
    newUserFreeDelivery: { isActive: false, minOrderAmount: 500, ...(doc?.newUserFreeDelivery || {}) },
    updatedAt: doc?.updatedAt || null,
  };
};

// Public shape for the storefronts: the banner only when it is on, and the preset's rules
export const publicPromo = (p) => ({
  banner: p.banner.isActive && (p.banner.imageUrl || p.banner.text) ? { imageUrl: p.banner.imageUrl, text: p.banner.text, link: p.banner.link } : null,
  newUserFreeDelivery: p.newUserFreeDelivery.isActive ? { minOrderAmount: Number(p.newUserFreeDelivery.minOrderAmount) || 0 } : null,
});

const digits = (v) => String(v || "").replace(/\D/g, "").slice(-10);

// A verified customer qualifies for the new-user free delivery until they have placed any order
export const newUserFreeDeliveryFor = async (member) => {
  const promo = await getPromo();
  const rule = promo.newUserFreeDelivery;
  if (!rule.isActive || !member || !member.isEmailVerified) return { eligible: false, minOrderAmount: Number(rule.minOrderAmount) || 0 };
  const or = [{ "billingInfo.email": member.email }];
  const phone = digits(member.phone);
  if (phone.length === 10) or.push({ "billingInfo.phone": { $regex: `${phone}$` } });
  const hasOrder = await OrderModel.exists({ $or: or });
  return { eligible: !hasOrder, minOrderAmount: Number(rule.minOrderAmount) || 0 };
};

// Order guard: an order that claims the new-user free delivery must come from an eligible, logged-in
// customer and meet the minimum. Returns an error message, or null when the order may go ahead.
export const checkNewUserFreeDelivery = async (payload, member) => {
  if (payload?.promo !== NEW_USER_FREE_DELIVERY) return null;
  const { eligible, minOrderAmount } = await newUserFreeDeliveryFor(member);
  if (!eligible) return "The new customer free delivery offer is not available for this account.";
  if (Number(payload.subtotal || 0) < minOrderAmount) return `Free delivery needs an order of at least ৳${minOrderAmount}.`;
  return null;
};
