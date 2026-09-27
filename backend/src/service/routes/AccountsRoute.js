import { Router } from "express";
import billTypeRouter from "./BillTypeRoute.js";
import investorRouter from "./InvestorRoute.js";
import investmentRouter from "./InvestmentRoute.js";
import accountBalanceRouter from "./AccountBalanceRoute.js";

const accountsRouter = Router();

accountsRouter.use("/bill-types", billTypeRouter);
accountsRouter.use("/investors", investorRouter);
accountsRouter.use("/investments", investmentRouter);
accountsRouter.use("/balance", accountBalanceRouter);

export default accountsRouter;
