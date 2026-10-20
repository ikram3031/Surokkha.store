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
import {
  getStoreSmtpSettings,
  updateStoreSmtpSettings,
  testStoreSmtpConnection,
} from "../controllers/StoreSmtpController.js";
import {
  authenticateToken,
  authorizeRoles,
} from "../../common/middlewares/auth.middleware.js";

// Store (surokkha.store) settings, mounted at /store/v2/settings
const storeSettingsRouter = Router();

storeSettingsRouter.get("/public/meta-pixel", getStorePublicMetaPixelConfig);

storeSettingsRouter.get(
  "/meta-pixel",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  getStoreMetaPixelSettings
);

storeSettingsRouter.put(
  "/meta-pixel",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  updateStoreMetaPixelSettings
);

storeSettingsRouter.post(
  "/meta-pixel/test",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  testStoreMetaPixelConnection
);

// Store SEO settings
storeSettingsRouter.get(
  "/seo",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  getStoreSeoSettings
);

storeSettingsRouter.put(
  "/seo",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  updateStoreSeoSettings
);

// Store SMTP settings
storeSettingsRouter.get(
  "/smtp",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  getStoreSmtpSettings
);

storeSettingsRouter.put(
  "/smtp",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  updateStoreSmtpSettings
);

storeSettingsRouter.post(
  "/smtp/test",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  testStoreSmtpConnection
);

export default storeSettingsRouter;
