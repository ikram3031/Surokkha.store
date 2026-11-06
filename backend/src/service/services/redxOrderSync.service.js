import { OrderModel } from "../../common/models/order.model.js";
import { StoreSettingsModel } from "../../common/models/storeSettings.model.js";
import { getRedxConfig, getRedxParcelInfo } from "../../common/services/redx.service.js";
import { applyRedxUpdate } from "./redxCourierEvents.service.js";
import { logger } from "../../common/config/logger.js";

const OPEN_STATUSES = ["pending", "processing", "shipped"];
// Finished parcels are re-checked for a while so RedX's "paid" status is picked up
const PAYOUT_LOOKBACK_DAYS = 45;
const PAYOUT_CHECK_LIMIT = 100;
let isRunning = false;

// Pulls RedX parcel info for open parcels (and finished ones still awaiting payout) and reconciles orders.
// Runs even when RedX is disabled in Settings → Couriers so parcels already sent keep their accounts updated.
export const syncRedxOrders = async (trigger = "SCHEDULER") => {
  if (isRunning) return { skipped: true, reason: "Sync already running" };
  isRunning = true;
  try {
    const config = await getRedxConfig();
    if (!config.accessToken) return { skipped: true, reason: "RedX courier is not configured" };

    const base = { "courier.provider": "redx", "courier.consignmentId": { $nin: [null, ""] } };
    const openOrders = await OrderModel.find({ ...base, status: { $in: OPEN_STATUSES } });
    const finishedOrders = await OrderModel.find({
      ...base,
      status: { $in: ["completed", "return"] },
      "courier.dispatchedAt": { $gte: new Date(Date.now() - PAYOUT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000) },
      "courier.settlement.status": { $nin: ["invoiced", "settled", "disputed"] },
    })
      .sort({ "courier.dispatchedAt": 1 })
      .limit(PAYOUT_CHECK_LIMIT);

    const orders = [...openOrders, ...finishedOrders];
    let updated = 0;
    let failed = 0;
    for (const order of orders) {
      try {
        const parcel = await getRedxParcelInfo(order.courier.consignmentId);
        if (!parcel?.status) continue;
        const result = await applyRedxUpdate(order, {
          status: parcel.status,
          deliveryType: parcel.delivery_type,
          charge: parcel.charge,
          source: trigger,
        });
        if (result !== "no change" && result !== "stale event, status skipped") updated += 1;
      } catch (err) {
        failed += 1;
        logger.warn({ order: order.orderNumber, err: err.message }, "[RedxSync] Failed to sync order");
      }
    }

    const summary = `${trigger}: checked ${orders.length} (${openOrders.length} open), updated ${updated}, failed ${failed}`;
    await StoreSettingsModel.updateOne(
      { key: "default" },
      { $set: { "redxCourier.lastOrderSyncAt": new Date(), "redxCourier.lastOrderSyncSummary": summary } },
      { upsert: true }
    );
    logger.info({ checked: orders.length, updated, failed }, "[RedxSync] Order sync completed");
    return { checked: orders.length, updated, failed, summary, lastOrderSyncAt: new Date() };
  } finally {
    isRunning = false;
  }
};
