import demoConfig from './00demo/config.json';
import activeSyncedConfig from './activeConfig.json';

const clientConfigs = {
  demo: demoConfig,
};

// Detects active client key from current window location hostname
const getClientFromHostname = () => {
  if (typeof window === 'undefined') return null;
  const hostname = window.location.hostname.toLowerCase();
  if (hostname.includes('example')) return 'demo';
  const matchedKey = Object.keys(clientConfigs).find((key) => hostname.includes(key));
  return matchedKey || null;
};

const envClient = import.meta.env?.VITE_CLIENT?.toLowerCase().trim();
const detectedClient = getClientFromHostname();
const activeKey = envClient || detectedClient || activeSyncedConfig?.clientKey || 'demo';

const baseConfig = clientConfigs[activeKey] || activeSyncedConfig || demoConfig;
const jsonConfig = activeSyncedConfig?.clientKey
  ? { ...baseConfig, ...activeSyncedConfig, cloudFlareAnalytics: activeSyncedConfig?.cloudFlareAnalytics || baseConfig?.cloudFlareAnalytics }
  : (clientConfigs[activeKey] || activeSyncedConfig || demoConfig);

// Client identity fields that must never leak from the template's demo brand
const IDENTITY_ENV_MAP = {
  clientId: 'VITE_CLIENT_ID',
  orderPrefix: 'VITE_ORDER_PREFIX',
  brandName: 'VITE_BRAND_NAME',
  domain: 'VITE_CLIENT_DOMAIN',
  supportEmail: 'VITE_SUPPORT_EMAIL',
  phone: 'VITE_CLIENT_PHONE',
  supportPhone: 'VITE_SUPPORT_PHONE',
  whatsappNumber: 'VITE_WHATSAPP_NUMBER',
  address: 'VITE_CLIENT_ADDRESS',
  logoUrl: 'VITE_LOGO_URL',
  apiBaseUrl: 'VITE_API_BASE_URL',
  dashboardUrl: 'VITE_DASHBOARD_URL',
  storefrontUrl: 'VITE_STOREFRONT_URL',
};

const isPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value);
const deepMerge = (base, override) => {
  const result = { ...base };
  for (const [key, value] of Object.entries(override || {})) {
    result[key] = isPlainObject(value) && isPlainObject(base?.[key]) ? deepMerge(base[key], value) : value;
  }
  return result;
};

const parseEnvJson = () => {
  const raw = import.meta.env?.VITE_CLIENT_CONFIG_JSON;
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error('Invalid JSON in VITE_CLIENT_CONFIG_JSON', error);
    return {};
  }
};

const buildClientConfig = () => {
  let result = { ...jsonConfig };
  // A real client never inherits the demo brand's identity from tracked JSON files
  if (activeKey !== 'demo' && result.clientKey !== activeKey) {
    for (const field of Object.keys(IDENTITY_ENV_MAP)) delete result[field];
    result.clientKey = activeKey;
  }
  // Precedence: tracked JSON < VITE_CLIENT_CONFIG_JSON (policies/features) < identity env vars
  result = deepMerge(result, parseEnvJson());
  for (const [field, envName] of Object.entries(IDENTITY_ENV_MAP)) {
    const value = import.meta.env?.[envName]?.trim();
    if (value) result[field] = value;
  }
  return result;
};

export const clientConfig = buildClientConfig();

// Helper to inspect active policy options safely
export const getPolicy = (policyPath, defaultValue = null) => {
  const parts = policyPath.split('.');
  let current = clientConfig.policies;
  for (const part of parts) {
    if (current === undefined || current === null) return defaultValue;
    current = current[part];
  }
  return current !== undefined ? current : defaultValue;
};

// Returns active client key string
export const getActiveClientKey = () => activeKey;

export default clientConfig;
