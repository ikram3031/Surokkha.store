import { Router } from "express";
import { getAccountBalance } from "../controllers/AccountBalanceController.js";
import { authenticateToken } from "../../common/middlewares/auth.middleware.js";

const accountBalanceRouter = Router();

accountBalanceRouter.use(authenticateToken);

accountBalanceRouter.get("/", getAccountBalance);

export default accountBalanceRouter;
