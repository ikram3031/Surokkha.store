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
import {
  authenticateToken,
  authorizeRoles,
  optionalAuthenticate,
} from "../../common/middlewares/auth.middleware.js";

const ordersRouter = Router();

// Create order from checkout payload (Public endpoint for guest and logged-in customers)
ordersRouter.post("/new-order", optionalAuthenticate, createOrder);

// Fetch the spam list (Dashboard/Admin only)
ordersRouter.get(
  "/spam/list",
  authenticateToken,
  authorizeRoles("Owner", "Admin", "Manager"),
  getSpamList
);

// Manually add a phone/email to the spam list (Dashboard/Admin only)
ordersRouter.post(
  "/spam",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  addSpamListEntry
);

// Delete entry from spam list (Dashboard/Admin only)
ordersRouter.delete(
  "/spam/:id",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  deleteSpamListEntry
);

// Public printable / download invoice PDF view endpoint for order emails
ordersRouter.get("/:orderId/invoice", getOrderInvoiceView);

// Dispatches order invoice email (Dashboard/Admin only)
ordersRouter.post(
  "/:orderId/send-invoice-email",
  authenticateToken,
  authorizeRoles("Owner", "Admin", "Manager"),
  sendOrderInvoiceEmail,
);

// Get a paginated list of all orders (Dashboard/Admin only)
ordersRouter.get(
  "/",
  authenticateToken,
  authorizeRoles("Owner", "Admin", "Manager"),
  listOrders,
);

// Get details of a single order by ID (Dashboard/Admin only)
ordersRouter.get(
  "/:orderId",
  authenticateToken,
  authorizeRoles("Owner", "Admin", "Manager"),
  getOrderById,
);

// Update order status/details by ID (Dashboard/Admin only)
ordersRouter.put(
  "/:orderId",
  authenticateToken,
  authorizeRoles("Owner", "Admin", "Manager"),
  updateOrder,
);

// Delete order and clean up linked payment/member references (Dashboard/Admin only)
ordersRouter.delete(
  "/:orderId",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  deleteOrder,
);

// Batch delete multiple orders and trigger cleanups (Dashboard/Admin only)
ordersRouter.post(
  "/bulk-delete",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  bulkDeleteOrders,
);

// Batch update status and/or paymentStatus for multiple orders (Dashboard/Admin only)
ordersRouter.post(
  "/bulk-update",
  authenticateToken,
  authorizeRoles("Owner", "Admin", "Manager"),
  bulkUpdateOrders,
);

// Fetch the spam list (Dashboard/Admin only)
ordersRouter.get(
  "/spam/list",
  authenticateToken,
  authorizeRoles("Owner", "Admin", "Manager"),
  getSpamList
);

// Delete entry from spam list (Dashboard/Admin only)
ordersRouter.delete(
  "/spam/:id",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  deleteSpamListEntry
);

export default ordersRouter;
