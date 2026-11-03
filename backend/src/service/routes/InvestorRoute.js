import { Router } from "express";
import {
  createInvestor,
  deleteInvestor,
  getInvestorById,
  listInvestors,
  updateInvestor,
} from "../controllers/InvestorController.js";
import { authenticateToken, authorizeRoles, ADMINS } from "../../common/middlewares/auth.middleware.js";
import { alertOwnersOnAdminAction } from "../../common/utils/ownerAlerts.js";

const investorRouter = Router();

investorRouter.use(authenticateToken, authorizeRoles(ADMINS));

investorRouter.post("/", createInvestor);
investorRouter.get("/", listInvestors);
investorRouter.get("/:id", getInvestorById);
investorRouter.put("/:id", updateInvestor);
investorRouter.delete("/:id", alertOwnersOnAdminAction("Deleted an investor"), deleteInvestor);

export default investorRouter;
