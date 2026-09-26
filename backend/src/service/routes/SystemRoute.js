import { Router } from "express";
import { getSystemInfo, getMetadata, getHealthCheck, purgeSystemCache, getCloudflareAnalytics } from "../controllers/SystemController.js";
import { authenticateToken, authorizeRoles } from "../../common/middlewares/auth.middleware.js";

const systemRouter = Router();

// Public health check endpoint for uptime and fleet monitoring
systemRouter.get("/health", getHealthCheck);

// Protected endpoint for retrieving system & version information
systemRouter.get(
  "/info",
  authenticateToken,
  authorizeRoles("Owner", "Admin", "Manager", "Super Admin"),
  getSystemInfo
);

// Public utility endpoint for retrieving metadata (order/payment statuses, categories)
systemRouter.get("/metadata", getMetadata);

// Protected endpoint for retrieving real-time Cloudflare Edge Analytics
systemRouter.get(
  "/cloudflare-analytics",
  authenticateToken,
  authorizeRoles("Owner", "Admin", "Manager", "Super Admin"),
  getCloudflareAnalytics
);

// Protected endpoint for flushing Cloudflare Edge & System Cache
systemRouter.post(
  "/purge-cache",
  authenticateToken,
  authorizeRoles("Owner", "Admin", "Manager", "Super Admin"),
  purgeSystemCache
);

export default systemRouter;
