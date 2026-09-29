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
import { authenticateToken } from "../../common/middlewares/auth.middleware.js";

const paymentTypeRouter = Router();

paymentTypeRouter.use(authenticateToken);

paymentTypeRouter.post("/", createPaymentType);
paymentTypeRouter.post("/bulk-update", bulkUpdatePaymentTypes);
paymentTypeRouter.post("/bulk-delete", bulkDeletePaymentTypes);
paymentTypeRouter.get("/", listPaymentTypes);
paymentTypeRouter.get("/:id", getPaymentTypeById);
paymentTypeRouter.put("/:id", updatePaymentType);
paymentTypeRouter.delete("/:id", deletePaymentType);

export default paymentTypeRouter;
