import { Router } from "express";
import {
  getPathaoSettings,
  updatePathaoSettings,
  testPathaoConnectionController,
  getStoresController,
  createStoreController,
  getCitiesController,
  getZonesController,
  getAreasController,
  calculatePriceController,
  createOrderConsignmentController,
  createBulkOrderConsignmentsController,
  trackOrderController,
  syncPathaoOrdersController,
  syncPathaoLocationsController,
  getDistrictsListController,
  getDistrictThanasListController,
} from "../controllers/CourierController.js";
import {
  authenticateToken,
  authorizeRoles,
} from "../../common/middlewares/auth.middleware.js";


const courierRouter = Router();

// Pathao Courier Configuration & Testing (Protected)
courierRouter.get(
  "/pathao/config",
  authenticateToken,
  authorizeRoles("Owner", "Admin", "Manager"),
  getPathaoSettings
);

courierRouter.put(
  "/pathao/config",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  updatePathaoSettings
);

courierRouter.post(
  "/pathao/test",
  authenticateToken,
  authorizeRoles("Owner", "Admin", "Manager"),
  testPathaoConnectionController
);

// Stores
courierRouter.get(
  "/pathao/stores",
  authenticateToken,
  authorizeRoles("Owner", "Admin", "Manager"),
  getStoresController
);

courierRouter.post(
  "/pathao/stores",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  createStoreController
);

// Location Lookups
courierRouter.get(
  "/pathao/cities",
  authenticateToken,
  authorizeRoles("Owner", "Admin", "Manager"),
  getCitiesController
);

courierRouter.get(
  "/pathao/zones/:cityId",
  authenticateToken,
  authorizeRoles("Owner", "Admin", "Manager"),
  getZonesController
);

courierRouter.get(
  "/pathao/areas/:zoneId",
  authenticateToken,
  authorizeRoles("Owner", "Admin", "Manager"),
  getAreasController
);

// Pricing Calculation
courierRouter.post(
  "/pathao/price-plan",
  authenticateToken,
  authorizeRoles("Owner", "Admin", "Manager"),
  calculatePriceController
);

// Order Dispatching & Consignments
courierRouter.post(
  "/pathao/orders/create",
  authenticateToken,
  authorizeRoles("Owner", "Admin", "Manager"),
  createOrderConsignmentController
);

courierRouter.post(
  "/pathao/orders/bulk-create",
  authenticateToken,
  authorizeRoles("Owner", "Admin", "Manager"),
  createBulkOrderConsignmentsController
);

// Manual bulk sync of order statuses & COD payments from Pathao
courierRouter.post(
  "/pathao/orders/sync",
  authenticateToken,
  authorizeRoles("Owner", "Admin", "Manager"),
  syncPathaoOrdersController
);

// Tracking Info
courierRouter.get(
  "/pathao/orders/:consignmentId/track",
  authenticateToken,
  authorizeRoles("Owner", "Admin", "Manager"),
  trackOrderController
);

// Location Sync & Lookups (Districts & Thanas)
courierRouter.post(
  "/pathao/sync-locations",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  syncPathaoLocationsController
);

courierRouter.get(
  "/districts",
  authenticateToken,
  getDistrictsListController
);

courierRouter.get(
  "/districts/:cityId/thanas",
  authenticateToken,
  getDistrictThanasListController
);

export default courierRouter;

