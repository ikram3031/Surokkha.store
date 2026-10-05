import { Router } from "express";
import {
  createOrder,
  getOrderById,
  getOrderInvoiceView,
  checkPhoneStatus,
} from "../controllers/OrdersController.js";

const ordersRouter = Router();

// Check if customer phone/email is flagged in fake orders
ordersRouter.get("/check-phone", checkPhoneStatus);

// Create order from checkout payload (Public customer endpoint)
ordersRouter.post("/new-order", createOrder);

// Public printable / download invoice PDF view endpoint for order emails
ordersRouter.get("/:orderId/invoice", getOrderInvoiceView);

// Public / customer lookup for order details
ordersRouter.get("/:orderId", getOrderById);

export default ordersRouter;
