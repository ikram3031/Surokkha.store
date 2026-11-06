import { StoreSettingsModel } from "../models/storeSettings.model.js";
import { AVAILABLE_COURIER_KEYS, DEFAULT_ENABLED_COURIERS } from "../config/couriers.js";

// Couriers the Owner has switched on (older settings docs without the field fall back to the default)
export const getEnabledCouriers = async () => {
  const doc = await StoreSettingsModel.findOne({ key: "default" }, { enabledCouriers: 1 }).lean();
  const list = Array.isArray(doc?.enabledCouriers) ? doc.enabledCouriers : DEFAULT_ENABLED_COURIERS;
  return list.filter((key) => AVAILABLE_COURIER_KEYS.includes(key));
};

export const isCourierEnabled = async (key) => (await getEnabledCouriers()).includes(key);

// Express guard: rejects courier API calls while that courier is switched off
export const requireCourierEnabled = (key) => async (req, res, next) => {
  try {
    if (await isCourierEnabled(key)) return next();
    return res.status(403).json({
      status: "error",
      code: "COURIER_DISABLED",
      message: `${key} courier is disabled. The Owner can enable it from Settings → Couriers.`,
    });
  } catch (error) {
    next(error);
  }
};
