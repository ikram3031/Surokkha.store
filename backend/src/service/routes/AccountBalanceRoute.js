import { Router } from "express";
import { getAccountBalance } from "../controllers/AccountBalanceController.js";
import { authenticateToken, authorizeRoles, ADMINS } from "../../common/middlewares/auth.middleware.js";

const accountBalanceRouter = Router();

accountBalanceRouter.use(authenticateToken, authorizeRoles(ADMINS));

accountBalanceRouter.get("/", getAccountBalance);

export default accountBalanceRouter;
