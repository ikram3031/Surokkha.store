import { Router } from "express";
import { recordProductEvents } from "../controllers/ProductEventController.js";

const productEventRouter = Router();

// POST /api/v1/product-events : product view / add-to-cart / checkout / purchase tracking for the dashboard funnel
productEventRouter.post("/", recordProductEvents);

export default productEventRouter;
