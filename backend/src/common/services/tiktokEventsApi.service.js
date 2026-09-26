import crypto from "crypto";
import { env } from "../config/env.js";
import { StoreSettingsModel } from "../models/storeSettings.model.js";
import { config as clientConfig } from "../config/index.js";

// Computes SHA-256 hash for TikTok user data normalization
const sha256 = (value) => {
  if (!value || typeof value !== "string") return "";
  const cleanVal = value.trim().toLowerCase();
  if (!cleanVal) return "";
  return crypto.createHash("sha256").update(cleanVal).digest("hex");
};

// Normalizes Bangladeshi phone numbers into international format
const normalizePhone = (phone = "") => {
  if (!phone) return "";
  let digits = String(phone).replace(/\D/g, "");
  if (digits.startsWith("880")) {
    return digits;
  }
  if (digits.startsWith("0")) {
    return `88${digits}`;
  }
  if (digits.length === 10) {
    return `880${digits}`;
  }
  return digits;
};

// Resolves active TikTok Pixel configuration from database, client config, and environment fallbacks
export const getTikTokPixelConfig = async () => {
  try {
    const doc = await StoreSettingsModel.findOne({ key: "default" }).lean();
    const dbTikTok = doc?.tiktokPixel || {};
    const fallbackClientTikTok = clientConfig?.tiktokPixel || {};

    const pixelId = dbTikTok.pixelId || fallbackClientTikTok.pixelId || env.TIKTOK_PIXEL_ID || "";
    const accessToken = dbTikTok.accessToken || fallbackClientTikTok.accessToken || env.TIKTOK_ACCESS_TOKEN || "";
    const testEventCode = dbTikTok.testEventCode || fallbackClientTikTok.testEventCode || env.TIKTOK_TEST_EVENT_CODE || "";

    return {
      pixelId,
      accessToken,
      testEventCode,
      isEnabled: dbTikTok.isEnabled ?? fallbackClientTikTok.isEnabled ?? true,
      enableBrowserPixel: dbTikTok.enableBrowserPixel ?? fallbackClientTikTok.enableBrowserPixel ?? true,
      enableEventsApi: dbTikTok.enableEventsApi ?? fallbackClientTikTok.enableEventsApi ?? true,
      advancedMatching: dbTikTok.advancedMatching ?? fallbackClientTikTok.advancedMatching ?? true,
      lastVerifiedAt: dbTikTok.lastVerifiedAt || null,
      lastTestStatus: dbTikTok.lastTestStatus || "untested",
      lastTestMessage: dbTikTok.lastTestMessage || "",
    };
  } catch (_error) {
    return {
      pixelId: env.TIKTOK_PIXEL_ID || "",
      accessToken: env.TIKTOK_ACCESS_TOKEN || "",
      testEventCode: env.TIKTOK_TEST_EVENT_CODE || "",
      isEnabled: true,
      enableBrowserPixel: true,
      enableEventsApi: true,
      advancedMatching: true,
      lastVerifiedAt: null,
      lastTestStatus: "untested",
      lastTestMessage: "",
    };
  }
};

// Dispatches a live verification test event to TikTok Events API
export const testTikTokEventsApiConnection = async ({ pixelId, accessToken, testEventCode = "" }) => {
  if (!pixelId || !accessToken) {
    return {
      success: false,
      status: 400,
      message: "Pixel ID and Events API Access Token are required.",
    };
  }

  const endpoint = "https://business-api.tiktok.com/open_api/v1.3/event/track/";
  const testPayload = {
    event_source: "web",
    event_source_id: pixelId,
    data: [
      {
        event: "TestConnection",
        event_time: Math.floor(Date.now() / 1000),
        event_id: `test_${Date.now()}`,
        user: {
          client_user_agent: "Decantre-WL-Ecom/Backend-TikTok-Tester",
          ip: "127.0.0.1",
        },
        properties: {
          currency: "BDT",
          value: 1.0,
          contents: [
            {
              content_id: "test_product",
              content_name: "Connection Verification",
              quantity: 1,
              price: 1.0,
            },
          ],
        },
      },
    ],
    ...(testEventCode ? { test_event_code: testEventCode } : {}),
  };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Token": accessToken,
      },
      body: JSON.stringify(testPayload),
    });

    const resData = await res.json().catch(() => null);

    if (!res.ok || (resData && resData.code !== 0)) {
      const errMsg =
        resData?.message ||
        `TikTok API error (Status: ${res.status}, Code: ${resData?.code || "unknown"})`;
      return {
        success: false,
        status: res.status >= 400 && res.status < 600 ? res.status : 400,
        message: errMsg,
        raw: resData,
      };
    }

    return {
      success: true,
      status: 200,
      message: "TikTok Events API connection verified successfully.",
      requestId: resData?.request_id,
      data: resData?.data || null,
      raw: resData,
    };
  } catch (err) {
    return {
      success: false,
      status: 500,
      message: `Network error connecting to TikTok Events API: ${err.message}`,
    };
  }
};

// Sends server-side CompletePayment event to TikTok Events API asynchronously
export const sendTikTokServerPurchaseEvent = async (order, req = null) => {
  try {
    // Strictly prevent in-store walk-in counter sales or manual orders from being sent to TikTok Events API
    const isInstore =
      order?.orderType === "instore" ||
      req?.body?.orderType === "instore" ||
      String(order?.orderNumber || "").startsWith("IS") ||
      String(order?.billingInfo?.email || "").includes("instore@");

    if (isInstore) {
      return;
    }

    const tiktokConfig = await getTikTokPixelConfig();

    if (!tiktokConfig.isEnabled || !tiktokConfig.enableEventsApi) {
      return;
    }

    const { pixelId, accessToken, testEventCode, advancedMatching } = tiktokConfig;

    if (!pixelId || !accessToken) {
      return;
    }

    const customer = order.billingInfo || order.shippingInfo || {};
    const normalizedPhoneNum = normalizePhone(customer.phone || "");

    const clientIp =
      req?.headers?.["x-forwarded-for"]?.split(",")?.[0]?.trim() ||
      req?.socket?.remoteAddress ||
      "";
    const clientUserAgent = req?.headers?.["user-agent"] || "";

    const userObj = {
      ...(clientUserAgent ? { user_agent: clientUserAgent } : {}),
      ...(clientIp ? { ip: clientIp } : {}),
      ...(advancedMatching && customer.email ? { email: sha256(customer.email) } : {}),
      ...(advancedMatching && normalizedPhoneNum ? { phone: sha256(normalizedPhoneNum) } : {}),
    };

    const items = Array.isArray(order.items) ? order.items : [];
    const contents = items.map((item) => ({
      content_id: String(item.productDid || item.sku || item.productId || item.name || ""),
      content_name: String(item.name || "Product"),
      quantity: Number(item.quantity || 1),
      price: Number(item.unitPrice || 0),
    }));

    const orderTotalAmount = Number(
      order.totals?.total ?? order.total ?? order.totalAmount ?? 0
    );

    const eventPayload = {
      event_source: "web",
      event_source_id: pixelId,
      ...(testEventCode ? { test_event_code: testEventCode } : {}),
      data: [
        {
          event: "CompletePayment",
          event_time: Math.floor(Date.now() / 1000),
          event_id: `purchase_${order.orderNumber || order._id}`,
          user: userObj,
          properties: {
            currency: "BDT",
            value: orderTotalAmount,
            content_type: "product",
            contents,
            order_id: String(order.orderNumber || order._id || ""),
          },
        },
      ],
    };

    const endpoint = "https://business-api.tiktok.com/open_api/v1.3/event/track/";

    fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Token": accessToken,
      },
      body: JSON.stringify(eventPayload),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.text();
          console.warn("[TikTok Events API] Response error:", errData);
        }
      })
      .catch((err) => {
        console.warn("[TikTok Events API] Network error:", err.message);
      });
  } catch (err) {
    console.warn("[TikTok Events API] Request builder exception:", err.message);
  }
};
