import { COURIERS, AVAILABLE_COURIER_KEYS } from "../../common/config/couriers.js";
import { getEnabledCouriers } from "../../common/services/courierProviders.service.js";
import { syncPathaoOrders } from "../services/pathaoOrderSync.service.js";
import { syncCourierBill } from "../services/pathaoBill.service.js";
import { StoreSettingsModel } from "../../common/models/storeSettings.model.js";
import { OrderModel } from "../../common/models/order.model.js";
import { ensurePaymentOnShip } from "../../common/helper/orderControllerHelper.js";
import { LogModel } from "../../common/models/log.model.js";
import { DistrictModel, ThanaModel } from "../../common/models/district.model.js";
import { getDeliveryTier } from "../../common/helper/deliveryCharge.helper.js";
import {
  getPathaoConfig,
  testPathaoConnection,
  getPathaoStores,
  createPathaoStore,
  getPathaoCities,
  getPathaoZones,
  getPathaoAreas,
  calculatePathaoPricePlan,
  createPathaoOrder,
  createPathaoBulkOrders,
  getPathaoOrderInfo,
  cancelPathaoOrder,
} from "../../common/services/pathao.service.js";
import { normalizePathaoSlug } from "../services/pathaoCourierEvents.service.js";
import { syncOrderStock } from "../../common/services/stock.service.js";
import {
  syncLocationsFromPathaoAPI,
  seedBaselineDistrictsAndThanas,
} from "../../common/services/pathaoLocationSync.service.js";


// Mask sensitive string helper
const maskString = (str) => {
  if (!str) return "";
  if (str.length <= 4) return "****";
  return `${str.slice(0, 2)}****${str.slice(-2)}`;
};

/**
 * Get Pathao Courier Settings
 */
export const getPathaoSettings = async (req, res, next) => {
  try {
    const config = await getPathaoConfig();
    const doc = await StoreSettingsModel.findOne({ key: "default" }).lean();
    const pathao = doc?.pathaoCourier || {};

    return res.json({
      status: "success",
      data: {
        environment: config.environment,
        baseUrl: config.baseUrl,
        clientId: config.clientId,
        clientSecret: maskString(config.clientSecret),
        hasClientSecret: Boolean(config.clientSecret),
        username: config.username,
        hasPassword: Boolean(config.password),
        storeId: config.storeId,
        storeName: config.storeName,
        storeAddress: config.storeAddress,
        defaultItemWeight: config.defaultItemWeight,
        defaultItemType: config.defaultItemType,
        defaultDeliveryType: config.defaultDeliveryType,
        sameDayDeliveryType: config.sameDayDeliveryType,
        isEnabled: config.isEnabled,
        tokenExpiresAt: config.tokenExpiresAt,
        lastTestedAt: config.lastTestedAt,
        lastTestStatus: config.lastTestStatus,
        lastTestMessage: config.lastTestMessage,
        lastOrderSyncAt: pathao.lastOrderSyncAt || null,
        lastOrderSyncSummary: pathao.lastOrderSyncSummary || "",
        isPersistedInDb: Boolean(pathao?.clientId),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Pathao Courier Settings
 */
export const updatePathaoSettings = async (req, res, next) => {
  try {
    const {
      environment = "production",
      baseUrl,
      clientId = "",
      clientSecret = "",
      username = "",
      password = "",
      storeId = null,
      storeName = "",
      storeAddress = "",
      defaultItemWeight = 0.5,
      defaultItemType = 2,
      defaultDeliveryType = 48,
      sameDayDeliveryType,
      isEnabled = true,
    } = req.body || {};

    const cleanClientId = String(clientId).trim();
    const cleanUsername = String(username).trim();
    const cleanStoreName = String(storeName).trim();
    const cleanStoreAddress = String(storeAddress).trim();

    const updatePayload = {
      "pathaoCourier.environment": environment,
      "pathaoCourier.baseUrl":
        baseUrl ||
        (environment === "sandbox"
          ? "https://courier-api-sandbox.pathao.com"
          : "https://api-hermes.pathao.com"),
      "pathaoCourier.clientId": cleanClientId,
      "pathaoCourier.username": cleanUsername,
      "pathaoCourier.storeId": storeId ? Number(storeId) : null,
      "pathaoCourier.storeName": cleanStoreName,
      "pathaoCourier.storeAddress": cleanStoreAddress,
      "pathaoCourier.defaultItemWeight": Number(defaultItemWeight) || 0.5,
      "pathaoCourier.defaultItemType": Number(defaultItemType) || 2,
      "pathaoCourier.defaultDeliveryType": Number(defaultDeliveryType) || 48,
      "pathaoCourier.isEnabled": Boolean(isEnabled),
      ...(Number(sameDayDeliveryType) > 0 ? { "pathaoCourier.sameDayDeliveryType": Number(sameDayDeliveryType) } : {}),
      updatedBy: req.user?.userId || null,
    };

    if (clientSecret && String(clientSecret).trim() && !String(clientSecret).includes("****")) {
      updatePayload["pathaoCourier.clientSecret"] = String(clientSecret).trim();
    }
    if (password && String(password).trim() && !String(password).includes("****")) {
      updatePayload["pathaoCourier.password"] = String(password).trim();
    }

    const updatedDoc = await StoreSettingsModel.findOneAndUpdate(
      { key: "default" },
      { $set: updatePayload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    try {
      const actorDid = req.user?.did || "staff";
      const actorName = req.user?.name || "System Admin";
      await LogModel.create({
        type: "updated",
        typeDid: "121",
        description: `${actorName} updated Pathao Courier settings.`,
        readStatus: false,
        active: true,
        createdBy: actorDid,
        updatedBy: actorDid,
      });
    } catch (logErr) {
      console.error("Failed to create log for Pathao settings update:", logErr);
    }

    return res.json({
      status: "success",
      message: "Pathao Courier settings saved successfully.",
      data: updatedDoc.pathaoCourier,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Test Pathao Connection
 */
export const testPathaoConnectionController = async (req, res, next) => {
  try {
    const currentConfig = await getPathaoConfig();
    const targetEnvironment = req.body?.environment || currentConfig.environment || "production";
    const targetBaseUrl =
      req.body?.baseUrl ||
      (targetEnvironment === "sandbox"
        ? "https://courier-api-sandbox.pathao.com"
        : "https://api-hermes.pathao.com");

    const targetClientId = (req.body?.clientId || currentConfig.clientId || "").trim();
    let targetClientSecret = (req.body?.clientSecret || "").trim();
    if (!targetClientSecret || targetClientSecret.includes("****")) {
      targetClientSecret = currentConfig.clientSecret;
    }

    const targetUsername = (req.body?.username || currentConfig.username || "").trim();
    let targetPassword = (req.body?.password || "").trim();
    if (!targetPassword || targetPassword.includes("****")) {
      targetPassword = currentConfig.password;
    }

    if (!targetClientId || !targetClientSecret || !targetUsername || !targetPassword) {
      return res.status(400).json({
        status: "error",
        message: "Client ID, Client Secret, Username (Email), and Password are required to test Pathao connection.",
      });
    }

    const testResult = await testPathaoConnection({
      environment: targetEnvironment,
      baseUrl: targetBaseUrl,
      clientId: targetClientId,
      clientSecret: targetClientSecret,
      username: targetUsername,
      password: targetPassword,
    });

    const isSuccess = testResult.success === true;
    const now = new Date();
    const statusVal = isSuccess ? "connected" : "failed";
    const statusMsg = testResult.message || (isSuccess ? "Connected" : "Test failed");

    const updateFields = {
      "pathaoCourier.lastTestedAt": now,
      "pathaoCourier.lastTestStatus": statusVal,
      "pathaoCourier.lastTestMessage": statusMsg,
    };

    if (isSuccess && testResult.tokenData?.access_token) {
      updateFields["pathaoCourier.accessToken"] = testResult.tokenData.access_token;
      updateFields["pathaoCourier.refreshToken"] = testResult.tokenData.refresh_token || "";
      updateFields["pathaoCourier.tokenExpiresAt"] = new Date(
        Date.now() + (testResult.tokenData.expires_in || 432000) * 1000
      );
    }

    await StoreSettingsModel.updateOne({ key: "default" }, { $set: updateFields });

    return res.json({
      status: isSuccess ? "success" : "error",
      message: statusMsg,
      data: {
        success: isSuccess,
        stores: testResult.stores || [],
        testedAt: now,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get merchant stores
 */
export const getStoresController = async (req, res, next) => {
  try {
    const stores = await getPathaoStores();
    return res.json({ status: "success", data: stores });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new store on Pathao
 */
export const createStoreController = async (req, res, next) => {
  try {
    const result = await createPathaoStore(req.body);
    return res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Get cities list
 */
export const getCitiesController = async (req, res, next) => {
  try {
    const cities = await getPathaoCities();
    return res.json({ status: "success", data: cities });
  } catch (error) {
    next(error);
  }
};

/**
 * Get zones in a city
 */
export const getZonesController = async (req, res, next) => {
  try {
    const { cityId } = req.params;
    if (!cityId) {
      return res.status(400).json({ status: "error", message: "cityId is required" });
    }
    const zones = await getPathaoZones(cityId);
    return res.json({ status: "success", data: zones });
  } catch (error) {
    next(error);
  }
};

/**
 * Get areas in a zone
 */
export const getAreasController = async (req, res, next) => {
  try {
    const { zoneId } = req.params;
    if (!zoneId) {
      return res.status(400).json({ status: "error", message: "zoneId is required" });
    }
    const areas = await getPathaoAreas(zoneId);
    return res.json({ status: "success", data: areas });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate Price Plan
 */
export const calculatePriceController = async (req, res, next) => {
  try {
    const { store_id, item_type = 2, delivery_type = 48, item_weight = 0.5, recipient_city, recipient_zone } = req.body;
    if (!recipient_city || !recipient_zone) {
      return res.status(400).json({
        status: "error",
        message: "recipient_city and recipient_zone are required for price calculation.",
      });
    }

    const config = await getPathaoConfig();
    const effectiveStoreId = config.storeId || store_id;
    if (!effectiveStoreId) {
      return res.status(400).json({
        status: "error",
        message: "No Pathao pickup store is set. Choose the default store in Settings > Pathao Courier.",
      });
    }

    const result = await calculatePathaoPricePlan({
      store_id: Number(effectiveStoreId),
      item_type: Number(item_type),
      delivery_type: Number(delivery_type),
      item_weight: Number(item_weight),
      recipient_city: Number(recipient_city),
      recipient_zone: Number(recipient_zone),
    });

    return res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
};

// Finds a store order by order number, did or Mongo id; null when no reference was given
const orderLinkFilter = (orderId) => {
  const ref = String(orderId || "").trim();
  if (!ref) return null;
  return {
    $or: [{ orderNumber: ref }, { did: ref }, ...(/^[0-9a-fA-F]{24}$/.test(ref) ? [{ _id: ref }] : [])],
  };
};

/**
 * Create Order consignment (Dispatch to Pathao)
 */
export const createOrderConsignmentController = async (req, res, next) => {
  try {
    const {
      orderId, // Can be orderNumber, mongo ID, or did
      store_id,
      merchant_order_id,
      recipient_name,
      recipient_phone,
      recipient_secondary_phone,
      recipient_address,
      recipient_city,
      recipient_zone,
      recipient_area,
      delivery_type = 48,
      item_type = 2,
      special_instruction = "",
      item_quantity = 1,
      item_weight = 0.5,
      amount_to_collect = 0,
      item_description = "",
      updateOrderStatus = "shipped", // update status to 'shipped' by default
      keepItemDescription = false, // manual create page sends the description the user typed
    } = req.body;

    const config = await getPathaoConfig();
    const effectiveStoreId = config.storeId || store_id;
    if (!effectiveStoreId) {
      return res.status(400).json({
        status: "error",
        message: "No Pathao pickup store is set. Choose the default store in Settings > Pathao Courier.",
      });
    }

    // A linked order that already has a live parcel must not get a second one
    const linkFilter = orderLinkFilter(orderId);
    if (linkFilter) {
      const existing = await OrderModel.findOne(linkFilter).select("orderNumber courier.consignmentId courier.provider").lean();
      if (existing?.courier?.consignmentId) {
        return res.status(409).json({
          status: "error",
          message: `Order #${existing.orderNumber} is already sent to ${existing.courier.provider === "redx" ? "RedX" : "Pathao"} (consignment ${existing.courier.consignmentId}). Cancel that parcel first.`,
        });
      }
    }

    // Clean phone number (Pathao expects Bangladeshi 11-digit format e.g. 017XXXXXXXX)
    let cleanPhone = String(recipient_phone || "").trim().replace(/\D/g, "");
    if (cleanPhone.startsWith("880")) {
      cleanPhone = cleanPhone.slice(2);
    }
    if (!cleanPhone.startsWith("0")) {
      cleanPhone = `0${cleanPhone}`;
    }

    if (cleanPhone.length !== 11) {
      return res.status(400).json({
        status: "error",
        message: `Recipient phone number "${recipient_phone}" is invalid. Must be a valid 11-digit BD number (e.g. 01712345678).`,
      });
    }

    if (!recipient_name || !recipient_address || !recipient_city || !recipient_zone) {
      return res.status(400).json({
        status: "error",
        message: "recipient_name, recipient_address, recipient_city, and recipient_zone are required.",
      });
    }

    let cleanSecondary = String(recipient_secondary_phone || "").replace(/\D/g, "");
    if (cleanSecondary.startsWith("880")) cleanSecondary = cleanSecondary.slice(2);
    if (cleanSecondary && !cleanSecondary.startsWith("0")) cleanSecondary = `0${cleanSecondary}`;
    if (cleanSecondary && cleanSecondary.length !== 11) {
      return res.status(400).json({
        status: "error",
        message: `Secondary phone number "${recipient_secondary_phone}" is invalid. Must be a valid 11-digit BD number.`,
      });
    }

    const baseMerchantOrderId = String(merchant_order_id || orderId || "").trim();
    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const payload = {
      store_id: Number(effectiveStoreId),
      merchant_order_id: baseMerchantOrderId ? `${baseMerchantOrderId}-${randomSuffix}` : `MAN-${Date.now()}`,
      recipient_name: String(recipient_name).trim(),
      recipient_phone: cleanPhone,
      recipient_address: String(recipient_address).trim(),
      recipient_city: Number(recipient_city),
      recipient_zone: Number(recipient_zone),
      delivery_type: Number(delivery_type),
      item_type: Number(item_type),
      special_instruction: String(special_instruction || "").trim(),
      item_quantity: Number(item_quantity) || 1,
      item_weight: Number(item_weight) || 0.5,
      amount_to_collect: Number(amount_to_collect) || 0,
      item_description: String(item_description || "Order Items").trim(),
    };

    if (recipient_area) {
      payload.recipient_area = Number(recipient_area);
    }
    if (cleanSecondary && cleanSecondary !== cleanPhone) {
      payload.recipient_secondary_phone = cleanSecondary;
    }

    const clientKey = (process.env.CLIENT_NAME || "surokkha").toLowerCase().trim();
    if (clientKey === "surokkha" && !(keepItemDescription && String(item_description || "").trim())) {
      const randomNum = Math.floor(Math.random() * 10) + 1;
      payload.item_description = `Gift combo${randomNum}`;
    }

    const pathaoResult = await createPathaoOrder(payload);
    const orderData = pathaoResult?.data || pathaoResult;

    const consignmentId = orderData?.consignment_id || orderData?.consignmentId || null;
    const deliveryFee = orderData?.delivery_fee ?? orderData?.deliveryFee ?? 0;
    const orderStatus = orderData?.order_status || orderData?.orderStatus || "Pending";
    const orderStatusSlug = orderData?.order_status_slug || orderData?.orderStatusSlug || "pending";

    // If order exists in database, update it with courier information
    let updatedOrder = null;
    if (linkFilter) {
      const filter = linkFilter;

      const courierData = {
        provider: "pathao",
        consignmentId: consignmentId,
        merchantOrderId: payload.merchant_order_id,
        trackingCode: consignmentId,
        deliveryFee: deliveryFee,
        amountToCollect: payload.amount_to_collect,
        orderStatus: orderStatus,
        orderStatusSlug: orderStatusSlug,
        storeId: payload.store_id,
        recipientCityId: payload.recipient_city,
        recipientZoneId: payload.recipient_zone,
        recipientAreaId: payload.recipient_area || null,
        itemWeight: payload.item_weight,
        dispatchedAt: new Date(),
        rawResponse: orderData,
        history: [{ status: orderStatus, date: new Date(), note: "Dispatched to Pathao Courier" }],
      };

      const updateQuery = {
        $set: {
          courier: courierData,
          ...(updateOrderStatus ? { status: updateOrderStatus } : {}),
          updatedBy: req.user?.userId || null,
        },
      };

      updatedOrder = await OrderModel.findOneAndUpdate(filter, updateQuery, { new: true });
      // First ship opens payment collection for the order and books Pathao's estimated charge as a pending bill
      if (updatedOrder) {
        await ensurePaymentOnShip(updatedOrder);
        await syncCourierBill(updatedOrder).catch((err) => console.error("Failed to sync Pathao charge bill:", err));
      }
    }

    try {
      const actorDid = req.user?.did || "staff";
      const actorName = req.user?.name || "System Admin";
      const orderRef = updatedOrder?.orderNumber || orderId || "unknown";
      await LogModel.create({
        type: "updated",
        typeDid: "121",
        description: `${actorName} dispatched order #${orderRef} to Pathao. Consignment ID: ${consignmentId}`,
        readStatus: false,
        active: true,
        createdBy: actorDid,
        updatedBy: actorDid,
      });
    } catch (logErr) {
      console.error("Failed to create log for Pathao dispatch:", logErr);
    }

    return res.json({
      status: "success",
      message: `Order dispatched to Pathao successfully! Consignment ID: ${consignmentId}`,
      data: {
        pathao: orderData,
        order: updatedOrder,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk Dispatch orders to Pathao
 */
export const createBulkOrderConsignmentsController = async (req, res, next) => {
  try {
    const { orders = [] } = req.body;
    if (!Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({ status: "error", message: "Array of orders is required." });
    }

    const config = await getPathaoConfig();
    if (config.storeId) {
      for (const order of orders) order.store_id = Number(config.storeId);
    }

    const clientKey = (process.env.CLIENT_NAME || "surokkha").toLowerCase().trim();
    if (clientKey === "surokkha") {
      for (const order of orders) {
        const randomNum = Math.floor(Math.random() * 10) + 1;
        order.item_description = `Gift combo${randomNum}`;
      }
    }

    const result = await createPathaoBulkOrders(orders);

    try {
      const actorDid = req.user?.did || "staff";
      const actorName = req.user?.name || "System Admin";
      await LogModel.create({
        type: "updated",
        typeDid: "121",
        description: `${actorName} bulk dispatched ${orders.length} order(s) to Pathao.`,
        readStatus: false,
        active: true,
        createdBy: actorDid,
        updatedBy: actorDid,
      });
    } catch (logErr) {
      console.error("Failed to create log for Pathao bulk dispatch:", logErr);
    }

    return res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Track order consignment live info
 */
export const trackOrderController = async (req, res, next) => {
  try {
    const { consignmentId } = req.params;
    if (!consignmentId) {
      return res.status(400).json({ status: "error", message: "consignmentId is required" });
    }

    const info = await getPathaoOrderInfo(consignmentId);
    const trackingData = info?.data || info;

    // Synchronize status back to OrderModel if found
    if (trackingData?.order_status) {
      await OrderModel.updateOne(
        { "courier.consignmentId": consignmentId },
        {
          $set: {
            "courier.orderStatus": trackingData.order_status,
            "courier.orderStatusSlug": trackingData.order_status_slug || trackingData.order_status.toLowerCase(),
          },
          $push: {
            "courier.history": {
              status: trackingData.order_status,
              date: new Date(),
              note: trackingData.reason || "Status synchronized via tracking check",
            },
          },
        }
      );
    }

    return res.json({ status: "success", data: trackingData });
  } catch (error) {
    next(error);
  }
};

/**
 * Sync / Update District and Thana collections using Pathao API
 */
export const syncPathaoLocationsController = async (req, res, next) => {
  try {
    const config = await getPathaoConfig();
    const hasCredentials = Boolean(config.clientId && config.clientSecret && config.username && config.password);

    if (!hasCredentials) {
      // If credentials not yet configured, seed baseline as helpful fallback
      const seedResult = await seedBaselineDistrictsAndThanas();
      return res.json({
        status: "partial",
        message: "Pathao API credentials are not yet configured in Settings. Seeded 64 standard Bangladesh districts and thanas.",
        data: seedResult,
      });
    }

    const syncResult = await syncLocationsFromPathaoAPI();
    return res.json({
      status: "success",
      message: `Successfully synchronized ${syncResult.districtsCount} districts and ${syncResult.thanasCount} thanas from Pathao API!`,
      data: syncResult,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all stored Districts from MongoDB
 */
export const getDistrictsListController = async (req, res, next) => {
  try {
    const districts = await DistrictModel.find({ isActive: true }).sort({ name: 1 }).lean();
    return res.json({
      status: "success",
      count: districts.length,
      data: districts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all stored Thanas / Zones for a specific District (by cityId) from MongoDB
 */
export const getDistrictThanasListController = async (req, res, next) => {
  try {
    const { cityId } = req.params;
    if (!cityId) {
      return res.status(400).json({ status: "error", message: "cityId or district name is required" });
    }

    const numCityId = Number(cityId);
    let query;
    if (!isNaN(numCityId) && numCityId > 0) {
      query = { cityId: numCityId, isActive: true };
    } else {
      query = { districtName: new RegExp(`^${cityId.trim()}$`, "i"), isActive: true };
    }

    const found = await ThanaModel.find(query).sort({ name: 1 }).lean();
    const thanas = found.map((t) =>
      t.deliveryCharge == null ? { ...t, ...getDeliveryTier(t.districtName, t.name) } : t
    );
    return res.json({
      status: "success",
      count: thanas.length,
      data: thanas,
    });
  } catch (error) {
    next(error);
  }
};


/**
 * Manually trigger Pathao order status & payment synchronization
 */
export const syncPathaoOrdersController = async (req, res, next) => {
  try {
    const result = await syncPathaoOrders("MANUAL");
    return res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * List courier integrations and which ones are switched on
 */
export const getCourierProvidersController = async (req, res, next) => {
  try {
    const enabled = await getEnabledCouriers();
    return res.json({
      status: "success",
      data: {
        enabledCouriers: enabled,
        couriers: COURIERS.map((c) => ({ ...c, enabled: enabled.includes(c.key) })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Owner switches couriers on/off
 */
export const updateCourierProvidersController = async (req, res, next) => {
  try {
    const requested = Array.isArray(req.body?.enabledCouriers) ? req.body.enabledCouriers : null;
    if (!requested) {
      return res.status(400).json({ status: "error", message: "enabledCouriers must be an array" });
    }
    const invalid = requested.filter((key) => !AVAILABLE_COURIER_KEYS.includes(key));
    if (invalid.length) {
      return res.status(400).json({ status: "error", message: `Courier not available: ${invalid.join(", ")}` });
    }
    const enabledCouriers = [...new Set(requested)];

    await StoreSettingsModel.findOneAndUpdate(
      { key: "default" },
      { $set: { enabledCouriers, updatedBy: req.user?.userId || null } },
      { upsert: true, setDefaultsOnInsert: true }
    );

    try {
      await LogModel.create({
        type: "updated",
        typeDid: "121",
        description: `${req.user?.name || "System Admin"} set active couriers: ${enabledCouriers.join(", ") || "none"}.`,
        readStatus: false,
      });
    } catch {
      // activity log is best-effort
    }

    return res.json({
      status: "success",
      data: {
        enabledCouriers,
        couriers: COURIERS.map((c) => ({ ...c, enabled: enabledCouriers.includes(c.key) })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Order statuses that are still waiting to be sent out
const UNDISPATCHED_STATUSES = ["pending", "processing", "hold"];
// Pathao statuses after the rider has the parcel: these can no longer be cancelled
const PICKED_UP_SLUG = /picked|transit|sorting|hub|assigned_for_delivery|delivered|delivery|partial|return|exchange|paid|invoice/;
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Orders not yet sent to any courier, for the Same Day page's "Select existing order" picker
 */
export const listUndispatchedOrdersController = async (req, res, next) => {
  try {
    const search = String(req.query.search || "").trim();
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "50", 10)));
    const filter = {
      active: { $ne: false },
      status: { $in: UNDISPATCHED_STATUSES },
      orderType: { $ne: "instore" },
      "courier.consignmentId": { $in: [null, ""] },
    };
    if (search) {
      const rx = new RegExp(escapeRegex(search.replace(/^#/, "")), "i");
      const digits = search.replace(/\D/g, "").replace(/^(880|0)/, "");
      filter.$or = [
        { orderNumber: rx },
        { "billingInfo.fullName": rx },
        { "shippingInfo.fullName": rx },
        ...(digits.length >= 4 ? [{ "billingInfo.phone": new RegExp(digits) }, { "shippingInfo.phone": new RegExp(digits) }] : []),
      ];
    }
    const docs = await OrderModel.find(filter)
      .select("orderNumber did status orderType billingInfo shippingInfo items totals paidAmount orderNotes createdAt")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const data = docs.map((o) => {
      const ship = o.shippingInfo?.address ? o.shippingInfo : o.billingInfo || {};
      const total = Number(o.totals?.total || 0);
      const paid = Number(o.paidAmount || 0);
      const items = (o.items || []).map((i) => ({ name: i.name, size: i.size || "", quantity: Number(i.quantity) || 1 }));
      return {
        id: String(o._id),
        orderNumber: o.orderNumber,
        status: o.status,
        orderType: o.orderType,
        createdAt: o.createdAt,
        name: ship.fullName || o.billingInfo?.fullName || "",
        phone: ship.phone || o.billingInfo?.phone || "",
        address: [ship.address, ship.thana, ship.district].filter(Boolean).join(", "),
        district: ship.district || "",
        thana: ship.thana || "",
        total,
        paid,
        amountToCollect: Math.max(0, Math.round((total - paid) * 100) / 100),
        quantity: items.reduce((s, i) => s + i.quantity, 0) || 1,
        items,
        notes: o.orderNotes || "",
      };
    });
    return res.json({ status: "success", data });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel a Pathao parcel that has not been picked up yet, then free the order so it can be sent again
 */
export const cancelPathaoConsignmentController = async (req, res, next) => {
  try {
    const consignmentId = String(req.params.consignmentId || "").trim();
    if (!consignmentId) return res.status(400).json({ status: "error", message: "Consignment ID is required." });

    // Live status first: once the rider has it, Pathao won't cancel and we shouldn't try
    let live = null;
    try {
      live = await getPathaoOrderInfo(consignmentId);
    } catch (err) {
      console.warn("Pathao info before cancel failed:", err.message);
    }
    const liveSlug = normalizePathaoSlug(live?.order_status_slug || live?.order_status || "");
    const alreadyCancelled = /pickup_cancel|cancelled/.test(liveSlug);
    if (liveSlug && !alreadyCancelled && PICKED_UP_SLUG.test(liveSlug)) {
      return res.status(409).json({
        status: "error",
        message: `Pathao shows this parcel as "${live.order_status}". It can only be cancelled before pickup.`,
      });
    }

    if (!alreadyCancelled) {
      try {
        await cancelPathaoOrder(consignmentId);
      } catch (err) {
        return res.status(err.status && err.status < 500 ? 422 : 502).json({
          status: "error",
          message: `Pathao did not cancel it: ${err.message}. Parcels can only be cancelled before pickup.`,
        });
      }
    }

    const order = await OrderModel.findOne({ "courier.consignmentId": consignmentId });
    const actorName = req.user?.name || "Staff";
    if (order) {
      const old = order.courier?.toObject ? order.courier.toObject() : order.courier || {};
      order.courier = {
        provider: old.provider || "pathao",
        orderStatus: "Pickup Cancelled",
        orderStatusSlug: "pickup_cancelled",
        history: [
          ...(old.history || []),
          { status: "Pickup Cancelled", date: new Date(), note: `Consignment ${consignmentId} cancelled by ${actorName}`, consignmentId },
        ],
      };
      const previousStatus = order.status;
      if (order.status === "shipped") order.status = "processing";
      order.updatedBy = req.user?.userId || null;
      await order.save();
      if (order.status !== previousStatus) await syncOrderStock(order, { actor: actorName });
      await syncCourierBill(order).catch((err) => console.error("Failed to remove Pathao charge bill:", err));
    }

    try {
      await LogModel.create({
        type: "updated",
        typeDid: "121",
        description: `${actorName} cancelled Pathao consignment ${consignmentId}${order ? ` for order #${order.orderNumber}` : ""}.`,
        readStatus: false,
        active: true,
        createdBy: req.user?.did || "staff",
        updatedBy: req.user?.did || "staff",
      });
    } catch (logErr) {
      console.error("Failed to log Pathao cancel:", logErr);
    }

    return res.json({
      status: "success",
      message: `Pathao parcel ${consignmentId} cancelled${order ? `. Order #${order.orderNumber} is back to ${order.status} and can be sent again.` : "."}`,
      data: { consignmentId, order: order ? { id: String(order._id), orderNumber: order.orderNumber, status: order.status } : null },
    });
  } catch (error) {
    next(error);
  }
};
