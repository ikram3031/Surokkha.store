import { Router } from "express";
import billTypeRouter from "./BillTypeRoute.js";
import paymentTypeRouter from "./PaymentTypeRoute.js";
import investorRouter from "./InvestorRoute.js";
import investmentRouter from "./InvestmentRoute.js";
import accountBalanceRouter from "./AccountBalanceRoute.js";
import billingRouter from "./BillingRoute.js";

const accountsRouter = Router();

accountsRouter.use("/bills", billingRouter);
accountsRouter.use("/billing", billingRouter);
accountsRouter.use("/bill-types", billTypeRouter);
accountsRouter.use("/payment-types", paymentTypeRouter);
accountsRouter.use("/payment-methods", paymentTypeRouter);
accountsRouter.use("/investors", investorRouter);
accountsRouter.use("/investments", investmentRouter);
accountsRouter.use("/balance", accountBalanceRouter);

export default accountsRouter;
