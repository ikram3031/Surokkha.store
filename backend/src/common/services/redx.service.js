import { StoreSettingsModel } from "../models/storeSettings.model.js";

// RedX OpenAPI (https://redx.com.bd/developer-api/). Auth is a long-lived JWT sent as
// `API-ACCESS-TOKEN: Bearer <token>`; there is no token refresh flow.
export const REDX_BASE_URLS = {
  sandbox: "https://sandbox.redx.com.bd/v1.0.0-beta",
  production: "https://openapi.redx.com.bd/v1.0.0-beta",
};

export async function getRedxConfig() {
  const doc = await StoreSettingsModel.findOne({ key: "default" }).lean();
  const redx = doc?.redxCourier || {};
  const environment = redx.environment || process.env.REDX_ENVIRONMENT || "production";
  return {
    environment,
    baseUrl: REDX_BASE_URLS[environment] || REDX_BASE_URLS.production,
    accessToken: redx.accessToken || process.env.REDX_ACCESS_TOKEN || "",
    pickupStoreId: redx.pickupStoreId || (process.env.REDX_PICKUP_STORE_ID ? Number(process.env.REDX_PICKUP_STORE_ID) : null),
    pickupStoreName: redx.pickupStoreName || "",
    pickupAreaId: redx.pickupAreaId || null,
    defaultParcelWeight: redx.defaultParcelWeight ?? 500,
    isClosedBox: Boolean(redx.isClosedBox),
    webhookToken: redx.webhookToken || "",
    lastWebhookAt: redx.lastWebhookAt || null,
    lastTestedAt: redx.lastTestedAt || null,
    lastTestStatus: redx.lastTestStatus || "untested",
    lastTestMessage: redx.lastTestMessage || "",
    lastOrderSyncAt: redx.lastOrderSyncAt || null,
    lastOrderSyncSummary: redx.lastOrderSyncSummary || "",
  };
}

async function redxRequest(endpoint, options = {}, override = {}) {
  const config = await getRedxConfig();
  const baseUrl = override.baseUrl || config.baseUrl;
  const token = override.accessToken || config.accessToken;
  if (!token) {
    const error = new Error("RedX API token is not configured. Add it in Settings → RedX Courier.");
    error.status = 400;
    throw error;
  }

  const res = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "API-ACCESS-TOKEN": `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  // RedX sometimes answers 503 with { success: true, message: "Request Accepted" } (seen on PATCH /parcels)
  if (!res.ok && data?.success !== true) {
    // validation_errors: [{ "<field>": "<message>" }]
    const validation = Array.isArray(data?.validation_errors)
      ? data.validation_errors.map((e) => (e && typeof e === "object" ? e.message || Object.values(e).join(", ") : String(e))).join(", ")
      : "";
    const detail = data?.message || data?.error || validation || `RedX API Error (${res.status})`;
    const error = new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
    error.status = res.status >= 500 ? 502 : res.status;
    error.data = data;
    throw error;
  }
  return data;
}

// Token check: listing pickup stores is the cheapest authenticated call
export async function testRedxConnection({ accessToken, environment } = {}) {
  const override = {};
  if (accessToken) override.accessToken = accessToken;
  if (environment) override.baseUrl = REDX_BASE_URLS[environment];
  const data = await redxRequest("/pickup/stores", { method: "GET" }, override);
  return { pickupStores: data?.pickup_stores || [] };
}

export async function getRedxAreas({ postCode, districtName } = {}) {
  const params = new URLSearchParams();
  if (postCode) params.set("post_code", postCode);
  if (districtName) params.set("district_name", districtName);
  const qs = params.toString();
  const data = await redxRequest(`/areas${qs ? `?${qs}` : ""}`, { method: "GET" });
  return data?.areas || [];
}

export async function getRedxPickupStores() {
  const data = await redxRequest("/pickup/stores", { method: "GET" });
  return data?.pickup_stores || [];
}

export async function getRedxPickupStore(id) {
  const data = await redxRequest(`/pickup/store/info/${encodeURIComponent(id)}`, { method: "GET" });
  return data?.pickup_store || null;
}

export async function createRedxPickupStore({ name, phone, address, area_id }) {
  return redxRequest("/pickup/store", {
    method: "POST",
    body: JSON.stringify({ name, phone, address, area_id: Number(area_id) }),
  });
}

// weight in grams; returns { deliveryCharge, codCharge }
export async function calculateRedxCharge({ deliveryAreaId, pickupAreaId, cashCollectionAmount, weight }) {
  const params = new URLSearchParams({
    delivery_area_id: String(deliveryAreaId),
    pickup_area_id: String(pickupAreaId),
    cash_collection_amount: String(cashCollectionAmount || 0),
    weight: String(weight || 500),
  });
  return redxRequest(`/charge/charge_calculator?${params}`, { method: "GET" });
}

// Returns { tracking_id }
export async function createRedxParcel(payload) {
  return redxRequest("/parcel", { method: "POST", body: JSON.stringify(payload) });
}

export async function getRedxParcelInfo(trackingId) {
  const data = await redxRequest(`/parcel/info/${encodeURIComponent(String(trackingId).trim())}`, { method: "GET" });
  return data?.parcel || null;
}

export async function trackRedxParcel(trackingId) {
  const data = await redxRequest(`/parcel/track/${encodeURIComponent(String(trackingId).trim())}`, { method: "GET" });
  return data?.tracking || [];
}

export async function cancelRedxParcel(trackingId, reason = "Cancelled by merchant") {
  return redxRequest("/parcels", {
    method: "PATCH",
    body: JSON.stringify({
      entity_type: "parcel-tracking-id",
      entity_id: String(trackingId),
      update_details: { property_name: "status", new_value: "cancelled", reason },
    }),
  });
}
