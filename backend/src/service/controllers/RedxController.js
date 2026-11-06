import crypto from "crypto";
import { StoreSettingsModel } from "../../common/models/storeSettings.model.js";
import { OrderModel } from "../../common/models/order.model.js";
import { LogModel } from "../../common/models/log.model.js";
import { ensurePaymentOnShip } from "../../common/helper/orderControllerHelper.js";
import { syncCourierBill } from "../services/pathaoBill.service.js";
import { syncRedxOrders } from "../services/redxOrderSync.service.js";
import { applyRedxUpdate, redxLabelFor, redxSlugFor } from "../services/redxCourierEvents.service.js";
import {
  getRedxConfig,
  testRedxConnection,
  getRedxAreas,
  getRedxPickupStores,
  getRedxPickupStore,
  createRedxPickupStore,
  calculateRedxCharge,
  createRedxParcel,
  getRedxParcelInfo,
  trackRedxParcel,
  cancelRedxParcel,
} from "../../common/services/redx.service.js";

const maskToken = (str) => (!str ? "" : str.length <= 8 ? "****" : `${str.slice(0, 4)}****${str.slice(-4)}`);

const webhookUrlFor = (req, token) => {
  const host = req.get("x-forwarded-host") || req.get("host");
  return token ? `https://${host}/api/v1/courier/redx/webhook?token=${token}` : "";
};

const writeLog = async (req, description) => {
  try {
    const actor = req.user?.did || "staff";
    await LogModel.create({ type: "updated", typeDid: "121", description, readStatus: false, active: true, createdBy: actor, updatedBy: actor });
  } catch (err) {
    console.error("Failed to write RedX log:", err.message);
  }
};

// Same rules as Pathao: Bangladeshi 11-digit number (01XXXXXXXXX)
const cleanBdPhone = (raw) => {
  let phone = String(raw || "").trim().replace(/\D/g, "");
  if (phone.startsWith("880")) phone = phone.slice(2);
  if (!phone.startsWith("0")) phone = `0${phone}`;
  return phone;
};

const findOrder = (orderId) =>
  OrderModel.findOne({
    $or: [{ orderNumber: orderId }, { did: orderId }, ...(/^[0-9a-fA-F]{24}$/.test(orderId) ? [{ _id: orderId }] : [])],
  });

const settingsResponse = (config, req) => ({
  environment: config.environment,
  baseUrl: config.baseUrl,
  accessToken: maskToken(config.accessToken),
  hasAccessToken: Boolean(config.accessToken),
  pickupStoreId: config.pickupStoreId,
  pickupStoreName: config.pickupStoreName,
  pickupAreaId: config.pickupAreaId,
  defaultParcelWeight: config.defaultParcelWeight,
  isClosedBox: config.isClosedBox,
  webhookUrl: webhookUrlFor(req, config.webhookToken),
  lastWebhookAt: config.lastWebhookAt,
  lastTestedAt: config.lastTestedAt,
  lastTestStatus: config.lastTestStatus,
  lastTestMessage: config.lastTestMessage,
  lastOrderSyncAt: config.lastOrderSyncAt,
  lastOrderSyncSummary: config.lastOrderSyncSummary,
});

export const getRedxSettingsController = async (req, res, next) => {
  try {
    return res.json({ status: "success", data: settingsResponse(await getRedxConfig(), req) });
  } catch (error) {
    next(error);
  }
};

export const updateRedxSettingsController = async (req, res, next) => {
  try {
    const { environment = "production", accessToken = "", pickupStoreId = null, defaultParcelWeight = 500, isClosedBox = false } = req.body || {};
    const current = await getRedxConfig();
    const update = {
      "redxCourier.environment": environment === "sandbox" ? "sandbox" : "production",
      "redxCourier.defaultParcelWeight": Number(defaultParcelWeight) || 500,
      "redxCourier.isClosedBox": Boolean(isClosedBox),
      updatedBy: req.user?.userId || null,
    };
    const token = String(accessToken || "").trim();
    if (token && !token.includes("****")) update["redxCourier.accessToken"] = token;
    if (!current.webhookToken) update["redxCourier.webhookToken"] = crypto.randomBytes(24).toString("hex");

    if (pickupStoreId) {
      update["redxCourier.pickupStoreId"] = Number(pickupStoreId);
    } else {
      update["redxCourier.pickupStoreId"] = null;
      update["redxCourier.pickupStoreName"] = "";
      update["redxCourier.pickupAreaId"] = null;
    }

    await StoreSettingsModel.findOneAndUpdate({ key: "default" }, { $set: update }, { upsert: true, setDefaultsOnInsert: true });

    // Cache the pickup store's area: the charge calculator needs pickup_area_id
    if (pickupStoreId) {
      try {
        const store = await getRedxPickupStore(pickupStoreId);
        if (store) {
          await StoreSettingsModel.updateOne(
            { key: "default" },
            { $set: { "redxCourier.pickupStoreName": store.name || "", "redxCourier.pickupAreaId": store.area_id || null } }
          );
        }
      } catch (err) {
        console.error("Failed to load RedX pickup store details:", err.message);
      }
    }

    await writeLog(req, `${req.user?.name || "System Admin"} updated RedX Courier settings.`);
    return res.json({ status: "success", message: "RedX settings saved.", data: settingsResponse(await getRedxConfig(), req) });
  } catch (error) {
    next(error);
  }
};

export const testRedxConnectionController = async (req, res, next) => {
  try {
    const { accessToken, environment } = req.body || {};
    const token = accessToken && !String(accessToken).includes("****") ? String(accessToken).trim() : undefined;
    let status = "connected";
    let message = "";
    let pickupStores = [];
    try {
      ({ pickupStores } = await testRedxConnection({ accessToken: token, environment }));
      message = `Connected. ${pickupStores.length} pickup store(s) found.`;
    } catch (err) {
      status = "failed";
      message = err.message;
    }
    await StoreSettingsModel.updateOne(
      { key: "default" },
      { $set: { "redxCourier.lastTestedAt": new Date(), "redxCourier.lastTestStatus": status, "redxCourier.lastTestMessage": message } },
      { upsert: true }
    );
    return res.status(status === "connected" ? 200 : 400).json({
      status: status === "connected" ? "success" : "error",
      message,
      data: { pickupStores },
    });
  } catch (error) {
    next(error);
  }
};

export const getRedxAreasController = async (req, res, next) => {
  try {
    const areas = await getRedxAreas({ postCode: req.query.post_code, districtName: req.query.district_name });
    return res.json({ status: "success", data: areas });
  } catch (error) {
    next(error);
  }
};

export const getRedxPickupStoresController = async (req, res, next) => {
  try {
    return res.json({ status: "success", data: await getRedxPickupStores() });
  } catch (error) {
    next(error);
  }
};

export const createRedxPickupStoreController = async (req, res, next) => {
  try {
    const { name, phone, address, area_id } = req.body || {};
    if (!name || !phone || !address || !area_id) {
      return res.status(400).json({ status: "error", message: "name, phone, address and area_id are required." });
    }
    const store = await createRedxPickupStore({ name: String(name).trim(), phone: cleanBdPhone(phone), address: String(address).trim(), area_id });
    return res.json({ status: "success", data: store });
  } catch (error) {
    next(error);
  }
};

export const calculateRedxChargeController = async (req, res, next) => {
  try {
    const config = await getRedxConfig();
    const { delivery_area_id, cash_collection_amount = 0, weight } = req.body || {};
    const pickupAreaId = req.body?.pickup_area_id || config.pickupAreaId;
    if (!delivery_area_id || !pickupAreaId) {
      return res.status(400).json({ status: "error", message: "delivery_area_id and a pickup store (with area) are required." });
    }
    const charge = await calculateRedxCharge({
      deliveryAreaId: delivery_area_id,
      pickupAreaId,
      cashCollectionAmount: cash_collection_amount,
      weight: weight || config.defaultParcelWeight,
    });
    return res.json({ status: "success", data: charge });
  } catch (error) {
    next(error);
  }
};

/**
 * Dispatch one order to RedX (creates a parcel and stores the tracking id on the order)
 */
export const createRedxParcelController = async (req, res, next) => {
  try {
    const config = await getRedxConfig();
    const {
      orderId,
      customer_name,
      customer_phone,
      customer_address,
      delivery_area,
      delivery_area_id,
      cash_collection_amount = 0,
      parcel_weight,
      value,
      instruction = "",
      is_closed_box,
      pickup_store_id,
      updateOrderStatus = "shipped",
    } = req.body || {};

    if (!orderId) return res.status(400).json({ status: "error", message: "orderId is required." });
    const order = await findOrder(String(orderId));
    if (!order) return res.status(404).json({ status: "error", message: "Order not found." });
    if (order.courier?.consignmentId) {
      return res.status(409).json({ status: "error", message: `Order is already dispatched (${order.courier.provider || "pathao"} ${order.courier.consignmentId}).` });
    }

    const phone = cleanBdPhone(customer_phone);
    if (phone.length !== 11) {
      return res.status(400).json({ status: "error", message: `Customer phone "${customer_phone}" is invalid. Must be a valid 11-digit BD number (e.g. 01712345678).` });
    }
    if (!customer_name || !customer_address || !delivery_area || !delivery_area_id) {
      return res.status(400).json({ status: "error", message: "customer_name, customer_address, delivery_area and delivery_area_id are required." });
    }

    const amountToCollect = Math.max(0, Number(cash_collection_amount) || 0);
    const weight = Number(parcel_weight) || config.defaultParcelWeight || 500;
    const declaredValue = Number(value) || Number(order.totals?.total || 0) || amountToCollect;
    const merchantInvoiceId = `${order.orderNumber}-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;
    const storeId = pickup_store_id || config.pickupStoreId;

    const payload = {
      customer_name: String(customer_name).trim(),
      customer_phone: phone,
      delivery_area: String(delivery_area).trim(),
      delivery_area_id: Number(delivery_area_id),
      customer_address: String(customer_address).trim(),
      merchant_invoice_id: merchantInvoiceId,
      cash_collection_amount: String(amountToCollect),
      parcel_weight: weight,
      instruction: String(instruction || "").trim(),
      value: declaredValue,
      is_closed_box: String(is_closed_box ?? config.isClosedBox),
      ...(storeId ? { pickup_store_id: Number(storeId) } : {}),
    };

    // Estimate the charge up front so the courier bill exists from the dispatch day
    let deliveryFee = 0;
    if (config.pickupAreaId) {
      try {
        const charge = await calculateRedxCharge({ deliveryAreaId: payload.delivery_area_id, pickupAreaId: config.pickupAreaId, cashCollectionAmount: amountToCollect, weight });
        deliveryFee = Number(charge?.deliveryCharge || 0);
      } catch (err) {
        console.error("RedX charge estimate failed:", err.message);
      }
    }

    const result = await createRedxParcel(payload);
    const trackingId = result?.tracking_id;
    if (!trackingId) {
      return res.status(502).json({ status: "error", message: "RedX did not return a tracking id.", data: result });
    }

    order.courier = {
      provider: "redx",
      consignmentId: trackingId,
      merchantOrderId: merchantInvoiceId,
      trackingCode: trackingId,
      deliveryFee,
      amountToCollect,
      orderStatus: "Pickup Pending",
      orderStatusSlug: "pickup_pending",
      category: "active",
      storeId: storeId ? Number(storeId) : null,
      recipientAreaId: payload.delivery_area_id,
      deliveryAreaName: payload.delivery_area,
      itemWeight: weight / 1000,
      dispatchedAt: new Date(),
      rawResponse: result,
      history: [{ status: "Pickup Pending", date: new Date(), note: "Dispatched to RedX" }],
    };
    if (updateOrderStatus) order.status = updateOrderStatus;
    order.updatedBy = req.user?.userId || null;
    await order.save();

    await ensurePaymentOnShip(order.toObject());
    await syncCourierBill(order).catch((err) => console.error("Failed to sync RedX charge bill:", err));
    await writeLog(req, `${req.user?.name || "System Admin"} dispatched order #${order.orderNumber} to RedX. Tracking ID: ${trackingId}`);

    return res.json({ status: "success", message: `Order dispatched to RedX! Tracking ID: ${trackingId}`, data: { redx: result, order } });
  } catch (error) {
    next(error);
  }
};

/**
 * Live parcel info + tracking timeline; reconciles the order on the way
 */
export const trackRedxParcelController = async (req, res, next) => {
  try {
    const { trackingId } = req.params;
    const [parcel, tracking] = await Promise.all([getRedxParcelInfo(trackingId), trackRedxParcel(trackingId).catch(() => [])]);
    const order = await OrderModel.findOne({ "courier.provider": "redx", "courier.consignmentId": trackingId });
    let result = null;
    if (order && parcel?.status) {
      result = await applyRedxUpdate(order, { status: parcel.status, deliveryType: parcel.delivery_type, charge: parcel.charge, source: "TRACK" });
    }
    return res.json({ status: "success", data: { parcel, tracking, result } });
  } catch (error) {
    next(error);
  }
};

export const cancelRedxParcelController = async (req, res, next) => {
  try {
    const { trackingId } = req.params;
    const reason = String(req.body?.reason || "Cancelled by merchant").trim();
    const result = await cancelRedxParcel(trackingId, reason);
    const order = await OrderModel.findOne({ "courier.provider": "redx", "courier.consignmentId": trackingId });
    if (order) await applyRedxUpdate(order, { status: "cancelled", source: "CANCEL" });
    await writeLog(req, `${req.user?.name || "System Admin"} requested RedX cancellation for ${trackingId}: ${reason}`);
    return res.json({ status: "success", message: result?.message || "Cancellation requested", data: result });
  } catch (error) {
    next(error);
  }
};

export const syncRedxOrdersController = async (req, res, next) => {
  try {
    const result = await syncRedxOrders("MANUAL");
    return res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Public callback RedX POSTs on every parcel status change.
 * Authenticated by the ?token= query parameter (RedX passes credentials in the URL).
 */
export const redxWebhookController = async (req, res, next) => {
  try {
    const config = await getRedxConfig();
    const token = String(req.query.token || "");
    const expected = config.webhookToken || "";
    const valid =
      expected &&
      token.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
    if (!valid) return res.status(401).json({ status: "error", message: "Invalid token" });

    const body = req.body || {};
    const trackingId = String(body.tracking_number || "").trim();
    await StoreSettingsModel.updateOne({ key: "default" }, { $set: { "redxCourier.lastWebhookAt": new Date() } });
    if (!trackingId || !body.status) return res.json({ status: "success", message: "ignored" });

    const order = await OrderModel.findOne({ "courier.provider": "redx", "courier.consignmentId": trackingId });
    if (!order) return res.json({ status: "success", message: "order not found" });

    const result = await applyRedxUpdate(order, {
      status: body.status,
      deliveryType: body.delivery_type,
      eventAt: body.timestamp,
      source: "WEBHOOK",
    });
    return res.json({ status: "success", message: result, data: { slug: redxSlugFor(body.status, body.delivery_type), label: redxLabelFor(body.status) } });
  } catch (error) {
    next(error);
  }
};
