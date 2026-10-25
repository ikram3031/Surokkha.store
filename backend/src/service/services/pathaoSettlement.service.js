import { OrderModel } from "../../common/models/order.model.js";
import { syncPaymentDocument } from "../../common/helper/orderControllerHelper.js";
import { PAID_OUT_STATUSES, paidAmountOnPayout } from "./pathaoCourierEvents.service.js";
import { syncCourierBill } from "./pathaoBill.service.js";

// After a settlement change: a first payout marks the customer payment received, and the charge bill follows
const syncAccountsAfterSettlement = async (orderId, wasPaidOut) => {
  const order = await OrderModel.findById(orderId).lean();
  if (!order) return null;
  const isPaidOut = PAID_OUT_STATUSES.includes(order.courier?.settlement?.status);
  if (isPaidOut && !wasPaidOut && order.status === "completed") {
    await syncPaymentDocument(order, { paidAmount: paidAmountOnPayout(order) });
  }
  await syncCourierBill(order);
  return order;
};

// Pathao statuses that need someone to look at the parcel
const ATTENTION_SLUG_PATTERN = /pickup_failed|pickup_cancel|delivery_failed|on_hold|exchange/i;
const SETTLEMENT_STATUSES = ["pending", "invoiced", "settled", "disputed"];
// Exact vs estimated payout differences below this are rounding noise
const MISMATCH_TOLERANCE = 1;

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const round2 = (n) => Math.round(n * 100) / 100;

const dispatchedRange = ({ from, to }) => {
  const range = {};
  if (from) range.$gte = new Date(from);
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    range.$lte = end;
  }
  return Object.keys(range).length ? range : null;
};

const buildParcelFilter = ({ group, settlement, search, from, to }) => {
  const filter = { "courier.consignmentId": { $nin: [null, ""] } };
  if (group === "in_transit") filter.status = { $in: ["pending", "processing", "shipped"] };
  if (group === "delivered") filter.status = "completed";
  if (group === "returned") filter.status = "return";
  if (group === "attention") filter["courier.orderStatusSlug"] = { $regex: ATTENTION_SLUG_PATTERN };
  if (settlement && SETTLEMENT_STATUSES.includes(settlement)) filter["courier.settlement.status"] = settlement;
  const range = dispatchedRange({ from, to });
  if (range) filter["courier.dispatchedAt"] = range;
  if (search) {
    const regex = new RegExp(escapeRegex(String(search).trim()), "i");
    filter.$or = [
      { orderNumber: regex },
      { "courier.consignmentId": regex },
      { "shippingInfo.fullName": regex },
      { "shippingInfo.phone": regex },
    ];
  }
  return filter;
};

const toParcel = (order, canSeeMoney) => {
  const courier = order.courier || {};
  const parcel = {
    id: String(order._id),
    orderNumber: order.orderNumber,
    orderStatus: order.status,
    paymentStatus: order.paymentStatus,
    customerName: order.shippingInfo?.fullName || "",
    customerPhone: order.shippingInfo?.phone || "",
    district: order.shippingInfo?.district || "",
    consignmentId: courier.consignmentId,
    courierStatus: courier.orderStatus,
    courierStatusSlug: courier.orderStatusSlug,
    needsAttention: ATTENTION_SLUG_PATTERN.test(courier.orderStatusSlug || ""),
    dispatchedAt: courier.dispatchedAt,
    lastEventAt: courier.lastEventAt || null,
  };
  if (canSeeMoney) {
    parcel.amountToCollect = courier.amountToCollect ?? order.totals?.total ?? 0;
    parcel.deliveryFee = courier.deliveryFee || 0;
    parcel.actualDeliveryFee = courier.actualDeliveryFee ?? null;
    parcel.settlement = courier.settlement || { status: "none" };
  }
  return parcel;
};

export const listParcels = async (query = {}, canSeeMoney = false) => {
  const filter = buildParcelFilter({ ...query, settlement: canSeeMoney ? query.settlement : null });
  const limit = Math.min(Math.max(Number(query.limit) || 25, 1), 100);
  const page = Math.max(Number(query.page) || 1, 1);
  const [orders, total] = await Promise.all([
    OrderModel.find(filter)
      .select("orderNumber status paymentStatus shippingInfo totals courier")
      .sort({ "courier.dispatchedAt": -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    OrderModel.countDocuments(filter),
  ]);
  return { items: orders.map((o) => toParcel(o, canSeeMoney)), total, page, limit };
};

export const getParcelSummary = async (query = {}, canSeeMoney = false) => {
  const match = { "courier.consignmentId": { $nin: [null, ""] } };
  const range = dispatchedRange(query);
  if (range) match["courier.dispatchedAt"] = range;

  const facets = {
    byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
    attention: [{ $match: { "courier.orderStatusSlug": { $regex: ATTENTION_SLUG_PATTERN } } }, { $count: "count" }],
  };
  if (canSeeMoney) {
    facets.bySettlement = [
      { $match: { "courier.settlement.status": { $in: SETTLEMENT_STATUSES } } },
      {
        $group: {
          _id: "$courier.settlement.status",
          count: { $sum: 1 },
          netPayout: { $sum: "$courier.settlement.netPayout" },
          collected: { $sum: "$courier.settlement.collectedAmount" },
          charges: { $sum: "$courier.settlement.totalCharge" },
          estimated: { $sum: { $cond: ["$courier.settlement.isEstimated", 1, 0] } },
        },
      },
    ];
    facets.returnCharges = [
      { $match: { status: "return" } },
      { $group: { _id: null, amount: { $sum: "$courier.settlement.totalCharge" }, count: { $sum: 1 } } },
    ];
  }

  const [result] = await OrderModel.aggregate([{ $match: match }, { $facet: facets }]);
  const statusCount = Object.fromEntries((result.byStatus || []).map((s) => [s._id, s.count]));
  const summary = {
    total: Object.values(statusCount).reduce((sum, n) => sum + n, 0),
    inTransit: (statusCount.pending || 0) + (statusCount.processing || 0) + (statusCount.shipped || 0),
    delivered: statusCount.completed || 0,
    returned: statusCount.return || 0,
    attention: result.attention?.[0]?.count || 0,
  };

  if (canSeeMoney) {
    const empty = { count: 0, netPayout: 0, collected: 0, charges: 0, estimated: 0 };
    const settlement = Object.fromEntries(SETTLEMENT_STATUSES.map((s) => [s, { ...empty }]));
    for (const row of result.bySettlement || []) {
      settlement[row._id] = {
        count: row.count,
        netPayout: round2(row.netPayout),
        collected: round2(row.collected),
        charges: round2(row.charges),
        estimated: row.estimated,
      };
    }
    summary.settlement = settlement;
    summary.totalCharges = round2(SETTLEMENT_STATUSES.reduce((sum, s) => sum + settlement[s].charges, 0));
    summary.returnCharges = round2(result.returnCharges?.[0]?.amount || 0);
  }
  return summary;
};

// Manual override from the dashboard (e.g. mark a parcel disputed or paid out)
export const updateSettlementStatus = async (orderId, status) => {
  if (!SETTLEMENT_STATUSES.includes(status)) throw Object.assign(new Error("Invalid settlement status"), { statusCode: 400 });
  const $set = { "courier.settlement.status": status };
  if (status === "settled") $set["courier.settlement.settledAt"] = new Date();
  const before = await OrderModel.findOneAndUpdate(
    { _id: orderId, "courier.consignmentId": { $nin: [null, ""] } },
    { $set },
    { new: false }
  ).lean();
  if (!before) throw Object.assign(new Error("Pathao parcel not found"), { statusCode: 404 });
  const order = await syncAccountsAfterSettlement(orderId, PAID_OUT_STATUSES.includes(before.courier?.settlement?.status));
  return toParcel(order, true);
};

/* ---------------------------- Invoice CSV import ---------------------------- */

// Minimal RFC 4180 parser (quoted fields, escaped quotes, CRLF)
const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  const src = String(text || "").replace(/^﻿/, "");
  for (let i = 0; i < src.length; i += 1) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((v) => String(v).trim() !== ""));
};

const normalizeHeader = (h) => String(h || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

// Checked in order; the first unclaimed header that matches wins
const COLUMN_MATCHERS = [
  ["consignmentId", [/consignment/]],
  ["invoiceId", [/invoice_(id|no|number)/, /^invoice$/]],
  ["codFee", [/cod_(fee|charge)/]],
  ["deliveryCharge", [/delivery_(charge|fee)/]],
  ["totalCharge", [/total_(charge|fee)/]],
  ["netPayout", [/pay_?out/, /paid_out/, /payable/, /net_(amount|payout)/, /merchant_amount/]],
  ["collectedAmount", [/collected/, /cod_amount/, /amount_to_collect/, /cash_collect/]],
];

const detectColumns = (headers) => {
  const normalized = headers.map(normalizeHeader);
  const columns = {};
  const claimed = new Set();
  for (const [key, patterns] of COLUMN_MATCHERS) {
    const index = normalized.findIndex((h, i) => !claimed.has(i) && patterns.some((p) => p.test(h)));
    if (index >= 0) {
      columns[key] = index;
      claimed.add(index);
    }
  }
  return columns;
};

const parseMoney = (value) => {
  const cleaned = String(value ?? "").replace(/[^0-9.-]/g, "");
  return cleaned === "" ? NaN : Number(cleaned);
};

const readExactFigures = (cells, columns) => {
  const pick = (key) => (columns[key] === undefined ? NaN : parseMoney(cells[columns[key]]));
  let collected = pick("collectedAmount");
  const delivery = pick("deliveryCharge");
  const cod = pick("codFee");
  let total = pick("totalCharge");
  let net = pick("netPayout");

  if (!Number.isFinite(total) && (Number.isFinite(delivery) || Number.isFinite(cod))) {
    total = (Number.isFinite(delivery) ? delivery : 0) + (Number.isFinite(cod) ? cod : 0);
  }
  if (!Number.isFinite(net) && Number.isFinite(collected) && Number.isFinite(total)) net = collected - total;
  if (!Number.isFinite(collected) && Number.isFinite(net) && Number.isFinite(total)) collected = net + total;
  if (!Number.isFinite(net) || !Number.isFinite(collected)) return null;

  return {
    collectedAmount: round2(collected),
    deliveryCharge: round2(Number.isFinite(delivery) ? delivery : Number.isFinite(total) ? total - (Number.isFinite(cod) ? cod : 0) : 0),
    codFee: round2(Number.isFinite(cod) ? cod : 0),
    totalCharge: round2(Number.isFinite(total) ? total : collected - net),
    netPayout: round2(net),
  };
};

/**
 * Matches a Pathao invoice CSV against orders. With apply=false it only previews;
 * with apply=true it writes the exact figures and marks the parcels settled.
 */
export const importInvoiceCsv = async (csvText, { apply = false, invoiceId: fallbackInvoiceId = "" } = {}) => {
  const rows = parseCsv(csvText);
  const headerIndex = rows.findIndex((r) => r.some((cell) => /consignment/i.test(cell)));
  if (headerIndex < 0) {
    throw Object.assign(new Error("No consignment ID column found. Upload the invoice exported from Pathao as CSV."), { statusCode: 400 });
  }

  const headers = rows[headerIndex].map((h) => String(h).trim());
  const columns = detectColumns(headers);
  const dataRows = rows
    .slice(headerIndex + 1)
    .map((cells) => ({ cells, consignmentId: String(cells[columns.consignmentId] || "").trim() }))
    .filter((r) => r.consignmentId && !/total/i.test(r.consignmentId));

  const orders = await OrderModel.find({ "courier.consignmentId": { $in: dataRows.map((r) => r.consignmentId) } })
    .select("orderNumber status courier.consignmentId courier.settlement")
    .lean();
  const orderByConsignment = new Map(orders.map((o) => [o.courier.consignmentId, o]));

  const results = dataRows.map(({ cells, consignmentId }) => {
    const order = orderByConsignment.get(consignmentId);
    const exact = readExactFigures(cells, columns);
    const invoiceId = (columns.invoiceId !== undefined && String(cells[columns.invoiceId] || "").trim()) || fallbackInvoiceId || null;
    const current = order?.courier?.settlement || {};
    const estimatedNet = Number.isFinite(current.netPayout) ? current.netPayout : null;
    const alreadySettled = current.status === "settled" && current.isEstimated === false && (!invoiceId || current.invoiceId === invoiceId);

    let error = "";
    if (!order) error = "Order not found";
    else if (!exact) error = "Could not read amounts";

    return {
      consignmentId,
      orderId: order ? String(order._id) : null,
      orderNumber: order?.orderNumber || null,
      orderStatus: order?.status || null,
      invoiceId,
      exact,
      estimatedNetPayout: estimatedNet,
      difference: exact && estimatedNet !== null ? round2(exact.netPayout - estimatedNet) : null,
      mismatch: Boolean(exact && estimatedNet !== null && current.isEstimated !== false && Math.abs(exact.netPayout - estimatedNet) >= MISMATCH_TOLERANCE),
      alreadySettled,
      error,
    };
  });

  const applicable = results.filter((r) => !r.error && !r.alreadySettled);
  if (apply && applicable.length) {
    const now = new Date();
    await OrderModel.bulkWrite(
      applicable.map((r) => ({
        updateOne: {
          filter: { _id: r.orderId },
          update: {
            $set: {
              "courier.settlement.status": "settled",
              "courier.settlement.isEstimated": false,
              "courier.settlement.collectedAmount": r.exact.collectedAmount,
              "courier.settlement.deliveryCharge": r.exact.deliveryCharge,
              "courier.settlement.codFee": r.exact.codFee,
              "courier.settlement.totalCharge": r.exact.totalCharge,
              "courier.settlement.netPayout": r.exact.netPayout,
              "courier.settlement.invoiceId": r.invoiceId,
              "courier.settlement.settledAt": now,
              "courier.settlement.source": "invoice_import",
            },
          },
        },
      }))
    );
    // Invoice figures are exact, so the customer payment is always re-synced from them
    for (const r of applicable) {
      await syncAccountsAfterSettlement(r.orderId, false);
    }
  }

  const detectedColumns = Object.fromEntries(Object.entries(columns).map(([key, index]) => [key, headers[index]]));
  return {
    applied: Boolean(apply),
    headers,
    detectedColumns,
    totals: {
      rows: results.length,
      matched: results.filter((r) => r.orderId).length,
      applicable: applicable.length,
      alreadySettled: results.filter((r) => r.alreadySettled).length,
      mismatched: results.filter((r) => r.mismatch).length,
      errors: results.filter((r) => r.error).length,
      netPayout: round2(applicable.reduce((sum, r) => sum + r.exact.netPayout, 0)),
      totalCharge: round2(applicable.reduce((sum, r) => sum + r.exact.totalCharge, 0)),
    },
    rows: results,
  };
};
