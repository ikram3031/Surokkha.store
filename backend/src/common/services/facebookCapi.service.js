import mongoose from "mongoose";
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

// Meta rejects the whole event unless content_category is a string; storefront sends brand/category objects or arrays
const toCategoryString = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(toCategoryString).filter(Boolean).join(", ");
  if (typeof value === "object") return toCategoryString(value.name || value.title || value.label || value.slug || "");
  return String(value);
};

// The store (surokkha.store) keeps its Meta Pixel in its own settings document, separate from the shop's
export const STORE_META_PIXEL_KEY = "store-meta-pixel";

// Requests served by the storeWeb API (/store/...) belong to the store
const isStoreRequest = (...sources) =>
  sources.some((s) => s === "store" || String(s?.originalUrl || s?.baseUrl || "").startsWith("/store/"));

// Orders from the offer landing page (offer.surokkha.shop) carry the OS prefix
export const OFFER_ORDER_PREFIX = "OS";
export const OFFER_SITE_URL = "https://offer.surokkha.shop/";
export const isOfferOrder = (order, req = null) =>
  String(order?.orderNumber || "").toUpperCase().startsWith(OFFER_ORDER_PREFIX) ||
  String(req?.body?.orderPrefix || "").toUpperCase() === OFFER_ORDER_PREFIX;

// Optional env override for the offer page pixel (FB_PIXEL_ID_OFFER / FB_ACCESS_TOKEN_OFFER)
// Offer page pixel: env override (FB_PIXEL_ID_OFFER / FB_ACCESS_TOKEN_OFFER) first, otherwise the
// top-level metaPixel of the default settings document (pixel 1840805450442709 and its saved token)
const getOfferMetaPixelConfig = async () => {
  let meta = {};
  if (!env.FB_ACCESS_TOKEN_OFFER && mongoose.connection?.readyState === 1) {
    const doc = await StoreSettingsModel.findOne({ key: "default" }).lean().catch(() => null);
    meta = doc?.metaPixel || {};
  }
  const pixelId = env.FB_ACCESS_TOKEN_OFFER ? env.FB_PIXEL_ID_OFFER : meta.pixelId || env.FB_PIXEL_ID_OFFER || "";
  const accessToken = env.FB_ACCESS_TOKEN_OFFER || meta.accessToken || "";
  if (!pixelId || !accessToken) {
    console.warn("[Meta CAPI Config] Warning: Offer Meta Pixel / CAPI credentials not configured. Event skipped.");
  }
  return {
    pixelId,
    accessToken,
    testEventCode: env.FB_TEST_EVENT_CODE_OFFER || meta.testEventCode || "",
    isEnabled: !!(pixelId && accessToken) && meta.isEnabled !== false,
    enableCapi: !!(pixelId && accessToken) && meta.enableCapi !== false,
    enableBrowserPixel: true,
    advancedMatching: meta.advancedMatching ?? true,
  };
};

// Resolves the store's Meta Pixel configuration from its own settings document
export const getStoreMetaPixelConfig = async () => {
  let meta = {};
  if (mongoose.connection?.readyState === 1) {
    const doc = await StoreSettingsModel.findOne({ key: STORE_META_PIXEL_KEY }).lean().catch(() => null);
    meta = doc?.metaPixel || {};
  }
  const pixelId = meta.pixelId || env.FB_PIXEL_ID_STORE || "";
  const accessToken = meta.accessToken || env.FB_ACCESS_TOKEN_STORE || "";
  if (!pixelId || !accessToken) {
    console.warn("[Meta CAPI Config] Warning: Store Meta Pixel / CAPI credentials not configured. Event skipped.");
  }
  return {
    pixelId,
    accessToken,
    testEventCode: meta.testEventCode || env.FB_TEST_EVENT_CODE_STORE || "",
    isEnabled: meta.isEnabled ?? true,
    enableBrowserPixel: meta.enableBrowserPixel ?? true,
    enableCapi: meta.enableCapi ?? true,
    advancedMatching: meta.advancedMatching ?? true,
    lastVerifiedAt: meta.lastVerifiedAt || null,
    lastTestStatus: meta.lastTestStatus || "untested",
    lastTestMessage: meta.lastTestMessage || "",
  };
};

// Resolves active Meta Pixel configuration: store requests use the store's own settings, everything else the shop's
export const getMetaPixelConfig = async (source = null, req = null) => {
  // offer.surokkha.shop orders (SC) go to the offer pixel, not the store or shop one
  const offer = isOfferOrder(source, req);
  if (offer) {
    return getOfferMetaPixelConfig().catch((error) => {
      console.error("[Meta CAPI Config] Error resolving offer Meta Pixel config:", error.message);
      return { pixelId: "", accessToken: "", testEventCode: "", isEnabled: false, enableCapi: false };
    });
  }
  if (!offer && isStoreRequest(source, req)) {
    return getStoreMetaPixelConfig().catch((error) => {
      console.error("[Meta CAPI Config] Error resolving store Meta Pixel config:", error.message);
      return { pixelId: "", accessToken: "", testEventCode: "", isEnabled: false, enableCapi: false };
    });
  }
  try {
    let doc = null;
    if (mongoose.connection?.readyState === 1) {
      doc = await StoreSettingsModel.findOne({ key: "default" }).lean().catch(() => null);
    }
    const dbMeta = doc?.metaPixel || {};
    const dbSiteMeta = doc?.sites?.shop?.metaPixel;
    const fallbackClientMeta = clientConfig?.metaPixel || {};
    const siteConfigMeta = clientConfig?.sites?.shop?.metaPixel;

    const pixelId = dbSiteMeta?.pixelId || env.FB_PIXEL_ID_SHOP || siteConfigMeta?.pixelId || dbMeta.pixelIdShop || "";
    const accessToken = dbSiteMeta?.accessToken || env.FB_ACCESS_TOKEN_SHOP || siteConfigMeta?.accessToken || dbMeta.accessTokenShop || "";
    const testEventCode = dbSiteMeta?.testEventCode || env.FB_TEST_EVENT_CODE_SHOP || siteConfigMeta?.testEventCode || "";

    if (!pixelId || !accessToken) {
      console.warn("[Meta CAPI Config] Warning: Shop Meta Pixel / CAPI credentials not configured. Event skipped.");
    }

    return {
      pixelId,
      accessToken,
      testEventCode,
      isEnabled: dbSiteMeta?.isEnabled ?? siteConfigMeta?.isEnabled ?? dbMeta.isEnabled ?? fallbackClientMeta.isEnabled ?? true,
      enableBrowserPixel: dbSiteMeta?.enableBrowserPixel ?? siteConfigMeta?.enableBrowserPixel ?? dbMeta.enableBrowserPixel ?? fallbackClientMeta.enableBrowserPixel ?? true,
      enableCapi: dbSiteMeta?.enableCapi ?? siteConfigMeta?.enableCapi ?? dbMeta.enableCapi ?? fallbackClientMeta.enableCapi ?? true,
      advancedMatching: dbSiteMeta?.advancedMatching ?? siteConfigMeta?.advancedMatching ?? dbMeta.advancedMatching ?? fallbackClientMeta.advancedMatching ?? true,
      lastVerifiedAt: dbSiteMeta?.lastVerifiedAt || dbMeta.lastVerifiedAt || null,
      lastTestStatus: dbSiteMeta?.lastTestStatus || dbMeta.lastTestStatus || "untested",
      lastTestMessage: dbSiteMeta?.lastTestMessage || dbMeta.lastTestMessage || "",
    };
  } catch (error) {
    console.error("[Meta CAPI Config] Error resolving Meta Pixel config:", error.message);
    return {
      pixelId: env.FB_PIXEL_ID_SHOP || "",
      accessToken: env.FB_ACCESS_TOKEN_SHOP || "",
      testEventCode: env.FB_TEST_EVENT_CODE_SHOP || "",
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
export const testMetaCapiConnection = async ({ pixelId, accessToken, testEventCode = "", fbLoginId = "" }) => {
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
          client_user_agent: "Flexivia-WL-Ecom/Backend-CAPI-Tester",
          external_id: [sha256(`capi-test-${pixelId}`)],
          ...(fbLoginId ? { fb_login_id: String(fbLoginId).trim() } : {}),
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

// Extracts Facebook Login ID (App-Scoped User ID) from source object, req, or cookies
export const extractFbLoginId = (source = null, req = null) => {
  if (!source && !req) return "";
  let fbId = "";
  if (typeof source === "string") {
    fbId = source;
  } else if (source && typeof source === "object") {
    fbId =
      source.fb_login_id ||
      source.fbLoginId ||
      source.facebookId ||
      source.user?.fb_login_id ||
      source.user?.fbLoginId ||
      source.user?.facebookId ||
      "";
  }
  if (!fbId && req) {
    fbId =
      req.body?.fb_login_id ||
      req.body?.fbLoginId ||
      req.body?.facebookId ||
      req.query?.fb_login_id ||
      req.query?.fbLoginId ||
      req.headers?.["x-fb-login-id"] ||
      getCookie(req, "fb_login_id") ||
      getCookie(req, "_fb_login_id") ||
      getCookie(req, "fblid") ||
      "";
  }
  return String(fbId || "").trim();
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

// In-memory deduplication cache for server-side purchase events (prevents duplicate dispatches within 60s)
const recentServerPurchases = new Map();
const PURCHASE_DEDUPLICATION_WINDOW_MS = 60 * 1000;

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

    const resolvedOrderNumber = String(order?.orderNumber || order?.orderId || order?._id || "").trim();
    if (!resolvedOrderNumber) {
      return;
    }

    // Server-side idempotent deduplication guard
    const now = Date.now();
    for (const [key, timestamp] of recentServerPurchases.entries()) {
      if (now - timestamp > PURCHASE_DEDUPLICATION_WINDOW_MS) {
        recentServerPurchases.delete(key);
      }
    }

    if (recentServerPurchases.has(resolvedOrderNumber)) {
      console.log(`[Meta CAPI Server] Deduplication guard: Purchase event for order ${resolvedOrderNumber} was already dispatched recently. Skipping.`);
      return;
    }
    recentServerPurchases.set(resolvedOrderNumber, now);

    const metaConfig = await getMetaPixelConfig(order, req);

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
    const fbLoginId = extractFbLoginId(order, req);

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
      ...(fbLoginId ? { fb_login_id: fbLoginId } : {}),
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
        if (mongoose.connection?.readyState === 1 && (!resolvedGender || !resolvedDob || !userData.fb_login_id) && (memberId || memberEmail)) {
          const query = memberId
            ? { _id: memberId }
            : { email: memberEmail.toLowerCase() };
          const memberDoc = await MemberModel.findOne(query).select("gender dob dateOfBirth fbLoginId facebookId").lean().catch(() => null);
          if (memberDoc) {
            if (!userData.fb_login_id && (memberDoc.fbLoginId || memberDoc.facebookId)) {
              userData.fb_login_id = String(memberDoc.fbLoginId || memberDoc.facebookId).trim();
            }
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

    let items = Array.isArray(order.items) ? order.items : [];
    items = items.filter(i => i.itemType !== 'item');
    
    if (items.length === 0) return;
    const productDids = items.map((i) => i.productDid).filter(Boolean);
    const productNames = items.map((i) => i.name).filter(Boolean);
    const validMongoIds = items.map((i) => i.productId).filter((id) => mongoose.Types.ObjectId.isValid(id));

    let dbProducts = [];
    if (mongoose.connection?.readyState === 1) {
      dbProducts = (await ProductModel.find(
        {
          $or: [
            ...(validMongoIds.length ? [{ _id: { $in: validMongoIds } }] : []),
            ...(productDids.length ? [{ did: { $in: productDids } }, { slug: { $in: productDids } }] : []),
            ...(productNames.length ? [{ name: { $in: productNames } }] : []),
          ],
        },
        'slug did _id sku name'
      ).lean().catch(() => [])) || [];
    }

    const dbMap = new Map();
    dbProducts.forEach((p) => {
      if (p.did) dbMap.set(p.did, p);
      if (p.slug) dbMap.set(p.slug, p);
      if (p.name) dbMap.set(p.name, p);
    });

    const contents = items.map((item) => {
      const matched = dbMap.get(item.productDid) || dbMap.get(item.name);
      return {
        // Custom lines (offer page) have no product; their SKU (e.g. SC01P001-10) is the catalog id
        id: String(matched?.did || item.productDid || (item.itemType === "custom" && item.sku) || item.name || ""),
        quantity: item.quantity || 1,
        item_price: Number(item.unitPrice || 0),
      };
    });

    const contentIds = [...new Set(contents.map((c) => c.id).filter(Boolean))];

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
      order_id: resolvedOrderNumber,
    };

    const eventPayload = {
      event_name: "Purchase",
      event_time: Math.floor(Date.now() / 1000),
      event_id: resolvedOrderNumber,
      action_source: "website",
      ...(isOfferOrder(order, req) ? { event_source_url: OFFER_SITE_URL } : {}),
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
          return;
        }
        console.log(`[Meta CAPI Server] Purchase sent: order=${resolvedOrderNumber} pixel=${pixelId} value=${orderTotalAmount}`);
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
    const metaConfig = await getMetaPixelConfig(req || eventSourceUrl);

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
    const fbLoginId = extractFbLoginId(user, req);

    const userData = {
      ...(clientIp ? { client_ip_address: clientIp } : {}),
      ...(clientIp && clientUserAgent ? { client_user_agent: clientUserAgent } : {}),
      ...(fbp ? { fbp } : {}),
      ...(fbc ? { fbc } : {}),
      ...(fbLoginId ? { fb_login_id: fbLoginId } : {}),
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
    const category = toCategoryString(product?.category);

    const contentIds = [...new Set([
      product?.did,
      product?.slug,
      product?._id ? String(product._id) : "",
      product?.id ? String(product.id) : "",
    ].filter(Boolean))];

    const customData = {
      currency: "BDT",
      value: price,
      content_name: productName,
      content_category: category,
      content_ids: contentIds.length ? contentIds : (productId ? [productId] : []),
      content_type: "product",
      contents: productId
        ? [
            {
              id: String(product?.did || productId),
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
    const metaConfig = await getMetaPixelConfig(req || eventSourceUrl);

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
    const fbLoginId = extractFbLoginId(user, req);

    const userData = {
      ...(clientIp ? { client_ip_address: clientIp } : {}),
      ...(clientIp && clientUserAgent ? { client_user_agent: clientUserAgent } : {}),
      ...(fbp ? { fbp } : {}),
      ...(fbc ? { fbc } : {}),
      ...(fbLoginId ? { fb_login_id: fbLoginId } : {}),
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
    const category = toCategoryString(product?.category);
    const qty = Number(quantity || 1);

    const atcContentIds = [...new Set([
      product?.did,
      product?.slug,
      product?._id ? String(product._id) : "",
      product?.id ? String(product.id) : "",
    ].filter(Boolean))];

    const customData = {
      currency,
      value: price * qty,
      content_name: productName,
      content_category: category,
      content_ids: atcContentIds.length ? atcContentIds : (productId ? [productId] : []),
      content_type: "product",
      contents: productId
        ? [
            {
              id: String(product?.did || productId),
              quantity: qty,
              item_price: price,
            },
          ]
        : [],
      num_items: qty,
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

// Sends server-side InitiateCheckout event to Meta Conversions API
export const sendServerInitiateCheckoutEvent = async ({ customData, req = null, eventId = '', eventSourceUrl = '', user = {} }) => {
  try {
    const metaConfig = await getMetaPixelConfig(req || eventSourceUrl);
    if (!metaConfig.isEnabled || !metaConfig.enableCapi) return;
    const { pixelId, accessToken, testEventCode, advancedMatching } = metaConfig;
    if (!pixelId || !accessToken) return;

    const clientIp = extractClientIp(req);
    const clientUserAgent = req?.headers?.['user-agent'] || '';
    const fbp = req?.body?.fbp || req?.query?.fbp || getCookie(req, '_fbp') || '';
    const fbc = req?.body?.fbc || req?.query?.fbc || getCookie(req, '_fbc') || '';
    const fbLoginId = extractFbLoginId(user, req);

    const userData = {
      ...(clientIp ? { client_ip_address: clientIp } : {}),
      ...(clientIp && clientUserAgent ? { client_user_agent: clientUserAgent } : {}),
      ...(fbp ? { fbp } : {}),
      ...(fbc ? { fbc } : {}),
      ...(fbLoginId ? { fb_login_id: fbLoginId } : {}),
    };

    if (advancedMatching && user) {
      const email = user.email || '';
      const phone = user.phone || '';
      if (email) userData.em = [sha256(email)];
      if (phone) userData.ph = [sha256(normalizePhone(phone))];

      const name = (user.name || user.fullName || '').trim();
      if (name) {
        const parts = name.split(/\s+/);
        if (parts[0]) userData.fn = [sha256(parts[0])];
        if (parts.length > 1) userData.ln = [sha256(parts.slice(1).join(' '))];
      } else {
        if (user.fn) userData.fn = [sha256(user.fn)];
        if (user.ln) userData.ln = [sha256(user.ln)];
      }

      if (user.city || user.district) userData.ct = [sha256(user.city || user.district)];
      if (user.state || user.division || user.district) userData.st = [sha256(user.state || user.division || user.district)];
      userData.country = [sha256('bd')];
      if (user.memberId || user.did || user.externalId) {
        userData.external_id = [sha256(String(user.memberId || user.did || user.externalId))];
      }
    }

    const eventData = [
      {
        event_name: 'InitiateCheckout',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        ...(eventSourceUrl ? { event_source_url: eventSourceUrl } : {}),
        ...(eventId ? { event_id: eventId } : {}),
        user_data: userData,
        custom_data: customData,
      },
    ];

    const payload = {
      data: eventData,
      ...(testEventCode ? { test_event_code: testEventCode } : {}),
    };

    fetch(`https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(async (response) => {
        if (!response.ok) {
          const errData = await response.json();
          console.warn('[Meta CAPI InitiateCheckout] Response error:', errData);
        }
      })
      .catch((err) => {
        console.warn('[Meta CAPI InitiateCheckout] Network error:', err.message);
      });
  } catch (err) {
    console.warn('[Meta CAPI InitiateCheckout] Request builder exception:', err.message);
  }
};

// Sends server-side AddPaymentInfo event to Meta Conversions API
export const sendServerAddPaymentInfoEvent = async ({ customData, req = null, eventId = '', eventSourceUrl = '', user = {} }) => {
  try {
    const metaConfig = await getMetaPixelConfig(req || eventSourceUrl);
    if (!metaConfig.isEnabled || !metaConfig.enableCapi) return;
    const { pixelId, accessToken, testEventCode, advancedMatching } = metaConfig;
    if (!pixelId || !accessToken) return;

    const clientIp = extractClientIp(req);
    const clientUserAgent = req?.headers?.['user-agent'] || '';
    const fbp = req?.body?.fbp || req?.query?.fbp || getCookie(req, '_fbp') || '';
    const fbc = req?.body?.fbc || req?.query?.fbc || getCookie(req, '_fbc') || '';
    const fbLoginId = extractFbLoginId(user, req);

    const userData = {
      ...(clientIp ? { client_ip_address: clientIp } : {}),
      ...(clientIp && clientUserAgent ? { client_user_agent: clientUserAgent } : {}),
      ...(fbp ? { fbp } : {}),
      ...(fbc ? { fbc } : {}),
      ...(fbLoginId ? { fb_login_id: fbLoginId } : {}),
    };

    if (advancedMatching && user) {
      const email = user.email || '';
      const phone = user.phone || '';
      if (email) userData.em = [sha256(email)];
      if (phone) userData.ph = [sha256(normalizePhone(phone))];

      const name = (user.name || user.fullName || '').trim();
      if (name) {
        const parts = name.split(/\s+/);
        if (parts[0]) userData.fn = [sha256(parts[0])];
        if (parts.length > 1) userData.ln = [sha256(parts.slice(1).join(' '))];
      } else {
        if (user.fn) userData.fn = [sha256(user.fn)];
        if (user.ln) userData.ln = [sha256(user.ln)];
      }

      if (user.city || user.district) userData.ct = [sha256(user.city || user.district)];
      if (user.state || user.division || user.district) userData.st = [sha256(user.state || user.division || user.district)];
      userData.country = [sha256('bd')];
      if (user.memberId || user.did || user.externalId) {
        userData.external_id = [sha256(String(user.memberId || user.did || user.externalId))];
      }
    }

    const eventData = [
      {
        event_name: 'AddPaymentInfo',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        ...(eventSourceUrl ? { event_source_url: eventSourceUrl } : {}),
        ...(eventId ? { event_id: eventId } : {}),
        user_data: userData,
        custom_data: customData,
      },
    ];

    const payload = {
      data: eventData,
      ...(testEventCode ? { test_event_code: testEventCode } : {}),
    };

    fetch(`https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(async (response) => {
        if (!response.ok) {
          const errData = await response.json();
          console.warn('[Meta CAPI AddPaymentInfo] Response error:', errData);
        }
      })
      .catch((err) => {
        console.warn('[Meta CAPI AddPaymentInfo] Network error:', err.message);
      });
  } catch (err) {
    console.warn('[Meta CAPI AddPaymentInfo] Request builder exception:', err.message);
  }
};
