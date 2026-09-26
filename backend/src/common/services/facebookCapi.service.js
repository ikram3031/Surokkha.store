import crypto from "crypto";
import { env } from "../config/env.js";
import { config as clientConfig } from "../config/index.js";
import { StoreSettingsModel } from "../models/storeSettings.model.js";

// Computes SHA-256 hash for CAPI user data normalization
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

// Resolves active Meta Pixel configuration from database, client config, and environment fallbacks
export const getMetaPixelConfig = async () => {
  try {
    const doc = await StoreSettingsModel.findOne({ key: "default" }).lean();
    const dbMeta = doc?.metaPixel || {};
    const fallbackClientMeta = clientConfig?.metaPixel || {};

    const pixelId = dbMeta.pixelId || fallbackClientMeta.pixelId || env.FB_PIXEL_ID || "";
    const accessToken = dbMeta.accessToken || fallbackClientMeta.accessToken || env.FB_ACCESS_TOKEN || "";
    const testEventCode = dbMeta.testEventCode || fallbackClientMeta.testEventCode || env.FB_TEST_EVENT_CODE || "";

    return {
      pixelId,
      accessToken,
      testEventCode,
      isEnabled: dbMeta.isEnabled ?? fallbackClientMeta.isEnabled ?? true,
      enableBrowserPixel: dbMeta.enableBrowserPixel ?? fallbackClientMeta.enableBrowserPixel ?? true,
      enableCapi: dbMeta.enableCapi ?? fallbackClientMeta.enableCapi ?? true,
      advancedMatching: dbMeta.advancedMatching ?? fallbackClientMeta.advancedMatching ?? true,
      lastVerifiedAt: dbMeta.lastVerifiedAt || null,
      lastTestStatus: dbMeta.lastTestStatus || "untested",
      lastTestMessage: dbMeta.lastTestMessage || "",
    };
  } catch (_error) {
    return {
      pixelId: env.FB_PIXEL_ID || "",
      accessToken: env.FB_ACCESS_TOKEN || "",
      testEventCode: env.FB_TEST_EVENT_CODE || "",
      isEnabled: true,
      enableBrowserPixel: true,
      enableCapi: true,
      advancedMatching: true,
      lastVerifiedAt: null,
      lastTestStatus: "untested",
      lastTestMessage: "",
    };
  }
};

// Dispatches a live verification test event to Meta Graph API
export const testMetaCapiConnection = async ({ pixelId, accessToken, testEventCode = "" }) => {
  if (!pixelId || !accessToken) {
    return {
      success: false,
      status: 400,
      message: "Pixel ID and Conversions API Access Token are required.",
    };
  }

  const endpoint = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`;
  const testPayload = {
    data: [
      {
        event_name: "TestConnection",
        event_time: Math.floor(Date.now() / 1000),
        event_id: `test_${Date.now()}`,
        action_source: "website",
        user_data: {
          client_user_agent: "Decantre-WL-Ecom/Backend-CAPI-Tester",
        },
        custom_data: {
          test: true,
          system: "WL-Ecom Admin Dashboard",
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
      },
      body: JSON.stringify(testPayload),
    });

    const responseBody = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg = responseBody?.error?.message || `Meta Graph API responded with HTTP ${res.status}`;
      return {
        success: false,
        status: res.status,
        message: errMsg,
        raw: responseBody,
      };
    }

    return {
      success: true,
      status: 200,
      message: "Meta Conversions API connection verified successfully.",
      eventsReceived: responseBody?.events_received || 1,
      fbtraceId: responseBody?.fbtrace_id || "",
    };
  } catch (error) {
    return {
      success: false,
      status: 500,
      message: error.message || "Network error connecting to Meta Graph API",
    };
  }
};

// Helper to safely extract cookies from request headers or cookie parser
const getCookie = (req, name) => {
  if (req?.cookies && req.cookies[name]) return req.cookies[name];
  const cookieHeader = req?.headers?.cookie;
  if (!cookieHeader) return "";
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
};

// Extracts real client IP address (preserving native IPv6 and IPv4)
export const extractClientIp = (req) => {
  if (!req) return "";
  let ip =
    req.headers?.["cf-connecting-ip"] ||
    req.headers?.["true-client-ip"] ||
    req.headers?.["x-real-ip"] ||
    req.headers?.["x-forwarded-for"]?.split(",")?.[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    "";

  // Clean mapped IPv4 prefixes (::ffff:192.0.2.1 -> 192.0.2.1) while preserving native IPv6 (e.g., 2400:...)
  if (ip.startsWith("::ffff:") && ip.includes(".")) {
    ip = ip.replace(/^::ffff:/, "");
  }
  return ip.trim();
};

// Sends server-side Purchase event to Meta Conversions API asynchronously
export const sendServerPurchaseEvent = async (order, req = null) => {
  try {
    // Strictly prevent in-store walk-in counter sales or manual orders from being sent to Meta CAPI
    const isInstore =
      order?.orderType === "instore" ||
      req?.body?.orderType === "instore" ||
      String(order?.orderNumber || "").startsWith("IS") ||
      String(order?.billingInfo?.email || "").includes("instore@");

    if (isInstore) {
      return;
    }

    const metaConfig = await getMetaPixelConfig();

    if (!metaConfig.isEnabled || !metaConfig.enableCapi) {
      return;
    }

    const { pixelId, accessToken, testEventCode, advancedMatching } = metaConfig;

    if (!pixelId || !accessToken) {
      return;
    }

    const customer = order.billingInfo || order.shippingInfo || {};
    const nameParts = (customer.fullName || req?.body?.billingInfo?.fullName || req?.body?.fullName || "").trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const clientIp = extractClientIp(req);
    const clientUserAgent = req?.headers?.["user-agent"] || "";

    const fbp = getCookie(req, "_fbp") || req?.body?.fbp || "";
    const fbc = getCookie(req, "_fbc") || req?.body?.fbc || "";

    const rawEmail = (
      customer.email ||
      order.email ||
      order.customerEmail ||
      order.billingInfo?.email ||
      order.shippingInfo?.email ||
      req?.body?.billingInfo?.email ||
      req?.body?.shippingInfo?.email ||
      req?.body?.email ||
      req?.body?.customerEmail ||
      ""
    ).trim();

    const rawPhone = (
      customer.phone ||
      order.phone ||
      order.customerPhone ||
      order.billingInfo?.phone ||
      order.shippingInfo?.phone ||
      req?.body?.billingInfo?.phone ||
      req?.body?.shippingInfo?.phone ||
      req?.body?.phone ||
      ""
    );

    const userData = {
      ...(clientIp ? { client_ip_address: clientIp } : {}),
      // Meta Conversions API Rule: User Agent must be paired with Client IP Address
      ...(clientIp && clientUserAgent ? { client_user_agent: clientUserAgent } : {}),
      ...(fbp ? { fbp } : {}),
      ...(fbc ? { fbc } : {}),
    };

    if (advancedMatching) {
      const hashedEmail = sha256(rawEmail);
      const normalizedPhoneNum = normalizePhone(rawPhone);
      const hashedPhone = sha256(normalizedPhoneNum);
      const hashedFn = sha256(firstName);
      const hashedLn = sha256(lastName);
      const hashedCity = sha256(customer.district || customer.thana || req?.body?.billingInfo?.district || "");
      const hashedZip = sha256(customer.zip || req?.body?.billingInfo?.zip || "");
      const hashedCountry = sha256("bd");

      if (hashedEmail) userData.em = [hashedEmail];
      if (hashedPhone) userData.ph = [hashedPhone];
      if (hashedFn) userData.fn = [hashedFn];
      if (hashedLn) userData.ln = [hashedLn];
      if (hashedCity) userData.ct = [hashedCity];
      if (hashedZip) userData.zp = [hashedZip];
      if (hashedCountry) userData.country = [hashedCountry];

      if (order.member || order.customerDid) {
        userData.external_id = [sha256(String(order.member || order.customerDid))];
      }
    }

    const items = Array.isArray(order.items) ? order.items : [];
    const contents = items.map((item) => ({
      id: String(item.productDid || item.sku || item.productId || item.name || ""),
      quantity: item.quantity || 1,
      item_price: Number(item.unitPrice || 0),
    }));

    const contentIds = contents.map((c) => c.id).filter(Boolean);

    const orderTotalAmount = Number(
      order.totals?.total ?? order.total ?? order.totalAmount ?? 0
    );

    const customData = {
      currency: "BDT",
      value: orderTotalAmount,
      content_type: "product",
      contents,
      content_ids: contentIds,
      num_items: items.reduce((acc, i) => acc + (i.quantity || 1), 0),
      order_id: String(order.orderNumber || order._id || ""),
    };

    const eventPayload = {
      event_name: "Purchase",
      event_time: Math.floor(Date.now() / 1000),
      event_id: `purchase_${order.orderNumber || order._id}`,
      action_source: "website",
      user_data: userData,
      custom_data: customData,
    };

    const requestBody = {
      data: [eventPayload],
      ...(testEventCode ? { test_event_code: testEventCode } : {}),
    };

    const endpoint = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`;

    fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.text();
          console.warn("[Meta CAPI Server] Response error:", errData);
        }
      })
      .catch((err) => {
        console.warn("[Meta CAPI Server] Network error:", err.message);
      });
  } catch (err) {
    console.warn("[Meta CAPI Server] Request builder exception:", err.message);
  }
};

// Sends server-side ViewContent event to Meta Conversions API asynchronously with IPv6 preservation
export const sendServerViewContentEvent = async ({
  product,
  req = null,
  eventId = "",
  eventSourceUrl = "",
  user = {},
}) => {
  try {
    const metaConfig = await getMetaPixelConfig();

    if (!metaConfig.isEnabled || !metaConfig.enableCapi) {
      return;
    }

    const { pixelId, accessToken, testEventCode, advancedMatching } = metaConfig;

    if (!pixelId || !accessToken) {
      return;
    }

    const clientIp = extractClientIp(req);
    const clientUserAgent = req?.headers?.["user-agent"] || "";
    const fbp = getCookie(req, "_fbp") || req?.body?.fbp || "";
    const fbc = getCookie(req, "_fbc") || req?.body?.fbc || "";

    const userData = {
      ...(clientIp ? { client_ip_address: clientIp } : {}),
      ...(clientIp && clientUserAgent ? { client_user_agent: clientUserAgent } : {}),
      ...(fbp ? { fbp } : {}),
      ...(fbc ? { fbc } : {}),
    };

    if (advancedMatching && user) {
      const email = user.email || "";
      const phone = user.phone || "";
      if (email) userData.em = [sha256(email)];
      if (phone) userData.ph = [sha256(normalizePhone(phone))];
      if (user.memberId || user.did) {
        userData.external_id = [sha256(String(user.memberId || user.did))];
      }
    }

    const price = Number(product?.offerPrice || product?.price || 0);
    const productId = String(product?.did || product?._id || product?.id || "");
    const productName = product?.name || "";
    const category = product?.category?.name || product?.category || "";

    const customData = {
      currency: "BDT",
      value: price,
      content_name: productName,
      content_category: category,
      content_ids: productId ? [productId] : [],
      content_type: "product",
      contents: productId
        ? [
            {
              id: productId,
              quantity: 1,
              item_price: price,
            },
          ]
        : [],
    };

    const eventPayload = {
      event_name: "ViewContent",
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId || `view_${productId}_${Date.now()}`,
      action_source: "website",
      ...(eventSourceUrl ? { event_source_url: eventSourceUrl } : {}),
      user_data: userData,
      custom_data: customData,
    };

    const requestBody = {
      data: [eventPayload],
      ...(testEventCode ? { test_event_code: testEventCode } : {}),
    };

    const endpoint = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`;

    fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.text();
          console.warn("[Meta CAPI ViewContent] Response error:", errData);
        }
      })
      .catch((err) => {
        console.warn("[Meta CAPI ViewContent] Network error:", err.message);
      });
  } catch (err) {
    console.warn("[Meta CAPI ViewContent] Request builder exception:", err.message);
  }
};

