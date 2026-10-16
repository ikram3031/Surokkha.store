import { OrderModel } from "../models/order.model.js";
import { StoreSettingsModel } from "../models/storeSettings.model.js";
import { getPathaoConfig, getPathaoOrderInfo } from "./pathao.service.js";
import { logger } from "../config/logger.js";
import { ensurePaymentOnShip, syncPaymentDocument } from "../helper/orderControllerHelper.js";

const OPEN_STATUSES = ["pending", "processing", "shipped"];
let isRunning = false;

// Maps a Pathao status slug to the internal order/payment outcome (see docs/PATHAO_COURIER_API_DOCUMENTATION.md §7.2)
const DELIVERED_SLUGS = ["delivered", "payment_invoice", "paid", "invoiced"];
const PARTIAL_SLUGS = ["partial_delivery", "partial_delivered"];
const RETURNED_SLUGS = ["returned", "return", "paid_return"];

const mapPathaoStatus = (rawSlug) => {
  const slug = String(rawSlug || "").toLowerCase().replace(/[^a-z0-9]+/g, "_");
  if (DELIVERED_SLUGS.includes(slug)) return { status: "completed", paymentStatus: "paid" };
  if (PARTIAL_SLUGS.includes(slug)) return { status: "completed", paymentStatus: "partial" };
  if (RETURNED_SLUGS.includes(slug)) return { status: "return", paymentStatus: "returned" };
  return { status: "shipped", paymentStatus: null };
};

// Pulls live Pathao status for every open consignment and reconciles order status, payment and sync time
export const syncPathaoOrders = async (trigger = "SCHEDULER") => {
  if (isRunning) return { skipped: true, reason: "Sync already running" };
  isRunning = true;

  try {
    const config = await getPathaoConfig();
    if (!config.isEnabled || !config.clientId) {
      return { skipped: true, reason: "Pathao courier is not configured or disabled" };
    }

    const orders = await OrderModel.find({
      "courier.consignmentId": { $nin: [null, ""] },
      status: { $in: OPEN_STATUSES },
    });

    let updated = 0;
    let failed = 0;

    for (const order of orders) {
      try {
        const info = await getPathaoOrderInfo(order.courier.consignmentId);
        const data = info?.data || info;
        const pathaoStatus = data?.order_status;
        if (!pathaoStatus) continue;

        const slug = data.order_status_slug || pathaoStatus;
        const mapped = mapPathaoStatus(slug);
        const changed = order.courier.orderStatus !== pathaoStatus;

        order.courier.orderStatus = pathaoStatus;
        order.courier.orderStatusSlug = String(slug).toLowerCase();
        if (changed) {
          order.courier.history.push({
            status: pathaoStatus,
            date: new Date(),
            note: `Auto-synced from Pathao (${trigger})`,
          });
        }

        const statusChanged = order.status !== mapped.status;
        if (statusChanged) order.status = mapped.status;

        if (changed || order.isModified()) {
          await order.save();
          updated += 1;
        }

        if (mapped.paymentStatus) {
          // Delivered / partial / returned: reconcile the payment record (creates it if the order never had one)
          const codCollected = Number(data.collected_amount ?? data.amount_to_collect ?? NaN);
          const paidAmount =
            mapped.paymentStatus === "paid" ? undefined
            : mapped.paymentStatus === "returned" ? 0
            : Number.isFinite(codCollected) ? codCollected : undefined;
          await syncPaymentDocument(order.toObject(), {
            paymentStatus: mapped.paymentStatus,
            ...(paidAmount !== undefined ? { paidAmount } : {}),
          });
        } else {
          // Still in transit: make sure payment collection is open
          await ensurePaymentOnShip(order.toObject());
        }
      } catch (err) {
        failed += 1;
        logger.warn({ order: order.orderNumber, err: err.message }, "[PathaoSync] Failed to sync order");
      }
    }

    const summary = `${trigger}: checked ${orders.length}, updated ${updated}, failed ${failed}`;
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
