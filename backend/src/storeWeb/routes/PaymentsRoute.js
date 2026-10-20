import { Router } from "express";
import {
  createPayment,
  getPaymentById,
} from "../controllers/PaymentsController.js";

const paymentsRouter = Router();

// Create payment record from customer checkout
paymentsRouter.post("/", createPayment);

// Retrieve details of a payment by ID
paymentsRouter.get("/:paymentId", getPaymentById);

export default paymentsRouter;
