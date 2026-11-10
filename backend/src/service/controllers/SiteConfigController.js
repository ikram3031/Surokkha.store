import {
  getEditableBaseConfig,
  getSiteConfigOverrides,
  saveSiteConfigOverrides,
} from "../../common/services/siteConfig.service.js";

// Site Config (Owner only): config.json values plus the ones changed from the dashboard
export const getSiteConfig = async (req, res, next) => {
  try {
    return res.json({
      status: "success",
      data: { base: getEditableBaseConfig(), overrides: await getSiteConfigOverrides() },
    });
  } catch (error) {
    next(error);
  }
};

// Saves the full edited config; only values that differ from config.json are stored
export const updateSiteConfig = async (req, res, next) => {
  try {
    const overrides = await saveSiteConfigOverrides(req.body?.config || {}, req.user?.userId || null);
    return res.json({
      status: "success",
      message: "Site config saved.",
      data: { base: getEditableBaseConfig(), overrides },
    });
  } catch (error) {
    next(error);
  }
};

// Public: the dashboard applies these overrides on load, before anyone signs in
export const getPublicSiteConfig = async (req, res, next) => {
  try {
    return res.json({ status: "success", data: { overrides: await getSiteConfigOverrides() } });
  } catch (error) {
    next(error);
  }
};
