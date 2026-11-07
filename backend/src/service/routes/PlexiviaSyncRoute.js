import { Router } from "express";
import {
  getDailyBillSummary,
  getDailyPaymentSummary,
  pingPlexivia,
  requirePlexiviaKey,
  plexiviaStockItems,
  plexiviaApplyReceipt,
  plexiviaCancelReceipt,
  plexiviaGetReceipt,
} from "../controllers/PlexiviaSyncController.js";

const plexiviaSyncRouter = Router();

plexiviaSyncRouter.use(requirePlexiviaKey);

plexiviaSyncRouter.get("/ping", pingPlexivia);
plexiviaSyncRouter.get("/daily-bill-summary", getDailyBillSummary);
plexiviaSyncRouter.get("/daily-payment-summary", getDailyPaymentSummary);
plexiviaSyncRouter.get("/stock-items", plexiviaStockItems);
plexiviaSyncRouter.post("/stock-receipts", plexiviaApplyReceipt);
plexiviaSyncRouter.get("/stock-receipts/:ref", plexiviaGetReceipt);
plexiviaSyncRouter.post("/stock-receipts/:ref/cancel", plexiviaCancelReceipt);

export default plexiviaSyncRouter;
