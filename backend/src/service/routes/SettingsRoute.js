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

export default settingsRouter;
