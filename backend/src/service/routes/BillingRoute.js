import { Router } from "express";
import {
  createBilling,
  deleteBilling,
  getBillingById,
  listBilling,
  updateBilling,
} from "../controllers/BillingController.js";
import { authenticateToken } from "../../common/middlewares/auth.middleware.js";

const billingRouter = Router();

billingRouter.use(authenticateToken);

billingRouter.post("/", createBilling);
billingRouter.get("/", listBilling);
billingRouter.get("/:billingId", getBillingById);
billingRouter.put("/:billingId", updateBilling);
billingRouter.delete("/:billingId", deleteBilling);

export default billingRouter;
