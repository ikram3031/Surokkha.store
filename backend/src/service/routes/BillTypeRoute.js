import { Router } from "express";
import {
  createBillType,
  deleteBillType,
  getBillTypeById,
  listBillTypes,
  updateBillType,
  bulkUpdateBillTypes,
  bulkDeleteBillTypes,
} from "../controllers/BillTypeController.js";
import { authenticateToken, authorizeRoles, ADMINS } from "../../common/middlewares/auth.middleware.js";
import { alertOwnersOnAdminAction } from "../../common/utils/ownerAlerts.js";

const billTypeRouter = Router();

billTypeRouter.use(authenticateToken, authorizeRoles(ADMINS));

billTypeRouter.post("/", createBillType);
billTypeRouter.post("/bulk-update", bulkUpdateBillTypes);
billTypeRouter.post("/bulk-delete", alertOwnersOnAdminAction("Bulk deleted bill types"), bulkDeleteBillTypes);
billTypeRouter.get("/", listBillTypes);
billTypeRouter.get("/:id", getBillTypeById);
billTypeRouter.put("/:id", updateBillType);
billTypeRouter.delete("/:id", alertOwnersOnAdminAction("Deleted a bill type"), deleteBillType);

export default billTypeRouter;
