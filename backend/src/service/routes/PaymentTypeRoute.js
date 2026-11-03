import { Router } from "express";
import {
  createPaymentType,
  deletePaymentType,
  getPaymentTypeById,
  listPaymentTypes,
  updatePaymentType,
  bulkUpdatePaymentTypes,
  bulkDeletePaymentTypes,
} from "../controllers/PaymentTypeController.js";
import { authenticateToken, authorizeRoles, ADMINS, OPERATORS } from "../../common/middlewares/auth.middleware.js";
import { alertOwnersOnAdminAction } from "../../common/utils/ownerAlerts.js";

const paymentTypeRouter = Router();

paymentTypeRouter.use(authenticateToken);

paymentTypeRouter.post("/", authorizeRoles(ADMINS), createPaymentType);
paymentTypeRouter.post("/bulk-update", authorizeRoles(ADMINS), bulkUpdatePaymentTypes);
paymentTypeRouter.post("/bulk-delete", authorizeRoles(ADMINS), alertOwnersOnAdminAction("Bulk deleted payment types"), bulkDeletePaymentTypes);
paymentTypeRouter.get("/", authorizeRoles(OPERATORS), listPaymentTypes);
paymentTypeRouter.get("/:id", authorizeRoles(OPERATORS), getPaymentTypeById);
paymentTypeRouter.put("/:id", authorizeRoles(ADMINS), updatePaymentType);
paymentTypeRouter.delete("/:id", authorizeRoles(ADMINS), alertOwnersOnAdminAction("Deleted a payment type"), deletePaymentType);

export default paymentTypeRouter;
