import { Router } from "express";
import {
  createPayment,
  deletePayment,
  getPaymentById,
  listPayments,
  updatePayment,
  bulkUpdatePayments,
  bulkDeletePayments,
} from "../controllers/PaymentsController.js";
import { authenticateToken, authorizeRoles, ADMINS } from "../../common/middlewares/auth.middleware.js";
import { alertOwnersOnAdminAction } from "../../common/utils/ownerAlerts.js";
import paymentTypeRouter from "./PaymentTypeRoute.js";

const paymentsRouter = Router();

// Sub-routes for payment types/categories
paymentsRouter.use("/types", paymentTypeRouter);

// CRUD endpoints for payments, authenticated by JWT
paymentsRouter.use(authenticateToken, authorizeRoles(ADMINS));

// Create a new payment record
paymentsRouter.post("/", createPayment);

// Batch update status and amounts for multiple payments
paymentsRouter.post("/bulk-update", bulkUpdatePayments);

// Batch delete multiple payment records
paymentsRouter.post("/bulk-delete", alertOwnersOnAdminAction("Bulk deleted payments"), bulkDeletePayments);

// Retrieve payments with filtering and pagination
paymentsRouter.get("/", listPayments);

// Retrieve details of a single payment by ID
paymentsRouter.get("/:paymentId", getPaymentById);

// Update a payment record by ID
paymentsRouter.put("/:paymentId", updatePayment);

// Delete a payment record by ID
paymentsRouter.delete("/:paymentId", alertOwnersOnAdminAction("Deleted a payment"), deletePayment);

export default paymentsRouter;
