import { Router } from "express";
import { getDailyBillSummary, getDailyPaymentSummary, pingPlexivia, requirePlexiviaKey } from "../controllers/PlexiviaSyncController.js";

const plexiviaSyncRouter = Router();

plexiviaSyncRouter.use(requirePlexiviaKey);

plexiviaSyncRouter.get("/ping", pingPlexivia);
plexiviaSyncRouter.get("/daily-bill-summary", getDailyBillSummary);
plexiviaSyncRouter.get("/daily-payment-summary", getDailyPaymentSummary);

export default plexiviaSyncRouter;
