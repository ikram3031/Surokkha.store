import { StoreSettingsModel } from "../models/storeSettings.model.js";

/**
 * Helper to fetch Pathao configuration from StoreSettingsModel or environment
 */
export async function getPathaoConfig() {
  const doc = await StoreSettingsModel.findOne({ key: "default" }).lean();
  const pathao = doc?.pathaoCourier || {};

  const environment = pathao.environment || process.env.PATHAO_ENVIRONMENT || "production";
  const defaultBaseUrl =
    environment === "sandbox"
      ? "https://courier-api-sandbox.pathao.com"
      : "https://api-hermes.pathao.com";

  return {
    environment,
    baseUrl: pathao.baseUrl || defaultBaseUrl,
    clientId: pathao.clientId || process.env.PATHAO_CLIENT_ID || "",
    clientSecret: pathao.clientSecret || process.env.PATHAO_CLIENT_SECRET || "",
    username: pathao.username || process.env.PATHAO_USERNAME || "",
    password: pathao.password || process.env.PATHAO_PASSWORD || "",
    storeId: pathao.storeId || (process.env.PATHAO_STORE_ID ? Number(process.env.PATHAO_STORE_ID) : null),
    storeName: pathao.storeName || "",
    storeAddress: pathao.storeAddress || "",
    defaultItemWeight: pathao.defaultItemWeight ?? 0.5,
    defaultItemType: pathao.defaultItemType ?? 2, // 1: Document, 2: Parcel
    defaultDeliveryType: pathao.defaultDeliveryType ?? 48, // 48: Normal (48 hrs), 12: On Demand
    isEnabled: pathao.isEnabled ?? true,
    accessToken: pathao.accessToken || "",
    refreshToken: pathao.refreshToken || "",
    tokenExpiresAt: pathao.tokenExpiresAt || null,
    lastTestedAt: pathao.lastTestedAt || null,
    lastTestStatus: pathao.lastTestStatus || "untested",
    lastTestMessage: pathao.lastTestMessage || "",
  };
}

/**
 * Obtains a valid Pathao Access Token, refreshing or re-issuing if needed.
 */
export async function getValidPathaoToken(forceRefresh = false) {
  const config = await getPathaoConfig();
  const now = new Date();

  // If token is still valid (with 5 min safety buffer), return it
  if (
    !forceRefresh &&
    config.accessToken &&
    config.tokenExpiresAt &&
    new Date(config.tokenExpiresAt).getTime() - 300000 > now.getTime()
  ) {
    return { accessToken: config.accessToken, baseUrl: config.baseUrl };
  }

  // If we have a refresh token, try refreshing
  if (config.refreshToken && !forceRefresh) {
    try {
      const refreshRes = await fetch(`${config.baseUrl}/aladdin/api/v1/issue-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          grant_type: "refresh_token",
          refresh_token: config.refreshToken,
        }),
      });

      const refreshData = await refreshRes.json();
      if (refreshRes.ok && refreshData.access_token) {
        const expiresAt = new Date(Date.now() + (refreshData.expires_in || 432000) * 1000);
        await StoreSettingsModel.updateOne(
          { key: "default" },
          {
            $set: {
              "pathaoCourier.accessToken": refreshData.access_token,
              "pathaoCourier.refreshToken": refreshData.refresh_token || config.refreshToken,
              "pathaoCourier.tokenExpiresAt": expiresAt,
            },
          },
          { upsert: true }
        );
        return { accessToken: refreshData.access_token, baseUrl: config.baseUrl };
      }
    } catch (e) {
      console.warn("Failed to refresh Pathao token, falling back to password grant:", e.message);
    }
  }

  // Issue new token with username/password grant
  if (!config.clientId || !config.clientSecret || !config.username || !config.password) {
    throw new Error("Pathao Courier credentials (Client ID, Secret, Username, Password) are not configured.");
  }

  const issueRes = await fetch(`${config.baseUrl}/aladdin/api/v1/issue-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "password",
      username: config.username,
      password: config.password,
    }),
  });

  const issueData = await issueRes.json();
  if (!issueRes.ok || !issueData.access_token) {
    const errMsg = issueData.message || issueData.error_description || issueData.error || "Failed to authenticate with Pathao API.";
    throw new Error(`Pathao Auth Failed: ${errMsg}`);
  }

  const expiresAt = new Date(Date.now() + (issueData.expires_in || 432000) * 1000);
  await StoreSettingsModel.updateOne(
    { key: "default" },
    {
      $set: {
        "pathaoCourier.accessToken": issueData.access_token,
        "pathaoCourier.refreshToken": issueData.refresh_token || "",
        "pathaoCourier.tokenExpiresAt": expiresAt,
      },
    },
    { upsert: true }
  );

  return { accessToken: issueData.access_token, baseUrl: config.baseUrl };
}

/**
 * Generic authorized request to Pathao API
 */
async function pathaoRequest(endpoint, options = {}) {
  const { accessToken, baseUrl } = await getValidPathaoToken();
  const url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
    ...(options.headers || {}),
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg =
      data?.message ||
      data?.error_description ||
      data?.error ||
      (typeof data?.errors === "object" ? JSON.stringify(data.errors) : "") ||
      `Pathao API Error (${res.status})`;
    const error = new Error(errorMsg);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * Test Connection & authenticate
 */
export async function testPathaoConnection(credentials = {}) {
  const env = credentials.environment || "production";
  const baseUrl =
    credentials.baseUrl ||
    (env === "sandbox" ? "https://courier-api-sandbox.pathao.com" : "https://api-hermes.pathao.com");

  const response = await fetch(`${baseUrl}/aladdin/api/v1/issue-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      grant_type: "password",
      username: credentials.username,
      password: credentials.password,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) {
    const message = data?.message || data?.error_description || data?.error || "Invalid Pathao credentials.";
    return { success: false, message, data };
  }

  // If auth is successful, fetch stores list as a secondary check
  try {
    const storesRes = await fetch(`${baseUrl}/aladdin/api/v1/stores`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${data.access_token}`,
      },
    });
    const storesData = await storesRes.json().catch(() => ({}));
    return {
      success: true,
      message: "Successfully connected to Pathao Courier API!",
      tokenData: data,
      stores: storesData?.data?.data || [],
    };
  } catch (err) {
    return {
      success: true,
      message: "Connected to Pathao, but could not list stores.",
      tokenData: data,
      stores: [],
    };
  }
}

/**
 * Get merchant stores
 */
export async function getPathaoStores() {
  const result = await pathaoRequest("/aladdin/api/v1/stores", { method: "GET" });
  return result?.data?.data || result?.data || [];
}

/**
 * Create a new store
 */
export async function createPathaoStore(storeData) {
  const result = await pathaoRequest("/aladdin/api/v1/stores", {
    method: "POST",
    body: JSON.stringify(storeData),
  });
  return result?.data || result;
}

/**
 * Get cities list
 */
export async function getPathaoCities() {
  try {
    const result = await pathaoRequest("/aladdin/api/v1/city-list", { method: "GET" });
    return result?.data?.data || result?.data || [];
  } catch (e) {
    const fallback = await pathaoRequest("/aladdin/api/v1/countries/1/city-list", { method: "GET" });
    return fallback?.data?.data || fallback?.data || [];
  }
}

/**
 * Get zones in a city
 */
export async function getPathaoZones(cityId) {
  const result = await pathaoRequest(`/aladdin/api/v1/cities/${cityId}/zone-list`, { method: "GET" });
  return result?.data?.data || result?.data || [];
}

/**
 * Get areas in a zone
 */
export async function getPathaoAreas(zoneId) {
  const result = await pathaoRequest(`/aladdin/api/v1/zones/${zoneId}/area-list`, { method: "GET" });
  return result?.data?.data || result?.data || [];
}

/**
 * Calculate price plan for delivery
 */
export async function calculatePathaoPricePlan(payload) {
  const result = await pathaoRequest("/aladdin/api/v1/merchant/price-plan", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return result?.data || result;
}

/**
 * Create single order delivery consignment
 */
export async function createPathaoOrder(orderPayload) {
  const result = await pathaoRequest("/aladdin/api/v1/orders", {
    method: "POST",
    body: JSON.stringify(orderPayload),
  });
  return result?.data || result;
}

/**
 * Create bulk orders
 */
export async function createPathaoBulkOrders(ordersArray) {
  const result = await pathaoRequest("/aladdin/api/v1/orders/bulk", {
    method: "POST",
    body: JSON.stringify({ orders: ordersArray }),
  });
  return result?.data || result;
}

/**
 * Get order info / live tracking by consignment ID
 */
export async function getPathaoOrderInfo(consignmentId) {
  const cleanId = encodeURIComponent(String(consignmentId).trim());
  const result = await pathaoRequest(`/aladdin/api/v1/orders/${cleanId}/info`, {
    method: "GET",
  });
  return result?.data || result;
}
