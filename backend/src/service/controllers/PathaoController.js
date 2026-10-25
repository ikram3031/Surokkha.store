import mongoose from "mongoose";
import { StoreSettingsModel } from "../../common/models/storeSettings.model.js";
import { LogModel } from "../../common/models/log.model.js";
import {
  getWebhookSettings,
  generateWebhookSecret,
  receiveWebhook,
  replayUnprocessedEvents,
  listWebhookEvents,
} from "../services/pathaoWebhook.service.js";
import {
  listParcels,
  getParcelSummary,
  updateSettlementStatus,
  importInvoiceCsv,
} from "../services/pathaoSettlement.service.js";

// Courier money (charges, payouts) is visible to the store owner only
const canSeeMoney = (req) => String(req.user?.role || "").toLowerCase() === "owner";

const writeLog = async (req, description) => {
  try {
    const actorDid = req.user?.did || "staff";
    await LogModel.create({ type: "updated", typeDid: "121", description, readStatus: false, active: true, createdBy: actorDid, updatedBy: actorDid });
  } catch (logErr) {
    console.error("Failed to create Pathao log:", logErr);
  }
};

const webhookUrlFor = (req) => {
  const host = req.get("x-forwarded-host") || req.get("host");
  return `https://${host}/api/v1/courier/pathao/webhook`;
};

/**
 * Public endpoint Pathao calls for every parcel event (authenticated by X-PATHAO-Signature)
 */
export const pathaoWebhookController = async (req, res, next) => {
  try {
    const result = await receiveWebhook({ body: req.body || {}, signature: req.get("x-pathao-signature") });
    if (result.integrationSecret) res.set("X-Pathao-Merchant-Webhook-Integration-Secret", result.integrationSecret);
    return res.status(result.status).json({ status: result.status === 202 ? "success" : "error", message: result.message });
  } catch (error) {
    next(error);
  }
};

export const getPathaoWebhookConfigController = async (req, res, next) => {
  try {
    const settings = await getWebhookSettings();
    return res.json({ status: "success", data: { ...settings, webhookUrl: webhookUrlFor(req) } });
  } catch (error) {
    next(error);
  }
};

export const updatePathaoWebhookConfigController = async (req, res, next) => {
  try {
    const { webhookEnabled, webhookMode, webhookIntegrationSecret, regenerateSecret } = req.body || {};
    const current = await getWebhookSettings();
    const $set = {};
    if (webhookEnabled !== undefined) $set["pathaoCourier.webhookEnabled"] = Boolean(webhookEnabled);
    if (["log", "process"].includes(webhookMode)) $set["pathaoCourier.webhookMode"] = webhookMode;
    if (webhookIntegrationSecret !== undefined) $set["pathaoCourier.webhookIntegrationSecret"] = String(webhookIntegrationSecret).trim();
    if (regenerateSecret || !current.webhookSecret) $set["pathaoCourier.webhookSecret"] = generateWebhookSecret();

    await StoreSettingsModel.updateOne({ key: "default" }, { $set }, { upsert: true });
    await writeLog(req, `${req.user?.name || "System Admin"} updated Pathao webhook settings.`);

    const settings = await getWebhookSettings();
    return res.json({ status: "success", message: "Pathao webhook settings saved.", data: { ...settings, webhookUrl: webhookUrlFor(req) } });
  } catch (error) {
    next(error);
  }
};

export const listPathaoWebhookEventsController = async (req, res, next) => {
  try {
    return res.json({ status: "success", data: await listWebhookEvents(req.query) });
  } catch (error) {
    next(error);
  }
};

export const replayPathaoWebhookEventsController = async (req, res, next) => {
  try {
    const result = await replayUnprocessedEvents();
    await writeLog(req, `${req.user?.name || "System Admin"} replayed ${result.replayed} Pathao webhook event(s).`);
    return res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
};

export const listPathaoParcelsController = async (req, res, next) => {
  try {
    return res.json({ status: "success", data: { ...(await listParcels(req.query, canSeeMoney(req))), canSeeMoney: canSeeMoney(req) } });
  } catch (error) {
    next(error);
  }
};

export const getPathaoParcelSummaryController = async (req, res, next) => {
  try {
    return res.json({ status: "success", data: { ...(await getParcelSummary(req.query, canSeeMoney(req))), canSeeMoney: canSeeMoney(req) } });
  } catch (error) {
    next(error);
  }
};

export const updatePathaoSettlementController = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ status: "error", message: "Invalid order id" });
    }
    const parcel = await updateSettlementStatus(id, req.body?.status);
    await writeLog(req, `${req.user?.name || "System Admin"} marked Pathao settlement of order #${parcel.orderNumber} as ${req.body?.status}.`);
    return res.json({ status: "success", data: parcel });
  } catch (error) {
    next(error);
  }
};

/**
 * Body is the raw invoice CSV (text/csv); ?apply=true writes, otherwise preview only
 */
export const importPathaoInvoiceController = async (req, res, next) => {
  try {
    const csvText = typeof req.body === "string" ? req.body : "";
    if (!csvText.trim()) {
      return res.status(400).json({ status: "error", message: "Invoice CSV content is required." });
    }
    const apply = String(req.query.apply) === "true";
    const result = await importInvoiceCsv(csvText, { apply, invoiceId: String(req.query.invoiceId || "").trim() });
    if (apply) {
      await writeLog(req, `${req.user?.name || "System Admin"} imported a Pathao invoice: ${result.totals.applicable} parcel(s) settled.`);
    }
    return res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
};
