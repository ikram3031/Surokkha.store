import { Router } from "express";
import {
  createInvestor,
  deleteInvestor,
  getInvestorById,
  listInvestors,
  updateInvestor,
} from "../controllers/InvestorController.js";
import { authenticateToken } from "../../common/middlewares/auth.middleware.js";

const investorRouter = Router();

investorRouter.use(authenticateToken);

investorRouter.post("/", createInvestor);
investorRouter.get("/", listInvestors);
investorRouter.get("/:id", getInvestorById);
investorRouter.put("/:id", updateInvestor);
investorRouter.delete("/:id", deleteInvestor);

export default investorRouter;
