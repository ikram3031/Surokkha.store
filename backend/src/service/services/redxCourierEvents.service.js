import { applyPathaoUpdate } from "./pathaoCourierEvents.service.js";
import { calculateRedxCharge } from "../../common/services/redx.service.js";

// RedX status (webhook `status` / parcel info `status`) → the shared courier slug that
// applyPathaoUpdate understands, so order status, payment, settlement and the courier bill
// follow exactly the same rules as Pathao.
const SLUG_BY_REDX_STATUS = {
  delivered: "delivered",
  "partial-delivered": "partial_delivery",
  returned: "returned",
  "agent-returning": "return_in_transit",
  paid: "paid",
  "agent-hold": "on_hold",
  cancelled: "pickup_cancelled",
  canceled: "pickup_cancelled",
  rejected: "pickup_cancelled",
};

const LABELS = {
  "pickup-pending": "Pickup Pending",
  "ready-for-delivery": "Ready For Delivery",
  "delivery-in-progress": "Delivery In Progress",
  delivered: "Delivered",
  "agent-hold": "On Hold",
  "agent-returning": "Returning",
  returned: "Returned",
  "agent-area-change": "Area Change",
  paid: "Paid",
  cancelled: "Cancelled",
};

export const redxSlugFor = (status, deliveryType) => {
  const key = String(status || "").toLowerCase().trim();
  if (key === "delivered" && /partial/.test(String(deliveryType || ""))) return "partial_delivery";
  return SLUG_BY_REDX_STATUS[key] || key.replace(/[^a-z0-9]+/g, "_");
};

export const redxLabelFor = (status) => {
  const key = String(status || "").toLowerCase().trim();
  return LABELS[key] || key.split(/[-_ ]+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
};

/**
 * Applies one RedX update (webhook or polled parcel info) to an order document.
 * update: { status, deliveryType, charge, eventAt, source }
 */
// update.charge (optional) = RedX's total charge for the parcel (deliveryCharge + codCharge)
export const applyRedxUpdate = (order, update) =>
  applyPathaoUpdate(order, {
    slug: redxSlugFor(update.status, update.deliveryType),
    statusLabel: redxLabelFor(update.status),
    deliveryFee: update.charge,
    eventAt: update.eventAt,
    source: update.source,
  });

/**
 * RedX's charge for a parcel, from its own charge calculator, using the parcel's current
 * delivery area, pickup area, cash collection and weight (all returned by /parcel/info).
 * Returns { deliveryCharge, codCharge } or null when it can't be calculated.
 */
export const redxChargeForParcel = async (parcel) => {
  const deliveryAreaId = parcel?.delivery_area_id;
  const pickupAreaId = parcel?.pickup_location?.area_id;
  if (!deliveryAreaId || !pickupAreaId) return null;
  const res = await calculateRedxCharge({
    deliveryAreaId,
    pickupAreaId,
    cashCollectionAmount: Number(parcel.cash_collection_amount || 0),
    weight: Number(parcel.parcel_weight || 500),
  });
  const deliveryCharge = Number(res?.deliveryCharge);
  if (!Number.isFinite(deliveryCharge)) return null;
  return { deliveryCharge, codCharge: Number(res?.codCharge || 0) };
};

// Applies polled /parcel/info: status + RedX's calculated delivery and COD charges
export const applyRedxParcel = async (order, parcel, source) => {
  let charge;
  try {
    const quote = await redxChargeForParcel(parcel);
    if (quote) {
      order.courier.deliveryFee = quote.deliveryCharge;
      order.courier.codCharge = quote.codCharge;
      charge = quote.deliveryCharge + quote.codCharge;
    }
  } catch {
    // charge stays as quoted at dispatch
  }
  return applyRedxUpdate(order, { status: parcel.status, deliveryType: parcel.delivery_type, charge, source });
};
