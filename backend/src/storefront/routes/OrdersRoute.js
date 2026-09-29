import { Router } from "express";
import {
  createOrder,
  getOrderById,
  getOrderInvoiceView,
} from "../controllers/OrdersController.js";

const ordersRouter = Router();

// Create order from checkout payload (Public customer endpoint)
ordersRouter.post("/new-order", createOrder);

// Public printable / download invoice PDF view endpoint for order emails
ordersRouter.get("/:orderId/invoice", getOrderInvoiceView);

// Public / customer lookup for order details
ordersRouter.get("/:orderId", getOrderById);

export default ordersRouter;
