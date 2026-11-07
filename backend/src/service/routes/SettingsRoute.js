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
import { authenticateToken, authorizeRoles, OWNER_ONLY, MARKETERS } from "../../common/middlewares/auth.middleware.js";
import { getPlexiviaSyncSettings, updatePlexiviaSyncSettings } from "../controllers/PlexiviaSyncController.js";
import { alertOwnersOnAdminAction } from "../../common/utils/ownerAlerts.js";
import {
  getR2StorageSettings,
  updateR2StorageSettings,
  testR2StorageConnection,
  runR2BackupNow,
  listR2Backups,
  downloadR2Backup,
} from "../controllers/R2StorageController.js";

const settingsRouter = Router();

// Public sanitized Meta Pixel configuration for customer storefront
settingsRouter.get("/public/meta-pixel", getPublicMetaPixelConfig);

// Public sanitized TikTok Pixel configuration for customer storefront
settingsRouter.get("/public/tiktok-pixel", getPublicTikTokPixelConfig);

// Protected Meta Pixel and CAPI administration endpoints
settingsRouter.get(
  "/meta-pixel",
  authenticateToken,
  authorizeRoles(MARKETERS),
  getMetaPixelSettings
);

settingsRouter.put(
  "/meta-pixel",
  authenticateToken,
  authorizeRoles(MARKETERS), alertOwnersOnAdminAction("Changed settings: /meta-pixel"),
  updateMetaPixelSettings
);

settingsRouter.post(
  "/meta-pixel/test",
  authenticateToken,
  authorizeRoles(MARKETERS),
  testMetaPixelConnection
);

// Protected TikTok Pixel and Events API administration endpoints
settingsRouter.get(
  "/tiktok-pixel",
  authenticateToken,
  authorizeRoles(MARKETERS),
  getTikTokPixelSettings
);

settingsRouter.put(
  "/tiktok-pixel",
  authenticateToken,
  authorizeRoles(MARKETERS), alertOwnersOnAdminAction("Changed settings: /tiktok-pixel"),
  updateTikTokPixelSettings
);

settingsRouter.post(
  "/tiktok-pixel/test",
  authenticateToken,
  authorizeRoles(MARKETERS),
  testTikTokPixelConnection
);

// Protected Google Analytics administration endpoints
settingsRouter.get(
  "/google-analytics",
  authenticateToken,
  authorizeRoles(MARKETERS),
  getGoogleAnalyticsSettings
);

settingsRouter.put(
  "/google-analytics",
  authenticateToken,
  authorizeRoles(MARKETERS), alertOwnersOnAdminAction("Changed settings: /google-analytics"),
  updateGoogleAnalyticsSettings
);

// Protected SEO administration endpoints
settingsRouter.get(
  "/seo",
  authenticateToken,
  authorizeRoles(MARKETERS),
  getSeoSettings
);

settingsRouter.put(
  "/seo",
  authenticateToken,
  authorizeRoles(MARKETERS), alertOwnersOnAdminAction("Changed settings: /seo"),
  updateSeoSettings
);

// Protected SMTP administration endpoints
settingsRouter.get(
  "/smtp",
  authenticateToken,
  authorizeRoles(OWNER_ONLY),
  getSmtpSettings
);

settingsRouter.put(
  "/smtp",
  authenticateToken,
  authorizeRoles(OWNER_ONLY),
  updateSmtpSettings
);

settingsRouter.post(
  "/smtp/test",
  authenticateToken,
  authorizeRoles(OWNER_ONLY),
  testSmtpConnection
);

// Protected IMAP administration endpoints
settingsRouter.get(
  "/imap",
  authenticateToken,
  authorizeRoles(OWNER_ONLY),
  getImapSettings
);

settingsRouter.put(
  "/imap",
  authenticateToken,
  authorizeRoles(OWNER_ONLY),
  updateImapSettings
);

// Plexivia dashboard sync key (Owner only)
settingsRouter.get("/plexivia-sync", authenticateToken, authorizeRoles(OWNER_ONLY), getPlexiviaSyncSettings);
settingsRouter.put("/plexivia-sync", authenticateToken, authorizeRoles(OWNER_ONLY), updatePlexiviaSyncSettings);

// Protected Cloudflare R2 storage (backup) endpoints
settingsRouter.get("/r2-storage", authenticateToken, authorizeRoles(OWNER_ONLY), getR2StorageSettings);
settingsRouter.put("/r2-storage", authenticateToken, authorizeRoles(OWNER_ONLY), updateR2StorageSettings);
settingsRouter.post("/r2-storage/test", authenticateToken, authorizeRoles(OWNER_ONLY), testR2StorageConnection);
settingsRouter.post("/r2-storage/backup-now", authenticateToken, authorizeRoles(OWNER_ONLY), runR2BackupNow);
settingsRouter.get("/r2-storage/backups", authenticateToken, authorizeRoles(OWNER_ONLY), listR2Backups);
settingsRouter.get("/r2-storage/backups/download", authenticateToken, authorizeRoles(OWNER_ONLY), downloadR2Backup);

// Protected Cloudflare administration endpoints
settingsRouter.get(
  "/cloudflare",
  authenticateToken,
  authorizeRoles(OWNER_ONLY),
  getCloudflareSettings
);

settingsRouter.put(
  "/cloudflare",
  authenticateToken,
  authorizeRoles(OWNER_ONLY),
  updateCloudflareSettings
);

// Protected Invoice & Email Template Customizer endpoints
settingsRouter.get(
  "/template",
  authenticateToken,
  authorizeRoles(MARKETERS),
  getTemplateSettings
);
settingsRouter.get(
  "/templates",
  authenticateToken,
  authorizeRoles(MARKETERS),
  getTemplateSettings
);

settingsRouter.put(
  "/template",
  authenticateToken,
  authorizeRoles(MARKETERS), alertOwnersOnAdminAction("Changed settings: /template"),
  updateTemplateSettings
);
settingsRouter.put(
  "/templates",
  authenticateToken,
  authorizeRoles(MARKETERS), alertOwnersOnAdminAction("Changed settings: /templates"),
  updateTemplateSettings
);

settingsRouter.post(
  "/template/preview",
  authenticateToken,
  authorizeRoles(MARKETERS),
  previewTemplateHtml
);
settingsRouter.post(
  "/templates/preview",
  authenticateToken,
  authorizeRoles(MARKETERS),
  previewTemplateHtml
);

settingsRouter.post(
  "/template/test-email",
  authenticateToken,
  authorizeRoles(MARKETERS),
  testTemplateEmail
);
settingsRouter.post(
  "/templates/test-email",
  authenticateToken,
  authorizeRoles(MARKETERS),
  testTemplateEmail
);

settingsRouter.post(
  "/template/reset",
  authenticateToken,
  authorizeRoles(MARKETERS), alertOwnersOnAdminAction("Changed settings: /template/reset"),
  resetTemplateSettings
);
settingsRouter.post(
  "/templates/reset",
  authenticateToken,
  authorizeRoles(MARKETERS), alertOwnersOnAdminAction("Changed settings: /templates/reset"),
  resetTemplateSettings
);

export default settingsRouter;

