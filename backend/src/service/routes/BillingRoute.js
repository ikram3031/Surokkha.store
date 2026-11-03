import { Router } from "express";
import {
  createBilling,
  deleteBilling,
  getBillingById,
  listBilling,
  updateBilling,
} from "../controllers/BillingController.js";
import { authenticateToken, authorizeRoles, ADMINS } from "../../common/middlewares/auth.middleware.js";
import { alertOwnersOnAdminAction } from "../../common/utils/ownerAlerts.js";

const billingRouter = Router();

billingRouter.use(authenticateToken, authorizeRoles(ADMINS));

billingRouter.post("/", createBilling);
billingRouter.get("/", listBilling);
billingRouter.get("/:billingId", getBillingById);
billingRouter.put("/:billingId", updateBilling);
billingRouter.delete("/:billingId", alertOwnersOnAdminAction("Deleted a bill"), deleteBilling);

export default billingRouter;
