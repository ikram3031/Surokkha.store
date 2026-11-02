import { Router } from "express";
// Same capture logic and collection as the shop API, so the dashboard shows both storefronts together
import { saveCheckoutLead } from "../../storefront/controllers/CheckoutLeadController.js";

const checkoutLeadRouter = Router();

// POST /store/v1/checkout-leads : save checkout details typed so far (abandoned checkout capture + Meta InitiateCheckout)
checkoutLeadRouter.post("/", saveCheckoutLead);

export default checkoutLeadRouter;
