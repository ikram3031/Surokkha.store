import { Router } from "express";
import {
  createOrder,
  deleteOrder,
  getOrderById,
  getOrderInvoiceView,
  listOrders,
  updateOrder,
  bulkDeleteOrders,
  bulkUpdateOrders,
} from "../controllers/OrdersController.js";
import {
  authenticateToken,
  authorizeRoles,
} from "../../common/middlewares/auth.middleware.js";

const ordersRouter = Router();

// Create order from checkout payload (Public endpoint for guest and logged-in customers)
ordersRouter.post("/new-order", createOrder);

// Public printable / download invoice PDF view endpoint for order emails
ordersRouter.get("/:orderId/invoice", getOrderInvoiceView);

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

export default ordersRouter;
