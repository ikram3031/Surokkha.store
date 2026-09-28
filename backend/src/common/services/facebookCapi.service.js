import crypto from "crypto";
import { env } from "../config/env.js";
import { config as clientConfig } from "../config/index.js";
import { StoreSettingsModel } from "../models/storeSettings.model.js";
import { MemberModel } from "../models/member.model.js";
import { ProductModel } from "../models/product.model.js";

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

    const fbp = req?.body?.fbp || req?.query?.fbp || getCookie(req, "_fbp") || "";
    const fbc = req?.body?.fbc || req?.query?.fbc || getCookie(req, "_fbc") || "";

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

      const rawCity = (
        customer.city ||
        customer.district ||
        customer.thana ||
        req?.body?.billingInfo?.city ||
        req?.body?.billingInfo?.district ||
        "dhaka"
      );
      const hashedCity = sha256(rawCity);

      const rawState = (
        customer.state ||
        customer.division ||
        customer.district ||
        req?.body?.billingInfo?.state ||
        req?.body?.billingInfo?.division ||
        req?.body?.billingInfo?.district ||
        req?.body?.state ||
        req?.body?.division ||
        req?.body?.district ||
        "dhaka"
      );
      const hashedState = sha256(rawState);

      const rawZip = customer.zip || req?.body?.billingInfo?.zip || "";
      const hashedCountry = sha256("bd");

      if (hashedEmail) userData.em = [hashedEmail];
      if (hashedPhone) userData.ph = [hashedPhone];
      if (hashedFn) userData.fn = [hashedFn];
      if (hashedLn) userData.ln = [hashedLn];
      if (hashedCity) userData.ct = [hashedCity];
      if (hashedState) userData.st = [hashedState];
      if (rawZip) userData.zp = [sha256(rawZip)];
      if (hashedCountry) userData.country = [hashedCountry];

      // Attempt to enrich ge (gender) and db (date of birth) from linked member record or req.body
      try {
        const memberId = order.member || req?.body?.memberId || req?.body?.member || null;
        const memberEmail = rawEmail || "";

        // Prefer req.body signals (passed from storefront at checkout time)
        const rawGender = (req?.body?.gender || req?.body?.gen || "").toLowerCase().trim();
        const rawDob = req?.body?.dob || req?.body?.dateOfBirth || req?.body?.db || "";

        let resolvedGender = rawGender;
        let resolvedDob = rawDob;

        // If not in req.body, try member database lookup
        if ((!resolvedGender || !resolvedDob) && (memberId || memberEmail)) {
          const query = memberId
            ? { _id: memberId }
            : { email: memberEmail.toLowerCase() };
          const memberDoc = await MemberModel.findOne(query).select("gender dob dateOfBirth").lean().catch(() => null);
          if (memberDoc) {
            if (!resolvedGender && memberDoc.gender) resolvedGender = String(memberDoc.gender).toLowerCase().trim();
            if (!resolvedDob && (memberDoc.dob || memberDoc.dateOfBirth)) {
              resolvedDob = memberDoc.dob || memberDoc.dateOfBirth;
            }
          }
        }

        // ge: normalize to "m" or "f" for Meta CAPI
        if (resolvedGender) {
          const genderNorm = resolvedGender.startsWith("m") ? "m" : resolvedGender.startsWith("f") ? "f" : "";
          if (genderNorm) userData.ge = [sha256(genderNorm)];
        }

        // db: normalize to YYYYMMDD for Meta CAPI
        if (resolvedDob) {
          const dobStr = String(resolvedDob).replace(/\D/g, "");
          if (dobStr.length === 8) {
            // Already YYYYMMDD
            userData.db = [sha256(dobStr)];
          } else {
            const dobDate = new Date(resolvedDob);
            if (!isNaN(dobDate.getTime())) {
              const y = dobDate.getFullYear();
              const m = String(dobDate.getMonth() + 1).padStart(2, "0");
              const d = String(dobDate.getDate()).padStart(2, "0");
              userData.db = [sha256(`${y}${m}${d}`)];
            }
          }
        }
      } catch (_enrichErr) {
        // Non-fatal: skip ge/db enrichment if lookup fails
      }

      const rawExtId = (
        order.member ||
        order.customerDid ||
        req?.body?.externalId ||
        req?.body?.external_id ||
        String(order.orderNumber || order._id || "")
      );
      if (rawExtId) {
        userData.external_id = [sha256(String(rawExtId))];
      }
    }

    const items = Array.isArray(order.items) ? order.items : [];
    const contents = items.map((item) => ({
      id: String(item.productDid || item.sku || item.productId || item.name || ""),
      quantity: item.quantity || 1,
      item_price: Number(item.unitPrice || 0),
    }));

    // Fetch product slugs dynamically to ensure Purchase event matches catalog exported with slug mapping
    const productMongoIds = items.map(i => i.productId).filter(Boolean);
    let extraSlugs = [];
    if (productMongoIds.length > 0) {
      const dbProducts = await ProductModel.find({ _id: { $in: productMongoIds } }, 'slug did _id').lean();
      extraSlugs = dbProducts.map(p => p.slug || p.did || String(p._id));
    }

    const contentIds = [...new Set([...contents.map((c) => c.id).filter(Boolean), ...extraSlugs.filter(Boolean)])];

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
      event_id: String(order.orderNumber || order.orderId || order._id),
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
    const fbp = req?.body?.fbp || req?.query?.fbp || getCookie(req, "_fbp") || "";
    const fbc = req?.body?.fbc || req?.query?.fbc || getCookie(req, "_fbc") || "";

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

      const name = (user.name || user.fullName || "").trim();
      if (name) {
        const parts = name.split(/\s+/);
        if (parts[0]) userData.fn = [sha256(parts[0])];
        if (parts.length > 1) userData.ln = [sha256(parts.slice(1).join(" "))];
      } else {
        if (user.fn) userData.fn = [sha256(user.fn)];
        if (user.ln) userData.ln = [sha256(user.ln)];
      }

      if (user.city || user.district) userData.ct = [sha256(user.city || user.district)];
      if (user.state || user.division || user.district) userData.st = [sha256(user.state || user.division || user.district)];
      userData.country = [sha256("bd")];
      if (user.memberId || user.did || user.externalId) {
        userData.external_id = [sha256(String(user.memberId || user.did || user.externalId))];
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

// Sends server-side AddToCart event to Meta Conversions API using product.did as canonical content_id
export const sendServerAddToCartEvent = async ({
  product,
  quantity = 1,
  currency = "BDT",
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
    const fbp = req?.body?.fbp || req?.query?.fbp || getCookie(req, "_fbp") || "";
    const fbc = req?.body?.fbc || req?.query?.fbc || getCookie(req, "_fbc") || "";

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

      const name = (user.name || user.fullName || "").trim();
      if (name) {
        const parts = name.split(/\s+/);
        if (parts[0]) userData.fn = [sha256(parts[0])];
        if (parts.length > 1) userData.ln = [sha256(parts.slice(1).join(" "))];
      } else {
        if (user.fn) userData.fn = [sha256(user.fn)];
        if (user.ln) userData.ln = [sha256(user.ln)];
      }

      if (user.city || user.district) userData.ct = [sha256(user.city || user.district)];
      if (user.state || user.division || user.district) userData.st = [sha256(user.state || user.division || user.district)];
      userData.country = [sha256("bd")];
      if (user.memberId || user.did || user.externalId) {
        userData.external_id = [sha256(String(user.memberId || user.did || user.externalId))];
      }
    }

    const price = Number(product?.offerPrice || product?.price || 0);
    const productId = String(product?.did || product?._id || product?.id || "");
    const productName = product?.name || "";
    const category = product?.category?.name || product?.category || "";
    const qty = Number(quantity || 1);

    const customData = {
      currency,
      value: price * qty,
      content_name: productName,
      content_category: category,
      content_ids: productId ? [productId] : [],
      content_type: "product",
      contents: productId
        ? [
            {
              id: productId,
              quantity: qty,
              item_price: price,
            },
          ]
        : [],
    };

    const eventPayload = {
      event_name: "AddToCart",
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId || `atc_${productId}_${Date.now()}`,
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
          console.warn("[Meta CAPI AddToCart] Response error:", errData);
        }
      })
      .catch((err) => {
        console.warn("[Meta CAPI AddToCart] Network error:", err.message);
      });
  } catch (err) {
    console.warn("[Meta CAPI AddToCart] Request builder exception:", err.message);
  }
};
