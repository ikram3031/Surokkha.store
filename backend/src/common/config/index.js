import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Reads and parses JSON file safely with fallback
const readJson = (fileNameOrPath) => {
  try {
    if (!fileNameOrPath) return {};
    let filePath = path.isAbsolute(fileNameOrPath)
      ? fileNameOrPath
      : path.resolve(__dirname, fileNameOrPath);
    // CLIENT_CONFIG_PATH may point at a configs directory (as docker-compose uses it)
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, "client.json");
    }
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
  } catch (error) {
    console.error(`Failed to load config: ${fileNameOrPath}`, error);
  }
  return {};
};

const isPlainObject = (value) => value && typeof value === "object" && !Array.isArray(value);

// Deep merges plain objects; arrays and scalars from `override` replace `base`
const deepMerge = (base, override) => {
  const result = { ...base };
  for (const [key, value] of Object.entries(override || {})) {
    result[key] = isPlainObject(value) && isPlainObject(base?.[key])
      ? deepMerge(base[key], value)
      : value;
  }
  return result;
};

const parseJsonEnv = (name) => {
  const raw = process.env[name];
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error(`Invalid JSON in ${name}`, error.message);
    return {};
  }
};

// Client identity fields that must never leak from the template's demo brand
const IDENTITY_ENV_MAP = {
  clientId: "CLIENT_ID",
  clientKey: "CLIENT_NAME",
  orderPrefix: "ORDER_PREFIX",
  brandName: "BRAND_NAME",
  domain: "CLIENT_DOMAIN",
  supportEmail: "SUPPORT_EMAIL",
  phone: "CLIENT_PHONE",
  supportPhone: "SUPPORT_PHONE",
  whatsappNumber: "WHATSAPP_NUMBER",
  address: "CLIENT_ADDRESS",
  logoUrl: "LOGO_URL",
  apiBaseUrl: "API_BASE_URL",
  dashboardUrl: "DASHBOARD_URL",
  storefrontUrl: "STOREFRONT_URL",
};

const identityFromEnv = () => {
  const identity = {};
  for (const [field, envName] of Object.entries(IDENTITY_ENV_MAP)) {
    const value = process.env[envName]?.trim();
    if (value) identity[field] = field === "clientKey" ? value.toLowerCase() : value;
  }
  return identity;
};

const coreConfig = readJson("config.core.json");
const allClients = readJson("allClients.json");
const activeClientConfig = readJson("activeClient.json");
const fallbackClientConfig = readJson("config.client.json");

const customConfigPath = process.env.CLIENT_CONFIG_PATH;
const customClientConfig = customConfigPath ? readJson(customConfigPath) : {};

const clientKey = (process.env.CLIENT_NAME || "").toLowerCase().trim();
const namedClientConfig = (clientKey && allClients[clientKey]) ? allClients[clientKey] : {};

let clientData = fallbackClientConfig;
if (Object.keys(customClientConfig).length > 0) {
  clientData = customClientConfig;
} else if (Object.keys(namedClientConfig).length > 0) {
  clientData = namedClientConfig;
} else if (Object.keys(activeClientConfig).length > 0) {
  clientData = activeClientConfig;
}

// A real client never inherits the demo brand's identity from tracked JSON files;
// identity comes from .env (or the client's own CLIENT_CONFIG_PATH file) only.
const isDemoClient = !clientKey || clientKey === "demo";
const baseCoreConfig = { ...coreConfig };
if (!isDemoClient) {
  for (const field of Object.keys(IDENTITY_ENV_MAP)) delete baseCoreConfig[field];
  if (clientData.clientKey !== clientKey) {
    clientData = { ...clientData };
    for (const field of Object.keys(IDENTITY_ENV_MAP)) delete clientData[field];
  }
}

// Precedence: tracked JSON < CLIENT_CONFIG_JSON (policies/features) < identity env vars
clientData = deepMerge(clientData, parseJsonEnv("CLIENT_CONFIG_JSON"));
clientData = { ...clientData, ...identityFromEnv() };

if (!isDemoClient && !clientData.brandName) {
  console.warn(`[config] CLIENT_NAME=${clientKey} but BRAND_NAME is not set in .env; invoices/emails will have no brand name.`);
}

export const config = {
  ...baseCoreConfig,
  ...clientData,
};

// Safely gets nested policy value from client config
export const getClientPolicy = (policyPath, defaultValue = null) => {
  const parts = policyPath.split(".");
  let current = config.policies;
  for (const part of parts) {
    if (current === undefined || current === null) return defaultValue;
    current = current[part];
  }
  return current !== undefined ? current : defaultValue;
};

export { getDynamicCorsConfig } from "./corsOrigins.js";
