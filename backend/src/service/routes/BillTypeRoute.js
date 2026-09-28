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
import { authenticateToken } from "../../common/middlewares/auth.middleware.js";

const billTypeRouter = Router();

billTypeRouter.use(authenticateToken);

billTypeRouter.post("/", createBillType);
billTypeRouter.post("/bulk-update", bulkUpdateBillTypes);
billTypeRouter.post("/bulk-delete", bulkDeleteBillTypes);
billTypeRouter.get("/", listBillTypes);
billTypeRouter.get("/:id", getBillTypeById);
billTypeRouter.put("/:id", updateBillType);
billTypeRouter.delete("/:id", deleteBillType);

export default billTypeRouter;
