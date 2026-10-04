import { Router } from "express";
import {
  getMetaPixelSettings,
  updateMetaPixelSettings,
  testMetaPixelConnection,
  getPublicMetaPixelConfig,
  getTikTokPixelSettings,
  updateTikTokPixelSettings,
  testTikTokPixelConnection,
  getPublicTikTokPixelConfig,
  getGoogleAnalyticsSettings,
  updateGoogleAnalyticsSettings,
  getSeoSettings,
  updateSeoSettings,
  getSmtpSettings,
  updateSmtpSettings,
  testSmtpConnection,
  getImapSettings,
  updateImapSettings,
  getCloudflareSettings,
  updateCloudflareSettings,
  getTemplateSettings,
  updateTemplateSettings,
  previewTemplateHtml,
  testTemplateEmail,
  resetTemplateSettings,
} from "../controllers/SettingsController.js";
import {
  authenticateToken,
  authorizeRoles,
} from "../../common/middlewares/auth.middleware.js";

const settingsRouter = Router();

// Public sanitized Meta Pixel configuration for customer storefront
settingsRouter.get("/public/meta-pixel", getPublicMetaPixelConfig);

// Public sanitized TikTok Pixel configuration for customer storefront
settingsRouter.get("/public/tiktok-pixel", getPublicTikTokPixelConfig);

// Protected Meta Pixel and CAPI administration endpoints
settingsRouter.get(
  "/meta-pixel",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  getMetaPixelSettings
);

settingsRouter.put(
  "/meta-pixel",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  updateMetaPixelSettings
);

settingsRouter.post(
  "/meta-pixel/test",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  testMetaPixelConnection
);

// Protected TikTok Pixel and Events API administration endpoints
settingsRouter.get(
  "/tiktok-pixel",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  getTikTokPixelSettings
);

settingsRouter.put(
  "/tiktok-pixel",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  updateTikTokPixelSettings
);

settingsRouter.post(
  "/tiktok-pixel/test",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  testTikTokPixelConnection
);

// Protected Google Analytics administration endpoints
settingsRouter.get(
  "/google-analytics",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  getGoogleAnalyticsSettings
);

settingsRouter.put(
  "/google-analytics",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  updateGoogleAnalyticsSettings
);

// Protected SEO administration endpoints
settingsRouter.get(
  "/seo",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  getSeoSettings
);

settingsRouter.put(
  "/seo",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  updateSeoSettings
);

// Protected SMTP administration endpoints
settingsRouter.get(
  "/smtp",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  getSmtpSettings
);

settingsRouter.put(
  "/smtp",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  updateSmtpSettings
);

settingsRouter.post(
  "/smtp/test",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  testSmtpConnection
);

// Protected IMAP administration endpoints
settingsRouter.get(
  "/imap",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  getImapSettings
);

settingsRouter.put(
  "/imap",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  updateImapSettings
);

// Protected Cloudflare administration endpoints
settingsRouter.get(
  "/cloudflare",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  getCloudflareSettings
);

settingsRouter.put(
  "/cloudflare",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  updateCloudflareSettings
);

// Protected Invoice & Email Template Customizer endpoints
settingsRouter.get(
  "/template",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  getTemplateSettings
);
settingsRouter.get(
  "/templates",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  getTemplateSettings
);

settingsRouter.put(
  "/template",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  updateTemplateSettings
);
settingsRouter.put(
  "/templates",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  updateTemplateSettings
);

settingsRouter.post(
  "/template/preview",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  previewTemplateHtml
);
settingsRouter.post(
  "/templates/preview",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  previewTemplateHtml
);

settingsRouter.post(
  "/template/test-email",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  testTemplateEmail
);
settingsRouter.post(
  "/templates/test-email",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  testTemplateEmail
);

settingsRouter.post(
  "/template/reset",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  resetTemplateSettings
);
settingsRouter.post(
  "/templates/reset",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  resetTemplateSettings
);

export default settingsRouter;

