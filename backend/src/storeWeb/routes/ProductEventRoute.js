import { Router } from "express";
// Same capture logic and collection as the shop API, so the dashboard shows both storefronts together
import { recordProductEvents } from "../../storefront/controllers/ProductEventController.js";

const productEventRouter = Router();

// POST /store/v1/product-events : product view / add-to-cart / checkout / purchase tracking for the dashboard funnel
productEventRouter.post("/", (req, res) => {
  req.productEventSite = "store";
  return recordProductEvents(req, res);
});

export default productEventRouter;
