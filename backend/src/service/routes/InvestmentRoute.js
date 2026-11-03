import { Router } from "express";
import {
  createInvestment,
  deleteInvestment,
  getInvestmentById,
  listInvestments,
  updateInvestment,
  bulkUpdateInvestments,
  bulkDeleteInvestments,
  recordInvestmentReturn,
} from "../controllers/InvestmentController.js";
import { authenticateToken, authorizeRoles, ADMINS } from "../../common/middlewares/auth.middleware.js";
import { alertOwnersOnAdminAction } from "../../common/utils/ownerAlerts.js";

const investmentRouter = Router();

investmentRouter.use(authenticateToken, authorizeRoles(ADMINS));

investmentRouter.post("/bulk-update", bulkUpdateInvestments);
investmentRouter.post("/bulk-delete", alertOwnersOnAdminAction("Bulk deleted investments"), bulkDeleteInvestments);
investmentRouter.post("/return", recordInvestmentReturn);
investmentRouter.post("/:id/return", recordInvestmentReturn);

investmentRouter.post("/", createInvestment);
investmentRouter.get("/", listInvestments);
investmentRouter.get("/:id", getInvestmentById);
investmentRouter.put("/:id", updateInvestment);
investmentRouter.delete("/:id", alertOwnersOnAdminAction("Deleted an investment"), deleteInvestment);

export default investmentRouter;
