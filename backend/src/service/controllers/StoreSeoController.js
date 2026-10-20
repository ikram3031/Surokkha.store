import { StoreSettingsModel } from "../../common/models/storeSettings.model.js";

// Store (surokkha.store) SEO settings: kept in their own document, separate from the shop's
export const STORE_SEO_KEY = "store-seo";

// Retrieves the store's SEO settings
export const getStoreSeoSettings = async (req, res, next) => {
  try {
    const doc = await StoreSettingsModel.findOne({ key: STORE_SEO_KEY }).lean();
    const dbSeo = doc?.seo || {};

    const data = {
      metaTitle: dbSeo.metaTitle || "Surokkha Store",
      metaDescription: dbSeo.metaDescription || "",
      keywords: Array.isArray(dbSeo.keywords) ? dbSeo.keywords : [],
      ogImage: dbSeo.ogImage || "",
      siteName: dbSeo.siteName || "Surokkha Store",
      twitterHandle: dbSeo.twitterHandle || "",
      canonicalBaseUrl: dbSeo.canonicalBaseUrl || "https://surokkha.store",
      robotsTxt: dbSeo.robotsTxt || "User-agent: *\nAllow: /\nDisallow: /dashboard/\nDisallow: /store/",
      gscVerificationCode: dbSeo.gscVerificationCode || "",
      isPersistedInDb: Boolean(doc?.seo?.metaTitle),
    };

    return res.json({ status: "success", data });
  } catch (error) {
    next(error);
  }
};

// Persists updated store SEO settings to database
export const updateStoreSeoSettings = async (req, res, next) => {
  try {
    const {
      metaTitle = "",
      metaDescription = "",
      keywords = [],
      ogImage = "",
      siteName = "",
      twitterHandle = "",
      canonicalBaseUrl = "",
      robotsTxt = "",
      gscVerificationCode = "",
    } = req.body || {};

    const cleanKeywords = Array.isArray(keywords)
      ? keywords.map((k) => String(k).trim()).filter(Boolean)
      : typeof keywords === "string"
      ? keywords.split(",").map((k) => k.trim()).filter(Boolean)
      : [];

    const updatedDoc = await StoreSettingsModel.findOneAndUpdate(
      { key: STORE_SEO_KEY },
      {
        $set: {
          "seo.metaTitle": String(metaTitle).trim(),
          "seo.metaDescription": String(metaDescription).trim(),
          "seo.keywords": cleanKeywords,
          "seo.ogImage": String(ogImage).trim(),
          "seo.siteName": String(siteName).trim(),
          "seo.twitterHandle": String(twitterHandle).trim(),
          "seo.canonicalBaseUrl": String(canonicalBaseUrl).trim(),
          "seo.robotsTxt": String(robotsTxt).trim(),
          "seo.gscVerificationCode": String(gscVerificationCode).trim(),
          updatedBy: req.user?.userId || null,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return res.json({
      status: "success",
      message: "Store SEO settings saved successfully.",
      data: updatedDoc.seo,
    });
  } catch (error) {
    next(error);
  }
};
