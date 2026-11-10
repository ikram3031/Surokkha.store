import { StoreSettingsModel } from "../models/storeSettings.model.js";
import { baseConfig, applyConfigOverrides } from "../config/index.js";
import { logger } from "../config/logger.js";

// Keys the code depends on structurally; they always come from config.json
export const LOCKED_KEYS = ["clientId", "clientKey", "routes", "assetsConfig"];

const REFRESH_INTERVAL_MS = 60 * 1000;
let refreshTimer = null;

const isPlainObject = (value) => value && typeof value === "object" && !Array.isArray(value);

const sameArray = (a, b) => a.length === b.length && a.every((item, i) => item === b[i]);

// Keeps only values that exist in config.json with the same type and differ from it
export const sanitizeOverrides = (input, base = baseConfig, isRoot = true) => {
  const result = {};
  if (!isPlainObject(input)) return result;

  for (const [key, value] of Object.entries(input)) {
    if (isRoot && LOCKED_KEYS.includes(key)) continue;
    if (!Object.prototype.hasOwnProperty.call(base || {}, key)) continue;
    const baseValue = base[key];

    if (isPlainObject(baseValue)) {
      const nested = sanitizeOverrides(value, baseValue, false);
      if (Object.keys(nested).length) result[key] = nested;
    } else if (Array.isArray(baseValue)) {
      if (!Array.isArray(value)) continue;
      const clean = value.filter((item) => ["string", "number", "boolean"].includes(typeof item));
      if (!sameArray(clean, baseValue)) result[key] = clean;
    } else if (typeof value === typeof baseValue && value !== baseValue) {
      result[key] = typeof value === "string" ? value.trim() : value;
    }
  }
  return result;
};

// Base config without the locked keys: what the Site Config page can edit
export const getEditableBaseConfig = () => {
  const editable = structuredClone(baseConfig);
  for (const key of LOCKED_KEYS) delete editable[key];
  return editable;
};

export const getSiteConfigOverrides = async () => {
  const doc = await StoreSettingsModel.findOne({ key: "default" }).select("siteConfig").lean();
  return sanitizeOverrides(doc?.siteConfig || {});
};

// Loads saved overrides into the running config
export const loadSiteConfigOverrides = async () => {
  try {
    applyConfigOverrides(await getSiteConfigOverrides());
  } catch (err) {
    logger.warn({ err: err.message }, "Site Config overrides could not be loaded; using config.json");
  }
};

export const saveSiteConfigOverrides = async (input, userId = null) => {
  const overrides = sanitizeOverrides(input);
  await StoreSettingsModel.findOneAndUpdate(
    { key: "default" },
    { $set: { siteConfig: overrides, updatedBy: userId } },
    { upsert: true, setDefaultsOnInsert: true }
  );
  applyConfigOverrides(overrides);
  return overrides;
};

// Each backend process (storefront, service) re-reads overrides so a save reaches all of them
export const startSiteConfigRefresh = () => {
  if (refreshTimer) return;
  refreshTimer = setInterval(loadSiteConfigOverrides, REFRESH_INTERVAL_MS);
  refreshTimer.unref?.();
};
