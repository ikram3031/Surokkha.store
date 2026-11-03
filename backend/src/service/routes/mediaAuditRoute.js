import { Router } from "express";
import {
  getMediaAuditSummary,
  getOrphanCandidates,
  triggerOrphanScan,
  triggerR2Sync,
  whitelistOrphanFiles,
  confirmDeleteOrphanFiles,
} from "../controllers/MediaAuditController.js";
import { authenticateToken, authorizeRoles, OWNER_ONLY, ADMINS } from "../../common/middlewares/auth.middleware.js";

const mediaAuditRouter = Router();

// Protect all admin media audit routes to Owner and Admin roles only
mediaAuditRouter.use(authenticateToken, authorizeRoles(ADMINS));

// High-level storage stats, orphan counts, and R2 sync status
mediaAuditRouter.get("/summary", getMediaAuditSummary);

// Paginated list of orphan image candidates with search and filtering
mediaAuditRouter.get("/orphans", getOrphanCandidates);

// On-demand trigger for filesystem vs DB orphan scan
mediaAuditRouter.post("/scan", triggerOrphanScan);

// On-demand trigger for Cloudflare R2 synchronization
mediaAuditRouter.post("/r2-sync", triggerR2Sync);

// Whitelist protected files from future deletion
mediaAuditRouter.post("/whitelist", whitelistOrphanFiles);

// Confirm and permanently delete orphan files from VPS disk
mediaAuditRouter.delete("/confirm", authorizeRoles(OWNER_ONLY), confirmDeleteOrphanFiles);

export default mediaAuditRouter;
