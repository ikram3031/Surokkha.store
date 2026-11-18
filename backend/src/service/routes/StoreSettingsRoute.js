import { Router } from "express";
import {
  getStoreMetaPixelSettings,
  updateStoreMetaPixelSettings,
  testStoreMetaPixelConnection,
  getStorePublicMetaPixelConfig,
} from "../controllers/StoreMetaPixelController.js";
import {
  getStoreSeoSettings,
  updateStoreSeoSettings,
} from "../controllers/StoreSeoController.js";
import { authenticateToken, authorizeRoles, MARKETERS } from "../../common/middlewares/auth.middleware.js";
import { alertOwnersOnAdminAction } from "../../common/utils/ownerAlerts.js";

// Store (surokkha.store) settings, mounted at /store/v2/settings
const storeSettingsRouter = Router();

storeSettingsRouter.get("/public/meta-pixel", getStorePublicMetaPixelConfig);

storeSettingsRouter.get(
  "/meta-pixel",
  authenticateToken,
  authorizeRoles(MARKETERS),
  getStoreMetaPixelSettings
);

storeSettingsRouter.put(
  "/meta-pixel",
  authenticateToken,
  authorizeRoles(MARKETERS), alertOwnersOnAdminAction("Changed settings: /meta-pixel"),
  updateStoreMetaPixelSettings
);

storeSettingsRouter.post(
  "/meta-pixel/test",
  authenticateToken,
  authorizeRoles(MARKETERS),
  testStoreMetaPixelConnection
);

// Store SEO settings
storeSettingsRouter.get(
  "/seo",
  authenticateToken,
  authorizeRoles(MARKETERS),
  getStoreSeoSettings
);

storeSettingsRouter.put(
  "/seo",
  authenticateToken,
  authorizeRoles(MARKETERS), alertOwnersOnAdminAction("Changed settings: /seo"),
  updateStoreSeoSettings
);

export default storeSettingsRouter;
