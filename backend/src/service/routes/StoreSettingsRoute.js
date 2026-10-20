import { Router } from "express";
import {
  getStoreMetaPixelSettings,
  updateStoreMetaPixelSettings,
  testStoreMetaPixelConnection,
  getStorePublicMetaPixelConfig,
} from "../controllers/StoreMetaPixelController.js";
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

export default storeSettingsRouter;
