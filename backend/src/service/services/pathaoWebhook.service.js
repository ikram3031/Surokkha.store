import crypto from "crypto";
import { OrderModel } from "../../common/models/order.model.js";
import { StoreSettingsModel } from "../../common/models/storeSettings.model.js";
import { PathaoWebhookEventModel } from "../../common/models/pathaoWebhookEvent.model.js";
import { logger } from "../../common/config/logger.js";
import { applyPathaoUpdate } from "./pathaoCourierEvents.service.js";

const REPLAY_LIMIT = 500;

// Events are applied one at a time so two updates for the same order never race each other
let queue = Promise.resolve();
const enqueue = (task) => {
  queue = queue.then(task, task);
  return queue;
};

export const getWebhookSettings = async () => {
  const doc = await StoreSettingsModel.findOne({ key: "default" }).select("pathaoCourier").lean();
  const pathao = doc?.pathaoCourier || {};
  return {
    webhookEnabled: Boolean(pathao.webhookEnabled),
    webhookMode: pathao.webhookMode || "log",
    webhookSecret: pathao.webhookSecret || "",
    webhookIntegrationSecret: pathao.webhookIntegrationSecret || "",
    lastWebhookAt: pathao.lastWebhookAt || null,
  };
};

export const generateWebhookSecret = () => crypto.randomBytes(24).toString("hex");

const secretsMatch = (received, expected) => {
  const a = Buffer.from(String(received || ""));
  const b = Buffer.from(String(expected || ""));
  return a.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b);
};

const buildDedupeKey = (body) => {
  const stamp = body.timestamp || body.updated_at;
  const basis = stamp ? `${body.event}|${body.consignment_id}|${stamp}` : JSON.stringify(body);
  return crypto.createHash("sha1").update(basis).digest("hex");
};

// Applies one stored event to its order and records the outcome on the event
const processEvent = async (eventDoc) => {
  const payload = eventDoc.payload || {};
  try {
    const filter = eventDoc.consignmentId
      ? { "courier.consignmentId": eventDoc.consignmentId }
      : eventDoc.merchantOrderId
        ? { "courier.merchantOrderId": eventDoc.merchantOrderId }
        : null;
    const order = filter ? await OrderModel.findOne(filter) : null;

    if (!order) {
      eventDoc.result = "order not found";
    } else {
      eventDoc.orderNumber = order.orderNumber;
      eventDoc.result = await applyPathaoUpdate(order, {
        slug: payload.event,
        deliveryFee: payload.delivery_fee,
        invoiceId: payload.invoice_id,
        collectedAmount: payload.collected_amount,
        eventAt: payload.timestamp || payload.updated_at,
        source: "webhook",
      });
    }
    eventDoc.processed = true;
    eventDoc.error = "";
  } catch (err) {
    eventDoc.error = err.message;
    logger.warn({ event: eventDoc.event, consignmentId: eventDoc.consignmentId, err: err.message }, "[PathaoWebhook] Processing failed");
  }
  await eventDoc.save();
};

/**
 * Handles one incoming webhook request. Returns the HTTP status to answer with;
 * the order update itself runs after the response so Pathao's 10s timeout is never hit.
 */
export const receiveWebhook = async ({ body = {}, signature }) => {
  const settings = await getWebhookSettings();
  const result = { integrationSecret: settings.webhookIntegrationSecret, status: 202, message: "accepted" };

  if (body.event === "webhook_integration") return result;
  if (!settings.webhookEnabled || !settings.webhookSecret) return { ...result, message: "webhook disabled" };
  if (!secretsMatch(signature, settings.webhookSecret)) return { ...result, status: 401, message: "invalid signature" };

  let eventDoc;
  try {
    eventDoc = await PathaoWebhookEventModel.create({
      event: String(body.event || ""),
      consignmentId: body.consignment_id ? String(body.consignment_id) : null,
      merchantOrderId: body.merchant_order_id ? String(body.merchant_order_id) : null,
      eventTimestamp: body.timestamp || body.updated_at || null,
      dedupeKey: buildDedupeKey(body),
      payload: body,
      mode: settings.webhookMode,
    });
  } catch (err) {
    if (err?.code === 11000) return { ...result, message: "duplicate" };
    throw err;
  }

  await StoreSettingsModel.updateOne({ key: "default" }, { $set: { "pathaoCourier.lastWebhookAt": new Date() } });
  if (settings.webhookMode === "process") enqueue(() => processEvent(eventDoc));
  return result;
};

// Applies events stored while in log mode (or that failed), oldest first
export const replayUnprocessedEvents = async () => {
  const events = await PathaoWebhookEventModel.find({ processed: false })
    .sort({ eventTimestamp: 1, receivedAt: 1 })
    .limit(REPLAY_LIMIT);
  await enqueue(async () => {
    for (const eventDoc of events) await processEvent(eventDoc);
  });
  const failed = events.filter((e) => e.error).length;
  return { replayed: events.length, failed };
};

export const listWebhookEvents = async ({ page = 1, limit = 50, event, status } = {}) => {
  const filter = {};
  if (event) filter.event = event;
  if (status === "unprocessed") filter.processed = false;
  if (status === "failed") filter.error = { $ne: "" };
  if (status === "processed") filter.processed = true;

  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * safeLimit;
  const [items, total] = await Promise.all([
    PathaoWebhookEventModel.find(filter).sort({ receivedAt: -1 }).skip(skip).limit(safeLimit).lean(),
    PathaoWebhookEventModel.countDocuments(filter),
  ]);
  return { items: items.map(({ _id, ...rest }) => ({ id: String(_id), ...rest })), total, page: Number(page) || 1, limit: safeLimit };
};
