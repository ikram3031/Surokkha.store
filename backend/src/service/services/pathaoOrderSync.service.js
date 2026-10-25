import { OrderModel } from "../../common/models/order.model.js";
import { StoreSettingsModel } from "../../common/models/storeSettings.model.js";
import { getPathaoConfig, getPathaoOrderInfo } from "../../common/services/pathao.service.js";
import { applyPathaoUpdate } from "./pathaoCourierEvents.service.js";
import { logger } from "../../common/config/logger.js";

const OPEN_STATUSES = ["pending", "processing", "shipped"];
// Finished parcels are re-checked until Pathao attaches an invoice id
const INVOICE_LOOKBACK_DAYS = 45;
const INVOICE_CHECK_LIMIT = 100;
let isRunning = false;

const pollOrder = async (order, trigger) => {
  const info = await getPathaoOrderInfo(order.courier.consignmentId);
  const data = info?.data || info;
  if (!data?.order_status) return false;

  const result = await applyPathaoUpdate(order, {
    slug: data.order_status_slug || data.order_status,
    statusLabel: data.order_status,
    invoiceId: data.invoice_id,
    collectedAmount: data.collected_amount,
    deliveryFee: data.delivery_fee,
    eventAt: data.updated_at,
    source: trigger,
  });
  return result !== "no change" && result !== "stale event, status skipped";
};

// Pulls live Pathao status for open consignments, plus invoice ids for finished ones, and reconciles orders
export const syncPathaoOrders = async (trigger = "SCHEDULER") => {
  if (isRunning) return { skipped: true, reason: "Sync already running" };
  isRunning = true;

  try {
    const config = await getPathaoConfig();
    if (!config.isEnabled || !config.clientId) {
      return { skipped: true, reason: "Pathao courier is not configured or disabled" };
    }

    const openOrders = await OrderModel.find({
      "courier.consignmentId": { $nin: [null, ""] },
      status: { $in: OPEN_STATUSES },
    });
    const finishedOrders = await OrderModel.find({
      "courier.consignmentId": { $nin: [null, ""] },
      status: { $in: ["completed", "return"] },
      "courier.dispatchedAt": { $gte: new Date(Date.now() - INVOICE_LOOKBACK_DAYS * 24 * 60 * 60 * 1000) },
      "courier.settlement.invoiceId": { $in: [null, ""] },
      "courier.settlement.status": { $nin: ["settled", "disputed"] },
    })
      .sort({ "courier.dispatchedAt": 1 })
      .limit(INVOICE_CHECK_LIMIT);

    const orders = [...openOrders, ...finishedOrders];
    let updated = 0;
    let failed = 0;

    for (const order of orders) {
      try {
        if (await pollOrder(order, trigger)) updated += 1;
      } catch (err) {
        failed += 1;
        logger.warn({ order: order.orderNumber, err: err.message }, "[PathaoSync] Failed to sync order");
      }
    }

    const summary = `${trigger}: checked ${orders.length} (${openOrders.length} open), updated ${updated}, failed ${failed}`;
    await StoreSettingsModel.updateOne(
      { key: "default" },
      { $set: { "pathaoCourier.lastOrderSyncAt": new Date(), "pathaoCourier.lastOrderSyncSummary": summary } },
      { upsert: true }
    );

    logger.info({ checked: orders.length, updated, failed }, "[PathaoSync] Order sync completed");
    return { checked: orders.length, updated, failed, summary, lastOrderSyncAt: new Date() };
  } finally {
    isRunning = false;
  }
};
