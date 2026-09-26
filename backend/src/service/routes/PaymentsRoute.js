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
import { authenticateToken } from "../../common/middlewares/auth.middleware.js";

const paymentsRouter = Router();

// CRUD endpoints for payments, authenticated by JWT
paymentsRouter.use(authenticateToken);

// Create a new payment record
paymentsRouter.post("/", createPayment);

// Batch update status and amounts for multiple payments
paymentsRouter.post("/bulk-update", bulkUpdatePayments);

// Batch delete multiple payment records
paymentsRouter.post("/bulk-delete", bulkDeletePayments);

// Retrieve payments with filtering and pagination
paymentsRouter.get("/", listPayments);

// Retrieve details of a single payment by ID
paymentsRouter.get("/:paymentId", getPaymentById);

// Update a payment record by ID
paymentsRouter.put("/:paymentId", updatePayment);

// Delete a payment record by ID
paymentsRouter.delete("/:paymentId", deletePayment);

export default paymentsRouter;
