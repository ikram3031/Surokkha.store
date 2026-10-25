import { Router } from "express";
import { saveCheckoutLead } from "../controllers/CheckoutLeadController.js";

const checkoutLeadRouter = Router();

// POST /api/v1/checkout-leads : save checkout details typed so far (abandoned checkout capture + Meta InitiateCheckout)
checkoutLeadRouter.post("/", saveCheckoutLead);

export default checkoutLeadRouter;
