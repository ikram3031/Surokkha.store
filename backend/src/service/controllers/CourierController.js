import { StoreSettingsModel } from "../../common/models/storeSettings.model.js";
import { OrderModel } from "../../common/models/order.model.js";
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
} from "../../common/services/pathao.service.js";

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
        isEnabled: config.isEnabled,
        tokenExpiresAt: config.tokenExpiresAt,
        lastTestedAt: config.lastTestedAt,
        lastTestStatus: config.lastTestStatus,
        lastTestMessage: config.lastTestMessage,
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
    const effectiveStoreId = store_id || config.storeId;
    if (!effectiveStoreId) {
      return res.status(400).json({
        status: "error",
        message: "store_id is required. Please set a default store in Pathao Settings or select a store.",
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
    } = req.body;

    const config = await getPathaoConfig();
    const effectiveStoreId = store_id || config.storeId;
    if (!effectiveStoreId) {
      return res.status(400).json({
        status: "error",
        message: "A Pathao Store ID is required to dispatch the order.",
      });
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

    const payload = {
      store_id: Number(effectiveStoreId),
      merchant_order_id: String(merchant_order_id || orderId || "").trim(),
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

    const pathaoResult = await createPathaoOrder(payload);
    const orderData = pathaoResult?.data || pathaoResult;

    const consignmentId = orderData?.consignment_id || orderData?.consignmentId || null;
    const deliveryFee = orderData?.delivery_fee ?? orderData?.deliveryFee ?? 0;
    const orderStatus = orderData?.order_status || orderData?.orderStatus || "Pending";
    const orderStatusSlug = orderData?.order_status_slug || orderData?.orderStatusSlug || "pending";

    // If order exists in database, update it with courier information
    let updatedOrder = null;
    if (orderId) {
      const filter = {
        $or: [
          { orderNumber: orderId },
          { did: orderId },
          ...(orderId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: orderId }] : []),
        ],
      };

      const courierData = {
        provider: "pathao",
        consignmentId: consignmentId,
        merchantOrderId: payload.merchant_order_id,
        trackingCode: consignmentId,
        deliveryFee: deliveryFee,
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

    const result = await createPathaoBulkOrders(orders);
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
