import { Router } from "express";
import { getDailyBillSummary, requirePlexiviaKey } from "../controllers/PlexiviaSyncController.js";

const plexiviaSyncRouter = Router();

plexiviaSyncRouter.use(requirePlexiviaKey);

plexiviaSyncRouter.get("/daily-bill-summary", getDailyBillSummary);

export default plexiviaSyncRouter;
