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
import { encryptText, decryptText } from "../../common/utils/crypto.util.js";
import {
  DEFAULT_TEMPLATE_PRESETS,
  compileA4InvoiceHtml,
  compileTransactionalEmailHtml,
} from "../../common/templates/invoices/templateEngine.js";
import { getSmtpTransport } from "../../common/services/smtpConfig.service.js";

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

    try {
      await transporter.verify();
      return res.json({
        status: "success",
        message: "SMTP connection verified successfully.",
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

// Mock order dataset for live template preview in Admin Studio
const MOCK_PREVIEW_ORDER = {
  orderId: "SC-10892",
  createdAt: new Date().toISOString(),
  customerName: "Rahim Chowdhury",
  customerPhone: "+8801712345678",
  customerEmail: "rahim.chowdhury@example.com",
  customerAddress: "House 42, Road 11, Banani, Dhaka-1213",
  paymentMethod: "Cash on Delivery",
  paymentStatus: "paid",
  subtotal: 3850,
  shippingFee: 80,
  discountAmount: 250,
  totalAmount: 3680,
  items: [
    {
      productName: "Premium Cotton Oversized T-Shirt",
      variantName: "Black / L",
      sku: "TSH-BLK-L",
      quantity: 2,
      unitPrice: 1250,
      subtotal: 2500,
    },
    {
      productName: "Slim Fit Chino Trousers",
      variantName: "Navy / 32",
      sku: "CHN-NVY-32",
      quantity: 1,
      unitPrice: 1350,
      subtotal: 1350,
    },
  ],
};

// Retrieves invoice & email template customization settings
export const getTemplateSettings = async (req, res, next) => {
  try {
    const doc = await StoreSettingsModel.findOne({ key: "default" }).lean();
    const dbTemplates = doc?.templates || {};
    const preset = dbTemplates.preset || "modern";
    const defaultPreset = DEFAULT_TEMPLATE_PRESETS[preset] || DEFAULT_TEMPLATE_PRESETS.modern;

    const resolvedSettings = {
      preset,
      isActive: dbTemplates.isActive ?? true,
      branding: {
        ...defaultPreset.branding,
        ...(dbTemplates.branding || {}),
      },
      header: {
        ...defaultPreset.header,
        logoUrl: dbTemplates.header?.logoUrl || clientConfig?.logoUrl || "",
        ...(dbTemplates.header || {}),
      },
      table: {
        ...defaultPreset.table,
        ...(dbTemplates.table || {}),
      },
      footer: {
        ...defaultPreset.footer,
        supportPhone: dbTemplates.footer?.supportPhone || clientConfig?.contact?.phone || clientConfig?.phone || "",
        supportEmail: dbTemplates.footer?.supportEmail || clientConfig?.contact?.supportEmail || clientConfig?.supportEmail || "",
        supportAddress: dbTemplates.footer?.supportAddress || clientConfig?.contact?.address || clientConfig?.address || "",
        ...(dbTemplates.footer || {}),
      },
      email: {
        ...defaultPreset.email,
        ...(dbTemplates.email || {}),
      },
      customCss: dbTemplates.customCss || "",
      isPersistedInDb: Boolean(doc?.templates?.branding?.primaryColor),
    };

    return res.json({
      status: "success",
      data: resolvedSettings,
      presets: DEFAULT_TEMPLATE_PRESETS,
    });
  } catch (error) {
    next(error);
  }
};

// Updates invoice & email template customization settings in database
export const updateTemplateSettings = async (req, res, next) => {
  try {
    const {
      preset = "modern",
      isActive = true,
      branding = {},
      header = {},
      table = {},
      footer = {},
      email = {},
      customCss = "",
    } = req.body || {};

    const updatePayload = {
      "templates.preset": String(preset).trim(),
      "templates.isActive": Boolean(isActive),
      "templates.branding": branding,
      "templates.header": header,
      "templates.table": table,
      "templates.footer": footer,
      "templates.email": email,
      "templates.customCss": String(customCss).trim(),
      updatedBy: req.user?.userId || null,
    };

    const updatedDoc = await StoreSettingsModel.findOneAndUpdate(
      { key: "default" },
      { $set: updatePayload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return res.json({
      status: "success",
      message: "Template settings saved successfully.",
      data: updatedDoc.templates,
    });
  } catch (error) {
    next(error);
  }
};

// Generates real-time compiled HTML for live preview in Admin Studio
export const previewTemplateHtml = async (req, res, next) => {
  try {
    const { templateConfig = {}, order = null, mode = "a4" } = req.body || {};
    const targetOrder = order || MOCK_PREVIEW_ORDER;

    let html = "";
    if (mode === "email") {
      html = compileTransactionalEmailHtml({
        templateConfig,
        order: targetOrder,
        clientConfig,
      });
    } else {
      html = compileA4InvoiceHtml({
        templateConfig,
        order: targetOrder,
        clientConfig,
        isPrintView: true,
      });
    }

    return res.json({
      status: "success",
      data: { html },
    });
  } catch (error) {
    next(error);
  }
};

// Sends test transactional invoice email to admin
export const testTemplateEmail = async (req, res, next) => {
  try {
    const { recipientEmail, templateConfig } = req.body || {};
    const targetEmail = recipientEmail || req.user?.email;

    if (!targetEmail) {
      return res.status(400).json({
        status: "error",
        message: "Recipient email is required for test email delivery.",
      });
    }

    const htmlContent = compileTransactionalEmailHtml({
      templateConfig: templateConfig || {},
      order: MOCK_PREVIEW_ORDER,
      clientConfig,
    });

    const transport = await getSmtpTransport();
    if (!transport) {
      return res.status(400).json({
        status: "error",
        message: "SMTP server is not configured. Please configure SMTP in Settings > SMTP Configuration first.",
      });
    }

    const mailOptions = {
      from: `"${clientConfig?.brandName || ''}" <${transport.options?.auth?.user || 'support@example.com'}>`,
      to: targetEmail,
      subject: `[TEST PREVIEW] Order Confirmation #${MOCK_PREVIEW_ORDER.orderId} - ${clientConfig?.brandName || ''}`,
      html: htmlContent,
    };

    await transport.sendMail(mailOptions);

    return res.json({
      status: "success",
      message: `Test email sent successfully to ${targetEmail}`,
    });
  } catch (error) {
    next(error);
  }
};

// Resets template settings to a specified preset
export const resetTemplateSettings = async (req, res, next) => {
  try {
    const { preset = "modern" } = req.body || {};
    const targetPreset = DEFAULT_TEMPLATE_PRESETS[preset] || DEFAULT_TEMPLATE_PRESETS.modern;

    const resetPayload = {
      preset,
      isActive: true,
      branding: targetPreset.branding,
      header: {
        ...targetPreset.header,
        logoUrl: clientConfig?.logoUrl || "",
      },
      table: targetPreset.table,
      footer: {
        ...targetPreset.footer,
        supportPhone: clientConfig?.contact?.phone || clientConfig?.phone || "",
        supportEmail: clientConfig?.contact?.supportEmail || clientConfig?.supportEmail || "",
        supportAddress: clientConfig?.contact?.address || clientConfig?.address || "",
      },
      email: targetPreset.email,
      customCss: "",
    };

    const updatedDoc = await StoreSettingsModel.findOneAndUpdate(
      { key: "default" },
      { $set: { templates: resetPayload, updatedBy: req.user?.userId || null } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return res.json({
      status: "success",
      message: `Template reset to '${preset}' preset successfully.`,
      data: updatedDoc.templates,
    });
  } catch (error) {
    next(error);
  }
};




