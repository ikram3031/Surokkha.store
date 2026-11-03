import express, { Router } from "express";
import {
  pathaoWebhookController,
  getPathaoWebhookConfigController,
  updatePathaoWebhookConfigController,
  listPathaoWebhookEventsController,
  replayPathaoWebhookEventsController,
  listPathaoParcelsController,
  getPathaoParcelSummaryController,
  updatePathaoSettlementController,
  importPathaoInvoiceController,
} from "../controllers/PathaoController.js";
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
import { authenticateToken, authorizeRoles, OWNER_ONLY, ADMINS, OPERATORS } from "../../common/middlewares/auth.middleware.js";


const courierRouter = Router();

// Pathao webhook (public; verified by X-PATHAO-Signature inside the controller)
courierRouter.post("/pathao/webhook", pathaoWebhookController);

courierRouter.get(
  "/pathao/webhook/config",
  authenticateToken,
  authorizeRoles(OWNER_ONLY),
  getPathaoWebhookConfigController
);

courierRouter.put(
  "/pathao/webhook/config",
  authenticateToken,
  authorizeRoles(OWNER_ONLY),
  updatePathaoWebhookConfigController
);

courierRouter.get(
  "/pathao/webhook/events",
  authenticateToken,
  authorizeRoles(ADMINS),
  listPathaoWebhookEventsController
);

courierRouter.post(
  "/pathao/webhook/events/replay",
  authenticateToken,
  authorizeRoles(ADMINS),
  replayPathaoWebhookEventsController
);

// Pathao parcels & settlement (money fields are returned to the Owner only)
courierRouter.get(
  "/pathao/parcels",
  authenticateToken,
  authorizeRoles(OPERATORS),
  listPathaoParcelsController
);

courierRouter.get(
  "/pathao/parcels/summary",
  authenticateToken,
  authorizeRoles(OPERATORS),
  getPathaoParcelSummaryController
);

courierRouter.patch(
  "/pathao/parcels/:id/settlement",
  authenticateToken,
  authorizeRoles(OWNER_ONLY),
  updatePathaoSettlementController
);

courierRouter.post(
  "/pathao/invoices/import",
  authenticateToken,
  authorizeRoles(OWNER_ONLY),
  express.text({ type: ["text/csv", "text/plain"], limit: "5mb" }),
  importPathaoInvoiceController
);

// Pathao Courier Configuration & Testing (Protected)
courierRouter.get(
  "/pathao/config",
  authenticateToken,
  authorizeRoles(OPERATORS),
  getPathaoSettings
);

courierRouter.put(
  "/pathao/config",
  authenticateToken,
  authorizeRoles(OWNER_ONLY),
  updatePathaoSettings
);

courierRouter.post(
  "/pathao/test",
  authenticateToken,
  authorizeRoles(OWNER_ONLY),
  testPathaoConnectionController
);

// Stores
courierRouter.get(
  "/pathao/stores",
  authenticateToken,
  authorizeRoles(OPERATORS),
  getStoresController
);

courierRouter.post(
  "/pathao/stores",
  authenticateToken,
  authorizeRoles(ADMINS),
  createStoreController
);

// Location Lookups
courierRouter.get(
  "/pathao/cities",
  authenticateToken,
  authorizeRoles(OPERATORS),
  getCitiesController
);

courierRouter.get(
  "/pathao/zones/:cityId",
  authenticateToken,
  authorizeRoles(OPERATORS),
  getZonesController
);

courierRouter.get(
  "/pathao/areas/:zoneId",
  authenticateToken,
  authorizeRoles(OPERATORS),
  getAreasController
);

// Pricing Calculation
courierRouter.post(
  "/pathao/price-plan",
  authenticateToken,
  authorizeRoles(OPERATORS),
  calculatePriceController
);

// Order Dispatching & Consignments
courierRouter.post(
  "/pathao/orders/create",
  authenticateToken,
  authorizeRoles(OPERATORS),
  createOrderConsignmentController
);

courierRouter.post(
  "/pathao/orders/bulk-create",
  authenticateToken,
  authorizeRoles(OPERATORS),
  createBulkOrderConsignmentsController
);

// Manual bulk sync of order statuses & COD payments from Pathao
courierRouter.post(
  "/pathao/orders/sync",
  authenticateToken,
  authorizeRoles(OPERATORS),
  syncPathaoOrdersController
);

// Tracking Info
courierRouter.get(
  "/pathao/orders/:consignmentId/track",
  authenticateToken,
  authorizeRoles(OPERATORS),
  trackOrderController
);

// Location Sync & Lookups (Districts & Thanas)
courierRouter.post(
  "/pathao/sync-locations",
  authenticateToken,
  authorizeRoles(ADMINS),
  syncPathaoLocationsController
);

courierRouter.get(
  "/districts",
  authenticateToken,
  authorizeRoles(OPERATORS),
  getDistrictsListController
);

courierRouter.get(
  "/districts/:cityId/thanas",
  authenticateToken,
  authorizeRoles(OPERATORS),
  getDistrictThanasListController
);

export default courierRouter;

