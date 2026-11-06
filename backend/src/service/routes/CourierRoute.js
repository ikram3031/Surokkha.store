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
  getCourierProvidersController,
  updateCourierProvidersController,
} from "../controllers/CourierController.js";
import {
  redxWebhookController,
  getRedxSettingsController,
  updateRedxSettingsController,
  testRedxConnectionController,
  getRedxAreasController,
  getRedxPickupStoresController,
  createRedxPickupStoreController,
  calculateRedxChargeController,
  createRedxParcelController,
  trackRedxParcelController,
  cancelRedxParcelController,
  syncRedxOrdersController,
} from "../controllers/RedxController.js";
import { requireCourierEnabled } from "../../common/services/courierProviders.service.js";
import { authenticateToken, authorizeRoles, OWNER_ONLY, ADMINS, OPERATORS, ALL_STAFF } from "../../common/middlewares/auth.middleware.js";


const courierRouter = Router();
// Disabling a courier only blocks NEW dispatches; sync/tracking/settlement of parcels
// already sent keep working so their accounts stay up to date.
const pathaoOn = requireCourierEnabled("pathao");

// Which couriers are active (Owner decides from Settings → Couriers)
courierRouter.get("/providers", authenticateToken, authorizeRoles(ALL_STAFF), getCourierProvidersController);
courierRouter.put("/providers", authenticateToken, authorizeRoles(OWNER_ONLY), updateCourierProvidersController);

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
  pathaoOn,
  authorizeRoles(OPERATORS),
  createOrderConsignmentController
);

courierRouter.post(
  "/pathao/orders/bulk-create",
  authenticateToken,
  pathaoOn,
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

// ─── RedX ────────────────────────────────────────────────────────────────
// Only new dispatches need RedX enabled; tracking, sync and the webhook keep working for parcels already sent.
const redxOn = requireCourierEnabled("redx");

courierRouter.post("/redx/webhook", redxWebhookController);
courierRouter.get("/redx/config", authenticateToken, authorizeRoles(OPERATORS), getRedxSettingsController);
courierRouter.put("/redx/config", authenticateToken, authorizeRoles(OWNER_ONLY), updateRedxSettingsController);
courierRouter.post("/redx/test", authenticateToken, authorizeRoles(OWNER_ONLY), testRedxConnectionController);
courierRouter.get("/redx/areas", authenticateToken, authorizeRoles(OPERATORS), getRedxAreasController);
courierRouter.get("/redx/pickup-stores", authenticateToken, authorizeRoles(OPERATORS), getRedxPickupStoresController);
courierRouter.post("/redx/pickup-stores", authenticateToken, authorizeRoles(OWNER_ONLY), createRedxPickupStoreController);
courierRouter.post("/redx/charge", authenticateToken, authorizeRoles(OPERATORS), calculateRedxChargeController);
courierRouter.post("/redx/parcels", authenticateToken, redxOn, authorizeRoles(OPERATORS), createRedxParcelController);
courierRouter.get("/redx/parcels/:trackingId/track", authenticateToken, authorizeRoles(OPERATORS), trackRedxParcelController);
courierRouter.post("/redx/parcels/:trackingId/cancel", authenticateToken, authorizeRoles(ADMINS), cancelRedxParcelController);
courierRouter.post("/redx/orders/sync", authenticateToken, authorizeRoles(OPERATORS), syncRedxOrdersController);

export default courierRouter;

