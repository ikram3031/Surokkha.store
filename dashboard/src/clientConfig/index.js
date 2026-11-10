import surokkhaConfig from './05surokkha/config.json';
import activeSyncedConfig from './activeConfig.json';

const clientConfigs = {
  surokkha: surokkhaConfig,
};

// Detects active client key from current window location hostname
const getClientFromHostname = () => {
  if (typeof window === 'undefined') return null;
  const hostname = window.location.hostname.toLowerCase();
  if (hostname.includes('surokkha')) return 'surokkha';
  const matchedKey = Object.keys(clientConfigs).find((key) => hostname.includes(key));
  return matchedKey || null;
};

const envClient = import.meta.env?.VITE_CLIENT?.toLowerCase().trim();
const detectedClient = getClientFromHostname();
const activeKey = envClient || detectedClient || activeSyncedConfig?.clientKey || 'surokkha';

const baseConfig = clientConfigs[activeKey] || activeSyncedConfig || surokkhaConfig;
export const clientConfig = activeSyncedConfig?.clientKey
  ? { ...baseConfig, ...activeSyncedConfig, cloudFlareAnalytics: activeSyncedConfig?.cloudFlareAnalytics || baseConfig?.cloudFlareAnalytics }
  : (clientConfigs[activeKey] || activeSyncedConfig || surokkhaConfig);

const SITE_CONFIG_CACHE_KEY = 'site_config_overrides';
const isPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

// Deep merges plain objects; arrays and scalars from `override` replace `base`
const deepMerge = (base, override) => {
  const result = { ...base };
  for (const [key, value] of Object.entries(override || {})) {
    result[key] = isPlainObject(value) && isPlainObject(base?.[key]) ? deepMerge(base[key], value) : value;
  }
  return result;
};

// config.json as shipped; Site Config overrides from the dashboard are merged on top of it
export const baseClientConfig = structuredClone(clientConfig);

// Rebuilds `clientConfig` in place so every importer sees the overrides, and caches them for the next load
export const applyConfigOverrides = (overrides = {}) => {
  const safe = isPlainObject(overrides) ? overrides : {};
  const merged = structuredClone(deepMerge(baseClientConfig, safe));
  for (const key of Object.keys(clientConfig)) delete clientConfig[key];
  Object.assign(clientConfig, merged);
  try { localStorage.setItem(SITE_CONFIG_CACHE_KEY, JSON.stringify(safe)); } catch {}
};

// Applies the cached overrides at once so the first paint already uses them
try {
  const cached = JSON.parse(localStorage.getItem(SITE_CONFIG_CACHE_KEY) || 'null');
  if (isPlainObject(cached)) applyConfigOverrides(cached);
} catch {}

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
