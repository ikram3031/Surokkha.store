import mongoose from "mongoose";
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
import nodemailer from "nodemailer";
import { encryptText, decryptText } from "../../common/utils/crypto.util.js";

// Retrieves full Meta Pixel and Conversions API settings for Dashboard administration
export const getMetaPixelSettings = async (req, res, next) => {
  try {
    const storeConfig = await getMetaPixelConfig("store");
    const shopConfig = await getMetaPixelConfig("shop");
    const defaultConfig = await getMetaPixelConfig();
    let doc = null;
    if (mongoose.connection?.readyState === 1) {
      doc = await StoreSettingsModel.findOne({ key: "default" }).lean().catch(() => null);
    }

    return res.json({
      status: "success",
      data: {
        ...defaultConfig,
        isPersistedInDb: Boolean(doc?.metaPixel?.pixelId || doc?.sites?.store?.metaPixel?.pixelId),
        sites: {
          store: {
            siteKey: "store",
            domain: "surokkha.store",
            brandName: "Surokkha Store",
            orderPrefix: "SST",
            ...storeConfig,
            isPersistedInDb: Boolean(doc?.sites?.store?.metaPixel?.pixelId || doc?.metaPixel?.pixelId),
          },
          shop: {
            siteKey: "shop",
            domain: "surokkha.shop",
            brandName: "Surokkha Shop",
            orderPrefix: "SSH",
            ...shopConfig,
            isPersistedInDb: Boolean(doc?.sites?.shop?.metaPixel?.pixelId),
          },
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Persists updated Meta Pixel and Conversions API settings to database
export const updateMetaPixelSettings = async (req, res, next) => {
  try {
    const body = req.body || {};
    const siteKey = String(body.siteKey || "").toLowerCase().trim();
    const updatePayload = {
      updatedBy: req.user?.userId || null,
    };

    // 1. If payload provides structured multi-site definitions
    if (body.sites && typeof body.sites === "object") {
      if (body.sites.store) {
        const s = body.sites.store;
        const meta = s.metaPixel || s;
        updatePayload["sites.store.siteKey"] = "store";
        updatePayload["sites.store.domain"] = "surokkha.store";
        updatePayload["sites.store.brandName"] = "Surokkha Store";
        updatePayload["sites.store.orderPrefix"] = "SST";
        updatePayload["sites.store.metaPixel.pixelId"] = String(meta.pixelId || "").trim();
        updatePayload["sites.store.metaPixel.accessToken"] = String(meta.accessToken || "").trim();
        updatePayload["sites.store.metaPixel.testEventCode"] = String(meta.testEventCode || "").trim();
        updatePayload["sites.store.metaPixel.isEnabled"] = Boolean(meta.isEnabled ?? true);
        updatePayload["sites.store.metaPixel.enableBrowserPixel"] = Boolean(meta.enableBrowserPixel ?? true);
        updatePayload["sites.store.metaPixel.enableCapi"] = Boolean(meta.enableCapi ?? true);
        updatePayload["sites.store.metaPixel.advancedMatching"] = Boolean(meta.advancedMatching ?? true);

        // Also sync top-level metaPixel for backward compatibility
        updatePayload["metaPixel.pixelId"] = String(meta.pixelId || "").trim();
        updatePayload["metaPixel.accessToken"] = String(meta.accessToken || "").trim();
        updatePayload["metaPixel.testEventCode"] = String(meta.testEventCode || "").trim();
        updatePayload["metaPixel.isEnabled"] = Boolean(meta.isEnabled ?? true);
        updatePayload["metaPixel.enableBrowserPixel"] = Boolean(meta.enableBrowserPixel ?? true);
        updatePayload["metaPixel.enableCapi"] = Boolean(meta.enableCapi ?? true);
        updatePayload["metaPixel.advancedMatching"] = Boolean(meta.advancedMatching ?? true);
      }

      if (body.sites.shop) {
        const sh = body.sites.shop;
        const meta = sh.metaPixel || sh;
        updatePayload["sites.shop.siteKey"] = "shop";
        updatePayload["sites.shop.domain"] = "surokkha.shop";
        updatePayload["sites.shop.brandName"] = "Surokkha Shop";
        updatePayload["sites.shop.orderPrefix"] = "SSH";
        updatePayload["sites.shop.metaPixel.pixelId"] = String(meta.pixelId || "").trim();
        updatePayload["sites.shop.metaPixel.accessToken"] = String(meta.accessToken || "").trim();
        updatePayload["sites.shop.metaPixel.testEventCode"] = String(meta.testEventCode || "").trim();
        updatePayload["sites.shop.metaPixel.isEnabled"] = Boolean(meta.isEnabled ?? true);
        updatePayload["sites.shop.metaPixel.enableBrowserPixel"] = Boolean(meta.enableBrowserPixel ?? true);
        updatePayload["sites.shop.metaPixel.enableCapi"] = Boolean(meta.enableCapi ?? true);
        updatePayload["sites.shop.metaPixel.advancedMatching"] = Boolean(meta.advancedMatching ?? true);
      }
    } else if (siteKey === "shop") {
      // Single shop site update
      updatePayload["sites.shop.siteKey"] = "shop";
      updatePayload["sites.shop.domain"] = "surokkha.shop";
      updatePayload["sites.shop.brandName"] = "Surokkha Shop";
      updatePayload["sites.shop.orderPrefix"] = "SSH";
      updatePayload["sites.shop.metaPixel.pixelId"] = String(body.pixelId || "").trim();
      updatePayload["sites.shop.metaPixel.accessToken"] = String(body.accessToken || "").trim();
      updatePayload["sites.shop.metaPixel.testEventCode"] = String(body.testEventCode || "").trim();
      updatePayload["sites.shop.metaPixel.isEnabled"] = Boolean(body.isEnabled ?? true);
      updatePayload["sites.shop.metaPixel.enableBrowserPixel"] = Boolean(body.enableBrowserPixel ?? true);
      updatePayload["sites.shop.metaPixel.enableCapi"] = Boolean(body.enableCapi ?? true);
      updatePayload["sites.shop.metaPixel.advancedMatching"] = Boolean(body.advancedMatching ?? true);
    } else {
      // Store / default update
      const cleanPixelId = String(body.pixelId || "").trim();
      const cleanAccessToken = String(body.accessToken || "").trim();
      const cleanTestEventCode = String(body.testEventCode || "").trim();

      updatePayload["metaPixel.pixelId"] = cleanPixelId;
      updatePayload["metaPixel.accessToken"] = cleanAccessToken;
      updatePayload["metaPixel.testEventCode"] = cleanTestEventCode;
      updatePayload["metaPixel.isEnabled"] = Boolean(body.isEnabled ?? true);
      updatePayload["metaPixel.enableBrowserPixel"] = Boolean(body.enableBrowserPixel ?? true);
      updatePayload["metaPixel.enableCapi"] = Boolean(body.enableCapi ?? true);
      updatePayload["metaPixel.advancedMatching"] = Boolean(body.advancedMatching ?? true);

      updatePayload["sites.store.siteKey"] = "store";
      updatePayload["sites.store.domain"] = "surokkha.store";
      updatePayload["sites.store.brandName"] = "Surokkha Store";
      updatePayload["sites.store.orderPrefix"] = "SST";
      updatePayload["sites.store.metaPixel.pixelId"] = cleanPixelId;
      updatePayload["sites.store.metaPixel.accessToken"] = cleanAccessToken;
      updatePayload["sites.store.metaPixel.testEventCode"] = cleanTestEventCode;
      updatePayload["sites.store.metaPixel.isEnabled"] = Boolean(body.isEnabled ?? true);
      updatePayload["sites.store.metaPixel.enableBrowserPixel"] = Boolean(body.enableBrowserPixel ?? true);
      updatePayload["sites.store.metaPixel.enableCapi"] = Boolean(body.enableCapi ?? true);
      updatePayload["sites.store.metaPixel.advancedMatching"] = Boolean(body.advancedMatching ?? true);
    }

    const updatedDoc = await StoreSettingsModel.findOneAndUpdate(
      { key: "default" },
      { $set: updatePayload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return res.json({
      status: "success",
      message: "Meta Pixel settings saved successfully.",
      data: updatedDoc.sites || updatedDoc.metaPixel,
    });
  } catch (error) {
    next(error);
  }
};

// Executes a live test event against Meta Graph API and updates verification status
export const testMetaPixelConnection = async (req, res, next) => {
  try {
    const siteKey = String(req.body?.siteKey || "").toLowerCase().trim();
    const currentConfig = await getMetaPixelConfig(siteKey || req);
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

    const statusUpdates = {
      "metaPixel.lastVerifiedAt": isSuccess ? now : currentConfig.lastVerifiedAt,
      "metaPixel.lastTestStatus": statusVal,
      "metaPixel.lastTestMessage": statusMsg,
    };

    if (siteKey === "shop") {
      statusUpdates["sites.shop.metaPixel.lastVerifiedAt"] = isSuccess ? now : currentConfig.lastVerifiedAt;
      statusUpdates["sites.shop.metaPixel.lastTestStatus"] = statusVal;
      statusUpdates["sites.shop.metaPixel.lastTestMessage"] = statusMsg;
    } else {
      statusUpdates["sites.store.metaPixel.lastVerifiedAt"] = isSuccess ? now : currentConfig.lastVerifiedAt;
      statusUpdates["sites.store.metaPixel.lastTestStatus"] = statusVal;
      statusUpdates["sites.store.metaPixel.lastTestMessage"] = statusMsg;
    }

    await StoreSettingsModel.updateOne(
      { key: "default" },
      { $set: statusUpdates },
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
    const siteKey = req.query?.site || req.headers?.host || null;
    const config = await getMetaPixelConfig(siteKey);

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

// Retrieves SMTP settings from database
export const getSmtpSettings = async (req, res, next) => {
  try {
    const doc = await StoreSettingsModel.findOne({ key: "default" }).lean();
    const dbSmtp = doc?.smtp || {};

    const data = {
      host: dbSmtp.host || "",
      port: dbSmtp.port || 465,
      secure: dbSmtp.secure ?? true,
      user: dbSmtp.user || "",
      password: decryptText(dbSmtp.password || ""),
      senderName: dbSmtp.senderName || "",
      senderEmail: dbSmtp.senderEmail || "",
      isEnabled: dbSmtp.isEnabled ?? false,
      isPersistedInDb: Boolean(doc?.smtp?.host),
    };

    return res.json({
      status: "success",
      data,
    });
  } catch (error) {
    next(error);
  }
};

// Persists updated SMTP settings to database
export const updateSmtpSettings = async (req, res, next) => {
  try {
    const {
      host = "",
      port = 465,
      secure = true,
      user = "",
      password = "",
      senderName = "",
      senderEmail = "",
      isEnabled = false,
    } = req.body || {};

    const updatePayload = {
      "smtp.host": String(host).trim(),
      "smtp.port": Number(port),
      "smtp.secure": Boolean(secure),
      "smtp.user": String(user).trim(),
      "smtp.password": password ? encryptText(String(password).trim()) : "",
      "smtp.senderName": String(senderName).trim(),
      "smtp.senderEmail": String(senderEmail).trim(),
      "smtp.isEnabled": Boolean(isEnabled),
      updatedBy: req.user?.userId || null,
    };

    const updatedDoc = await StoreSettingsModel.findOneAndUpdate(
      { key: "default" },
      { $set: updatePayload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return res.json({
      status: "success",
      message: "SMTP settings saved successfully.",
      data: {
        ...updatedDoc.smtp,
        password: decryptText(updatedDoc.smtp.password || ""),
      }
    });
  } catch (error) {
    next(error);
  }
};

// Executes a live test connection for SMTP
export const testSmtpConnection = async (req, res, next) => {
  try {
    const doc = await StoreSettingsModel.findOne({ key: "default" }).lean();
    const currentConfig = doc?.smtp || {};

    const targetHost = (req.body?.host || currentConfig.host || "").trim();
    const targetPort = Number(req.body?.port || currentConfig.port || 465);
    const targetSecure = req.body?.secure !== undefined ? Boolean(req.body.secure) : (currentConfig.secure ?? true);
    const targetUser = (req.body?.user || currentConfig.user || "").trim();
    const targetPassword = (req.body?.password || decryptText(currentConfig.password || "")).trim();

    if (!targetHost || !targetUser || !targetPassword) {
      return res.status(400).json({
        status: "error",
        message: "Host, user, and password are required to test the connection.",
      });
    }

    const transporter = nodemailer.createTransport({
      host: targetHost,
      port: targetPort,
      secure: targetSecure,
      auth: {
        user: targetUser,
        pass: targetPassword,
      },
    });

    const senderName = (req.body?.senderName || currentConfig.senderName || "Surokkha").trim();
    const senderEmail = (req.body?.senderEmail || currentConfig.senderEmail || targetUser).trim();
    const recipientEmail = (req.body?.recipientEmail || req.body?.to || "").trim();

    try {
      await transporter.verify();

      let emailSent = false;
      if (recipientEmail) {
        const fromAddress = `"${senderName}" <${senderEmail}>`;
        await transporter.sendMail({
          from: fromAddress,
          to: recipientEmail,
          subject: `Test Email from ${senderName}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px;">
              <h2 style="color: #4f46e5; margin-top: 0;">SMTP Test Email</h2>
              <p>Congratulations! Your SMTP email server connection has been successfully verified.</p>
              <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #4f46e5;">
                <p style="margin: 0;"><strong>Sender:</strong> ${fromAddress}</p>
                <p style="margin: 5px 0 0 0;"><strong>Recipient:</strong> ${recipientEmail}</p>
                <p style="margin: 5px 0 0 0;"><strong>Server:</strong> ${targetHost}:${targetPort}</p>
              </div>
              <p style="color: #6b7280; font-size: 13px; margin-bottom: 0;">This is an automated test message sent from your Store Admin Dashboard.</p>
            </div>
          `,
        });
        emailSent = true;
      }

      return res.json({
        status: "success",
        message: emailSent
          ? `SMTP connection verified and test email sent to ${recipientEmail}!`
          : "SMTP connection verified successfully.",
        emailSent,
      });
    } catch (err) {
      return res.status(400).json({
        status: "error",
        message: err.message || "Failed to verify SMTP connection.",
        details: err,
      });
    }
  } catch (error) {
    next(error);
  }
};

// Retrieves IMAP settings from database
export const getImapSettings = async (req, res, next) => {
  try {
    const doc = await StoreSettingsModel.findOne({ key: "default" }).lean();
    const dbImap = doc?.imap || {};

    const data = {
      host: dbImap.host || "",
      port: dbImap.port || 993,
      secure: dbImap.secure ?? true,
      user: dbImap.user || "",
      password: decryptText(dbImap.password || ""),
      isEnabled: dbImap.isEnabled ?? false,
      isPersistedInDb: Boolean(doc?.imap?.host),
    };

    return res.json({
      status: "success",
      data,
    });
  } catch (error) {
    next(error);
  }
};

// Persists updated IMAP settings to database
export const updateImapSettings = async (req, res, next) => {
  try {
    const {
      host = "",
      port = 993,
      secure = true,
      user = "",
      password = "",
      isEnabled = false,
    } = req.body || {};

    const updatePayload = {
      "imap.host": String(host).trim(),
      "imap.port": Number(port),
      "imap.secure": Boolean(secure),
      "imap.user": String(user).trim(),
      "imap.password": password ? encryptText(String(password).trim()) : "",
      "imap.isEnabled": Boolean(isEnabled),
      updatedBy: req.user?.userId || null,
    };

    const updatedDoc = await StoreSettingsModel.findOneAndUpdate(
      { key: "default" },
      { $set: updatePayload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return res.json({
      status: "success",
      message: "IMAP settings saved successfully.",
      data: {
        ...updatedDoc.imap,
        password: decryptText(updatedDoc.imap.password || ""),
      }
    });
  } catch (error) {
    next(error);
  }
};

// Retrieves Cloudflare settings from database with fallback to tenant client config
export const getCloudflareSettings = async (req, res, next) => {
  try {
    const doc = await StoreSettingsModel.findOne({ key: "default" }).lean();
    const dbCf = doc?.cloudflare || {};
    const clientCf = clientConfig?.cloudflare || {};

    const rawToken = dbCf.apiToken || clientCf.apiToken || process.env.CLOUDFLARE_API_TOKEN || "";
    const decryptedToken = decryptText(rawToken);

    const data = {
      apiToken: decryptedToken,
      zoneId: dbCf.zoneId || clientCf.zoneId || "",
      accountEmail: dbCf.accountEmail || clientCf.accountEmail || "",
      isEnabled: dbCf.isEnabled ?? clientCf.isEnabled ?? true,
      lastPurgedAt: dbCf.lastPurgedAt || null,
      isPersistedInDb: Boolean(doc?.cloudflare?.apiToken || doc?.cloudflare?.zoneId),
    };

    return res.json({
      status: "success",
      data,
    });
  } catch (error) {
    next(error);
  }
};

// Persists updated Cloudflare settings to database with AES encryption
export const updateCloudflareSettings = async (req, res, next) => {
  try {
    const {
      apiToken = "",
      zoneId = "",
      accountEmail = "",
      isEnabled = true,
    } = req.body || {};

    const cleanApiToken = String(apiToken).trim();
    const cleanZoneId = String(zoneId).trim();
    const cleanAccountEmail = String(accountEmail).trim();

    const updatePayload = {
      "cloudflare.apiToken": cleanApiToken ? encryptText(cleanApiToken) : "",
      "cloudflare.zoneId": cleanZoneId,
      "cloudflare.accountEmail": cleanAccountEmail,
      "cloudflare.isEnabled": Boolean(isEnabled),
      updatedBy: req.user?.userId || null,
    };

    const updatedDoc = await StoreSettingsModel.findOneAndUpdate(
      { key: "default" },
      { $set: updatePayload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return res.json({
      status: "success",
      message: "Cloudflare settings saved successfully.",
      data: {
        ...updatedDoc.cloudflare,
        apiToken: decryptText(updatedDoc.cloudflare?.apiToken || ""),
      },
    });
  } catch (error) {
    next(error);
  }
};



