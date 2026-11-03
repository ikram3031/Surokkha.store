import { Router } from "express";
import { authenticateToken, authorizeRoles, MANAGERS } from "../../common/middlewares/auth.middleware.js";
import {
  getSummaryReport,
  getSalesTimeline,
  getTopProductsReport,
  getPaymentReport,
  getInventoryReport
} from "../controllers/ReportsController.js";

const reportsRouter = Router();

reportsRouter.use(authenticateToken);
reportsRouter.use(authorizeRoles(MANAGERS));

reportsRouter.get("/summary", getSummaryReport);
reportsRouter.get("/sales-timeline", getSalesTimeline);
reportsRouter.get("/top-products", getTopProductsReport);
reportsRouter.get("/payment-methods", getPaymentReport);
reportsRouter.get("/inventory", getInventoryReport);

export default reportsRouter;
