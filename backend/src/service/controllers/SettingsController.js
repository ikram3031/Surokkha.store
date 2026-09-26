import { StoreSettingsModel } from "../../common/models/storeSettings.model.js";
import {
  getMetaPixelConfig,
  testMetaCapiConnection,
} from "../../common/services/facebookCapi.service.js";
import {
  getTikTokPixelConfig,
  testTikTokEventsApiConnection,
} from "../../common/services/tiktokEventsApi.service.js";
import { config as clientConfig } from "../../common/config/index.js";

// Retrieves full Meta Pixel and Conversions API settings for Dashboard administration
export const getMetaPixelSettings = async (req, res, next) => {
  try {
    const config = await getMetaPixelConfig();
    const doc = await StoreSettingsModel.findOne({ key: "default" }).lean();

    return res.json({
      status: "success",
      data: {
        ...config,
        isPersistedInDb: Boolean(doc?.metaPixel?.pixelId),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Persists updated Meta Pixel and Conversions API settings to database
export const updateMetaPixelSettings = async (req, res, next) => {
  try {
    const {
      pixelId = "",
      accessToken = "",
      testEventCode = "",
      isEnabled = true,
      enableBrowserPixel = true,
      enableCapi = true,
      advancedMatching = true,
    } = req.body || {};

    const cleanPixelId = String(pixelId).trim();
    const cleanAccessToken = String(accessToken).trim();
    const cleanTestEventCode = String(testEventCode).trim();

    const updatePayload = {
      "metaPixel.pixelId": cleanPixelId,
      "metaPixel.accessToken": cleanAccessToken,
      "metaPixel.testEventCode": cleanTestEventCode,
      "metaPixel.isEnabled": Boolean(isEnabled),
      "metaPixel.enableBrowserPixel": Boolean(enableBrowserPixel),
      "metaPixel.enableCapi": Boolean(enableCapi),
      "metaPixel.advancedMatching": Boolean(advancedMatching),
      updatedBy: req.user?.userId || null,
    };

    const updatedDoc = await StoreSettingsModel.findOneAndUpdate(
      { key: "default" },
      { $set: updatePayload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return res.json({
      status: "success",
      message: "Meta Pixel settings saved successfully.",
      data: updatedDoc.metaPixel,
    });
  } catch (error) {
    next(error);
  }
};

// Executes a live test event against Meta Graph API and updates verification status
export const testMetaPixelConnection = async (req, res, next) => {
  try {
    const currentConfig = await getMetaPixelConfig();
    const targetPixelId = (req.body?.pixelId || currentConfig.pixelId || "").trim();
    const targetAccessToken = (req.body?.accessToken || currentConfig.accessToken || "").trim();
    const targetTestEventCode = (req.body?.testEventCode ?? currentConfig.testEventCode ?? "").trim();

    if (!targetPixelId || !targetAccessToken) {
      return res.status(400).json({
        status: "error",
        message: "Both Pixel ID and Conversions API Access Token must be provided to test the connection.",
      });
    }

    const testResult = await testMetaCapiConnection({
      pixelId: targetPixelId,
      accessToken: targetAccessToken,
      testEventCode: targetTestEventCode,
    });

    const isSuccess = testResult.success === true;
    const now = new Date();
    const statusVal = isSuccess ? "connected" : "failed";
    const statusMsg = testResult.message || (isSuccess ? "Connected" : "Test failed");

    await StoreSettingsModel.updateOne(
      { key: "default" },
      {
        $set: {
          "metaPixel.lastVerifiedAt": isSuccess ? now : currentConfig.lastVerifiedAt,
          "metaPixel.lastTestStatus": statusVal,
          "metaPixel.lastTestMessage": statusMsg,
        },
      },
      { upsert: true }
    );

    if (!isSuccess) {
      return res.status(testResult.status >= 400 && testResult.status < 600 ? testResult.status : 400).json({
        status: "error",
        message: testResult.message,
        details: testResult.raw || null,
      });
    }

    return res.json({
      status: "success",
      message: testResult.message,
      data: {
        eventsReceived: testResult.eventsReceived,
        fbtraceId: testResult.fbtraceId,
        verifiedAt: now,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Returns public sanitized Meta Pixel configuration for customer storefront integration
export const getPublicMetaPixelConfig = async (req, res, next) => {
  try {
    const config = await getMetaPixelConfig();

    return res.json({
      status: "success",
      data: {
        pixelId: config.isEnabled ? config.pixelId : "",
        isEnabled: config.isEnabled,
        enableBrowserPixel: config.enableBrowserPixel,
        advancedMatching: config.advancedMatching,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Retrieves full TikTok Pixel and Events API settings for Dashboard administration
export const getTikTokPixelSettings = async (req, res, next) => {
  try {
    const config = await getTikTokPixelConfig();
    const doc = await StoreSettingsModel.findOne({ key: "default" }).lean();

    return res.json({
      status: "success",
      data: {
        ...config,
        isPersistedInDb: Boolean(doc?.tiktokPixel?.pixelId),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Persists updated TikTok Pixel and Events API settings to database
export const updateTikTokPixelSettings = async (req, res, next) => {
  try {
    const {
      pixelId = "",
      accessToken = "",
      testEventCode = "",
      isEnabled = true,
      enableBrowserPixel = true,
      enableEventsApi = true,
      advancedMatching = true,
    } = req.body || {};

    const cleanPixelId = String(pixelId).trim();
    const cleanAccessToken = String(accessToken).trim();
    const cleanTestEventCode = String(testEventCode).trim();

    const updatePayload = {
      "tiktokPixel.pixelId": cleanPixelId,
      "tiktokPixel.accessToken": cleanAccessToken,
      "tiktokPixel.testEventCode": cleanTestEventCode,
      "tiktokPixel.isEnabled": Boolean(isEnabled),
      "tiktokPixel.enableBrowserPixel": Boolean(enableBrowserPixel),
      "tiktokPixel.enableEventsApi": Boolean(enableEventsApi),
      "tiktokPixel.advancedMatching": Boolean(advancedMatching),
      updatedBy: req.user?.userId || null,
    };

    const updatedDoc = await StoreSettingsModel.findOneAndUpdate(
      { key: "default" },
      { $set: updatePayload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return res.json({
      status: "success",
      message: "TikTok Pixel settings saved successfully.",
      data: updatedDoc.tiktokPixel,
    });
  } catch (error) {
    next(error);
  }
};

// Executes a live test event against TikTok Events API and updates verification status
export const testTikTokPixelConnection = async (req, res, next) => {
  try {
    const currentConfig = await getTikTokPixelConfig();
    const targetPixelId = (req.body?.pixelId || currentConfig.pixelId || "").trim();
    const targetAccessToken = (req.body?.accessToken || currentConfig.accessToken || "").trim();
    const targetTestEventCode = (req.body?.testEventCode ?? currentConfig.testEventCode ?? "").trim();

    if (!targetPixelId || !targetAccessToken) {
      return res.status(400).json({
        status: "error",
        message: "Both Pixel ID and Events API Access Token must be provided to test the connection.",
      });
    }

    const testResult = await testTikTokEventsApiConnection({
      pixelId: targetPixelId,
      accessToken: targetAccessToken,
      testEventCode: targetTestEventCode,
    });

    const isSuccess = testResult.success === true;
    const now = new Date();
    const statusVal = isSuccess ? "connected" : "failed";
    const statusMsg = testResult.message || (isSuccess ? "Connected" : "Test failed");

    await StoreSettingsModel.updateOne(
      { key: "default" },
      {
        $set: {
          "tiktokPixel.lastVerifiedAt": isSuccess ? now : currentConfig.lastVerifiedAt,
          "tiktokPixel.lastTestStatus": statusVal,
          "tiktokPixel.lastTestMessage": statusMsg,
        },
      },
      { upsert: true }
    );

    if (!isSuccess) {
      return res.status(testResult.status >= 400 && testResult.status < 600 ? testResult.status : 400).json({
        status: "error",
        message: testResult.message,
        details: testResult.raw || null,
      });
    }

    return res.json({
      status: "success",
      message: testResult.message,
      data: {
        requestId: testResult.requestId,
        verifiedAt: now,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Returns public sanitized TikTok Pixel configuration for customer storefront integration
export const getPublicTikTokPixelConfig = async (req, res, next) => {
  try {
    const config = await getTikTokPixelConfig();

    return res.json({
      status: "success",
      data: {
        pixelId: config.isEnabled ? config.pixelId : "",
        isEnabled: config.isEnabled,
        enableBrowserPixel: config.enableBrowserPixel,
        advancedMatching: config.advancedMatching,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Retrieves Google Analytics settings from database with fallback to tenant client configuration
export const getGoogleAnalyticsSettings = async (req, res, next) => {
  try {
    const doc = await StoreSettingsModel.findOne({ key: "default" }).lean();
    const dbGa = doc?.googleAnalytics || {};
    const fallbackGa = clientConfig?.googleAnalytics || {};

    const data = {
      measurementId: dbGa.measurementId || fallbackGa.measurementId || "",
      gtmId: dbGa.gtmId || fallbackGa.gtmId || "",
      propertyId: dbGa.propertyId || fallbackGa.propertyId || "",
      streamName: dbGa.streamName || fallbackGa.streamName || "",
      lookerStudioEmbedUrl: dbGa.lookerStudioEmbedUrl || fallbackGa.lookerStudioEmbedUrl || "",
      isEnabled: dbGa.isEnabled ?? true,
      enhancedMeasurement: dbGa.enhancedMeasurement ?? fallbackGa.enhancedMeasurement ?? true,
      lastVerifiedAt: dbGa.lastVerifiedAt || null,
      isPersistedInDb: Boolean(doc?.googleAnalytics?.measurementId),
    };

    return res.json({
      status: "success",
      data,
    });
  } catch (error) {
    next(error);
  }
};

// Persists updated Google Analytics settings to database
export const updateGoogleAnalyticsSettings = async (req, res, next) => {
  try {
    const {
      measurementId = "",
      gtmId = "",
      propertyId = "",
      streamName = "",
      lookerStudioEmbedUrl = "",
      isEnabled = true,
      enhancedMeasurement = true,
    } = req.body || {};

    const cleanMeasurementId = String(measurementId).trim();
    const cleanGtmId = String(gtmId).trim();
    const cleanPropertyId = String(propertyId).trim();
    const cleanStreamName = String(streamName).trim();
    const cleanLookerStudioEmbedUrl = String(lookerStudioEmbedUrl).trim();

    const updatePayload = {
      "googleAnalytics.measurementId": cleanMeasurementId,
      "googleAnalytics.gtmId": cleanGtmId,
      "googleAnalytics.propertyId": cleanPropertyId,
      "googleAnalytics.streamName": cleanStreamName,
      "googleAnalytics.lookerStudioEmbedUrl": cleanLookerStudioEmbedUrl,
      "googleAnalytics.isEnabled": Boolean(isEnabled),
      "googleAnalytics.enhancedMeasurement": Boolean(enhancedMeasurement),
      "googleAnalytics.lastVerifiedAt": cleanMeasurementId ? new Date() : null,
      updatedBy: req.user?.userId || null,
    };

    const updatedDoc = await StoreSettingsModel.findOneAndUpdate(
      { key: "default" },
      { $set: updatePayload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return res.json({
      status: "success",
      message: "Google Analytics settings saved successfully.",
      data: updatedDoc.googleAnalytics,
    });
  } catch (error) {
    next(error);
  }
};

// Retrieves SEO settings from database with fallback to tenant client configuration
export const getSeoSettings = async (req, res, next) => {
  try {
    const doc = await StoreSettingsModel.findOne({ key: "default" }).lean();
    const dbSeo = doc?.seo || {};

    const data = {
      metaTitle: dbSeo.metaTitle || clientConfig?.brandName || "",
      metaDescription: dbSeo.metaDescription || "",
      keywords: Array.isArray(dbSeo.keywords) ? dbSeo.keywords : [],
      ogImage: dbSeo.ogImage || clientConfig?.logoUrl || "",
      siteName: dbSeo.siteName || clientConfig?.brandName || "",
      twitterHandle: dbSeo.twitterHandle || "",
      canonicalBaseUrl: dbSeo.canonicalBaseUrl || (clientConfig?.domain ? `https://${clientConfig.domain}` : ""),
      robotsTxt: dbSeo.robotsTxt || "User-agent: *\nAllow: /\nDisallow: /dashboard/\nDisallow: /api/",
      gscVerificationCode: dbSeo.gscVerificationCode || "",
      isPersistedInDb: Boolean(doc?.seo?.metaTitle),
    };

    return res.json({
      status: "success",
      data,
    });
  } catch (error) {
    next(error);
  }
};

// Persists updated SEO settings to database
export const updateSeoSettings = async (req, res, next) => {
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

    const updatePayload = {
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
    };

    const updatedDoc = await StoreSettingsModel.findOneAndUpdate(
      { key: "default" },
      { $set: updatePayload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return res.json({
      status: "success",
      message: "SEO settings saved successfully.",
      data: updatedDoc.seo,
    });
  } catch (error) {
    next(error);
  }
};
