import { applyPathaoUpdate } from "./pathaoCourierEvents.service.js";

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
export const applyRedxUpdate = (order, update) =>
  applyPathaoUpdate(order, {
    slug: redxSlugFor(update.status, update.deliveryType),
    statusLabel: redxLabelFor(update.status),
    deliveryFee: update.charge,
    eventAt: update.eventAt,
    source: update.source,
  });
