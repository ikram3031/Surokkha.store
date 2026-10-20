import { StoreSettingsModel } from "../../common/models/storeSettings.model.js";
import {
  STORE_META_PIXEL_KEY,
  getStoreMetaPixelConfig,
  testMetaCapiConnection,
} from "../../common/services/facebookCapi.service.js";

// Store (surokkha.store) Meta Pixel settings: kept in their own document, separate from the shop's

// Retrieves the store's Meta Pixel and Conversions API settings
export const getStoreMetaPixelSettings = async (req, res, next) => {
  try {
    const config = await getStoreMetaPixelConfig();
    const doc = await StoreSettingsModel.findOne({ key: STORE_META_PIXEL_KEY }).lean();
    return res.json({
      status: "success",
      data: { ...config, isPersistedInDb: Boolean(doc?.metaPixel?.pixelId) },
    });
  } catch (error) {
    next(error);
  }
};

// Saves the store's Meta Pixel and Conversions API settings
export const updateStoreMetaPixelSettings = async (req, res, next) => {
  try {
    const meta = req.body || {};
    const updatedDoc = await StoreSettingsModel.findOneAndUpdate(
      { key: STORE_META_PIXEL_KEY },
      {
        $set: {
          updatedBy: req.user?.userId || null,
          "metaPixel.pixelId": String(meta.pixelId || "").trim(),
          "metaPixel.accessToken": String(meta.accessToken || "").trim(),
          "metaPixel.testEventCode": String(meta.testEventCode || "").trim(),
          "metaPixel.isEnabled": Boolean(meta.isEnabled ?? true),
          "metaPixel.enableBrowserPixel": Boolean(meta.enableBrowserPixel ?? true),
          "metaPixel.enableCapi": Boolean(meta.enableCapi ?? true),
          "metaPixel.advancedMatching": Boolean(meta.advancedMatching ?? true),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return res.json({
      status: "success",
      message: "Store Meta Pixel settings saved successfully.",
      data: updatedDoc.metaPixel,
    });
  } catch (error) {
    next(error);
  }
};

// Sends a live test event to the store's pixel and records the result
export const testStoreMetaPixelConnection = async (req, res, next) => {
  try {
    const current = await getStoreMetaPixelConfig();
    const pixelId = (req.body?.pixelId || current.pixelId || "").trim();
    const accessToken = (req.body?.accessToken || current.accessToken || "").trim();
    const testEventCode = (req.body?.testEventCode ?? current.testEventCode ?? "").trim();
    const fbLoginId = (req.body?.fbLoginId || req.body?.fb_login_id || "").trim();

    if (!pixelId || !accessToken) {
      return res.status(400).json({
        status: "error",
        message: "Both Pixel ID and Conversions API Access Token must be provided to test the connection.",
      });
    }

    const testResult = await testMetaCapiConnection({ pixelId, accessToken, testEventCode, fbLoginId });
    const isSuccess = testResult.success === true;
    const now = new Date();

    await StoreSettingsModel.updateOne(
      { key: STORE_META_PIXEL_KEY },
      {
        $set: {
          "metaPixel.lastVerifiedAt": isSuccess ? now : current.lastVerifiedAt,
          "metaPixel.lastTestStatus": isSuccess ? "connected" : "failed",
          "metaPixel.lastTestMessage": testResult.message || (isSuccess ? "Connected" : "Test failed"),
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
      data: { eventsReceived: testResult.eventsReceived, fbtraceId: testResult.fbtraceId, verifiedAt: now },
    });
  } catch (error) {
    next(error);
  }
};

// Public sanitized store pixel config for the store's storefront
export const getStorePublicMetaPixelConfig = async (req, res, next) => {
  try {
    const config = await getStoreMetaPixelConfig();
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
