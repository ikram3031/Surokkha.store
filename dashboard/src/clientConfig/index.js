import decantreConfig from './01decantre/config.json';
import engulficConfig from './02engulfic/config.json';
import toyolandConfig from './03toyoland/config.json';
import kawaiikutirConfig from './04kawaiikutir/config.json';
import surokkhaConfig from './05surokkha/config.json';
import demoConfig from './00demo/config.json';
import activeSyncedConfig from './activeConfig.json';

const clientConfigs = {
  decantre: decantreConfig,
  engulfic: engulficConfig,
  toyoland: toyolandConfig,
  kawaiikutir: kawaiikutirConfig,
  surokkha: surokkhaConfig,
  demo: demoConfig,
};

// Detects active client key from current window location hostname
const getClientFromHostname = () => {
  if (typeof window === 'undefined') return null;
  const hostname = window.location.hostname.toLowerCase();
  if (hostname.includes('plexivia')) return 'demo';
  const matchedKey = Object.keys(clientConfigs).find((key) => hostname.includes(key));
  return matchedKey || null;
};

const envClient = import.meta.env?.VITE_CLIENT?.toLowerCase().trim();
const detectedClient = getClientFromHostname();
const activeKey = envClient || detectedClient || activeSyncedConfig?.clientKey || 'surokkha';

const baseConfig = clientConfigs[activeKey] || surokkhaConfig;
export const clientConfig = activeKey === activeSyncedConfig?.clientKey
  ? { ...baseConfig, ...activeSyncedConfig, cloudFlareAnalytics: activeSyncedConfig?.cloudFlareAnalytics || baseConfig?.cloudFlareAnalytics }
  : (clientConfigs[activeKey] || activeSyncedConfig || surokkhaConfig);

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
