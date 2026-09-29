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
import { authenticateToken } from "../../common/middlewares/auth.middleware.js";

const investmentRouter = Router();

investmentRouter.use(authenticateToken);

investmentRouter.post("/bulk-update", bulkUpdateInvestments);
investmentRouter.post("/bulk-delete", bulkDeleteInvestments);
investmentRouter.post("/return", recordInvestmentReturn);
investmentRouter.post("/:id/return", recordInvestmentReturn);

investmentRouter.post("/", createInvestment);
investmentRouter.get("/", listInvestments);
investmentRouter.get("/:id", getInvestmentById);
investmentRouter.put("/:id", updateInvestment);
investmentRouter.delete("/:id", deleteInvestment);

export default investmentRouter;
