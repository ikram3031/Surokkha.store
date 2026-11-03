import { Router } from "express";
import {
  createOrder,
  deleteOrder,
  getOrderById,
  getOrderInvoiceView,
  sendOrderInvoiceEmail,
  listOrders,
  updateOrder,
  bulkDeleteOrders,
  bulkUpdateOrders,
  getSpamList,
  deleteSpamListEntry,
  addSpamListEntry,
} from "../controllers/OrdersController.js";
import { authenticateToken, optionalAuthenticate, authorizeRoles, OWNER_ONLY, ADMINS, OPERATORS, ALL_STAFF } from "../../common/middlewares/auth.middleware.js";

const ordersRouter = Router();

// Create order from checkout payload (Public endpoint for guest and logged-in customers)
ordersRouter.post("/new-order", optionalAuthenticate, createOrder);

// Fetch the spam list (Dashboard/Admin only)
ordersRouter.get(
  "/spam/list",
  authenticateToken,
  authorizeRoles(OPERATORS),
  getSpamList
);

// Manually add a phone/email to the spam list (Dashboard/Admin only)
ordersRouter.post(
  "/spam",
  authenticateToken,
  authorizeRoles(ADMINS),
  addSpamListEntry
);

// Delete entry from spam list (Dashboard/Admin only)
ordersRouter.delete(
  "/spam/:id",
  authenticateToken,
  authorizeRoles(ADMINS),
  deleteSpamListEntry
);

// Public printable / download invoice PDF view endpoint for order emails
ordersRouter.get("/:orderId/invoice", getOrderInvoiceView);

// Dispatches order invoice email (Dashboard/Admin only)
ordersRouter.post(
  "/:orderId/send-invoice-email",
  authenticateToken,
  authorizeRoles(OPERATORS),
  sendOrderInvoiceEmail,
);

// Get a paginated list of all orders (Dashboard/Admin only)
ordersRouter.get(
  "/",
  authenticateToken,
  authorizeRoles(ALL_STAFF),
  listOrders,
);

// Get details of a single order by ID (Dashboard/Admin only)
ordersRouter.get(
  "/:orderId",
  authenticateToken,
  authorizeRoles(ALL_STAFF),
  getOrderById,
);

// Update order status/details by ID (Dashboard/Admin only)
ordersRouter.put(
  "/:orderId",
  authenticateToken,
  authorizeRoles(OPERATORS),
  updateOrder,
);

// Delete order and clean up linked payment/member references (Dashboard/Admin only)
ordersRouter.delete(
  "/:orderId",
  authenticateToken,
  authorizeRoles(OWNER_ONLY),
  deleteOrder,
);

// Batch delete multiple orders and trigger cleanups (Dashboard/Admin only)
ordersRouter.post(
  "/bulk-delete",
  authenticateToken,
  authorizeRoles(OWNER_ONLY),
  bulkDeleteOrders,
);

// Batch update status and/or paymentStatus for multiple orders (Dashboard/Admin only)
ordersRouter.post(
  "/bulk-update",
  authenticateToken,
  authorizeRoles(OPERATORS),
  bulkUpdateOrders,
);

// Fetch the spam list (Dashboard/Admin only)
ordersRouter.get(
  "/spam/list",
  authenticateToken,
  authorizeRoles(OPERATORS),
  getSpamList
);

// Delete entry from spam list (Dashboard/Admin only)
ordersRouter.delete(
  "/spam/:id",
  authenticateToken,
  authorizeRoles(ADMINS),
  deleteSpamListEntry
);

export default ordersRouter;
