import { ensurePaymentOnShip, syncPaymentDocument } from "../../common/helper/orderControllerHelper.js";
import { syncCourierBill } from "./pathaoBill.service.js";

// Pathao's COD charge, used only while the real fee is unknown
const ESTIMATED_COD_RATE = 0.01;

// Order statuses Pathao updates may move; cancelled/hold/fake etc. are manual decisions and stay untouched
const COURIER_MANAGED_STATUSES = ["pending", "processing", "shipped", "completed", "return"];

// Settlement states meaning Pathao has paid the parcel out (invoice paid)
export const PAID_OUT_STATUSES = ["invoiced", "settled"];

// Pathao slugs/events (status slugs and webhook events normalise to the same keys) grouped by outcome
const KIND_BY_SLUG = {
  delivered: "delivered",
  partial_delivery: "partial",
  partial_delivered: "partial",
  return: "returned",
  returned: "returned",
  return_id_created: "returned",
  return_in_transit: "returned",
  returned_to_merchant: "returned",
  paid_return: "returned",
  payment_invoice: "invoiced",
  invoiced: "invoiced",
  paid: "invoiced",
  updated: "info",
  store_created: "ignore",
  store_updated: "ignore",
  webhook_integration: "ignore",
};

// "order.pickup-requested" / "Pickup_Requested" -> "pickup_requested"
export const normalizePathaoSlug = (raw) =>
  String(raw || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/^order_/, "");

export const classifyPathaoSlug = (raw) => KIND_BY_SLUG[normalizePathaoSlug(raw)] || "transit";

// "pickup_requested" -> "Pickup Requested"
const humanizeSlug = (slug) => slug.split("_").filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");

// Pathao /info returns "YYYY-MM-DD HH:mm:ss" in Dhaka time; webhooks send ISO timestamps
export const parsePathaoTime = (value) => {
  if (!value) return null;
  const str = String(value).trim();
  const date = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(str) ? new Date(`${str.replace(" ", "T")}+06:00`) : new Date(str);
  return Number.isNaN(date.getTime()) ? null : date;
};

const round2 = (n) => Math.round(n * 100) / 100;
const toNumber = (value) => (value === null || value === undefined || value === "" ? NaN : Number(value));

// What the customer paid before dispatch (order total minus what Pathao was told to collect)
const advanceAmount = (order) => {
  const total = Number(order.totals?.total || 0);
  const toCollect = toNumber(order.courier?.amountToCollect);
  return Number.isFinite(toCollect) ? Math.max(0, round2(total - toCollect)) : 0;
};

// Customer payment once Pathao has paid out: advance + what Pathao collected (never above the order total)
export const paidAmountOnPayout = (order) => {
  const total = Number(order.totals?.total || 0);
  return Math.min(total, round2(advanceAmount(order) + Number(order.courier?.settlement?.collectedAmount || 0)));
};

// Pathao's charge for a parcel: the fee it reported (already includes its charges), else the dispatch estimate + COD
export const estimateCourierCharge = (courier, collected) => {
  const actualFee = toNumber(courier.actualDeliveryFee);
  if (Number.isFinite(actualFee) && actualFee > 0) return { deliveryCharge: actualFee, codFee: 0 };
  return { deliveryCharge: Number(courier.deliveryFee || 0), codFee: round2(collected * ESTIMATED_COD_RATE) };
};

/**
 * Recomputes the estimated courier settlement; invoice-imported (exact) figures are never overwritten.
 * paidOut: Pathao reported the parcel as paid (Payment Invoice) even without an invoice id.
 */
export const recomputeSettlement = (order, { collectedAmount, paidOut = false } = {}) => {
  const courier = order.courier;
  if (!courier.settlement) courier.settlement = {};
  const s = courier.settlement;
  if (s.status === "settled" && s.isEstimated === false) return;
  if (!["completed", "return"].includes(order.status)) return;

  const isReturn = order.status === "return";
  const reported = toNumber(collectedAmount);
  const amountToCollect = toNumber(courier.amountToCollect);
  const isPartial = /partial/.test(courier.orderStatusSlug || "");
  let collected;
  if (Number.isFinite(reported)) collected = reported;
  else if (isReturn) collected = 0;
  else if (isPartial && s.collectedAmount > 0) collected = s.collectedAmount;
  else collected = Number.isFinite(amountToCollect) ? amountToCollect : Number(order.totals?.total || 0);

  const { deliveryCharge, codFee } = estimateCourierCharge(courier, collected);

  s.collectedAmount = round2(collected);
  s.deliveryCharge = round2(deliveryCharge);
  s.codFee = codFee;
  s.totalCharge = round2(deliveryCharge + codFee);
  s.netPayout = round2(collected - deliveryCharge - codFee);
  s.isEstimated = true;
  if (["settled", "disputed"].includes(s.status)) return;
  if (s.invoiceId || paidOut || s.status === "invoiced") {
    s.status = "invoiced";
    if (!s.invoicedAt) s.invoicedAt = new Date();
  } else {
    s.status = "pending";
  }
};

/**
 * Applies one Pathao update (webhook event or polled /info) to an order document and saves it.
 * Pathao only drives the order status and the courier charge; product prices, discounts and the
 * customer's delivery fee are never touched. Delivered stays unpaid until Pathao pays the invoice.
 * update: { slug, statusLabel, deliveryFee, invoiceId, collectedAmount, eventAt, source }
 */
export const applyPathaoUpdate = async (order, update) => {
  const courier = order.courier;
  const slug = normalizePathaoSlug(update.slug);
  const kind = classifyPathaoSlug(slug);
  if (kind === "ignore") return "ignored";

  const eventAt = parsePathaoTime(update.eventAt) || new Date();
  const isStale = Boolean(courier.lastEventAt && eventAt < courier.lastEventAt);
  const notes = [];

  const fee = toNumber(update.deliveryFee);
  if (Number.isFinite(fee) && fee > 0 && fee !== courier.actualDeliveryFee) {
    courier.actualDeliveryFee = fee;
    notes.push(`fee ${fee}`);
  }
  if (update.invoiceId && courier.settlement?.invoiceId !== String(update.invoiceId)) {
    if (!courier.settlement) courier.settlement = {};
    courier.settlement.invoiceId = String(update.invoiceId);
    notes.push(`invoice ${update.invoiceId}`);
  }

  const previousStatus = order.status;
  const wasPaidOut = PAID_OUT_STATUSES.includes(courier.settlement?.status);
  let paymentUpdate = null;

  if (kind !== "info" && !isStale) {
    const label = update.statusLabel || humanizeSlug(slug);
    if (courier.orderStatus !== label) {
      courier.orderStatus = label;
      courier.orderStatusSlug = slug;
      courier.history.push({ status: label, date: eventAt, note: `Auto-synced from Pathao (${update.source})` });
      notes.push(`status ${label}`);
    }
    courier.lastEventAt = eventAt;

    if (COURIER_MANAGED_STATUSES.includes(order.status)) {
      if (kind === "delivered" || kind === "partial" || (kind === "invoiced" && order.status !== "return")) {
        if (order.status !== "completed") {
          order.status = "completed";
          // Delivered, but the money is still with Pathao: keep only what the customer paid in advance
          paymentUpdate = { paidAmount: advanceAmount(order) };
        }
      } else if (kind === "returned") {
        if (order.status !== "return") {
          order.status = "return";
          paymentUpdate = { paymentStatus: "returned", paidAmount: 0 };
        }
      } else if (["pending", "processing"].includes(order.status)) {
        order.status = "shipped";
      }
    }
  }

  if (order.status !== previousStatus) notes.push(`order ${previousStatus} -> ${order.status}`);
  recomputeSettlement(order, {
    collectedAmount: kind === "partial" || kind === "returned" ? update.collectedAmount : undefined,
    paidOut: kind === "invoiced",
  });

  // Pathao paid the invoice: the customer's payment is now received in full (Pathao's charge is a separate bill)
  const isPaidOut = PAID_OUT_STATUSES.includes(courier.settlement?.status);
  if (isPaidOut && !wasPaidOut && order.status === "completed") {
    paymentUpdate = { paidAmount: paidAmountOnPayout(order) };
    notes.push("paid out");
  }

  if (order.isModified()) await order.save();

  if (paymentUpdate) {
    await syncPaymentDocument(order.toObject(), paymentUpdate);
  } else if (order.status === "shipped") {
    await ensurePaymentOnShip(order.toObject());
  }
  await syncCourierBill(order);

  return notes.length ? notes.join(", ") : isStale ? "stale event, status skipped" : "no change";
};
