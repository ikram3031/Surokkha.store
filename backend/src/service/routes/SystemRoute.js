import { Router } from "express";
import { getSystemInfo, getMetadata, getHealthCheck, purgeSystemCache, getCloudflareAnalytics } from "../controllers/SystemController.js";
import { authenticateToken, authorizeRoles, MANAGERS, OPERATORS } from "../../common/middlewares/auth.middleware.js";

const systemRouter = Router();

// Public health check endpoint for uptime and fleet monitoring
systemRouter.get("/health", getHealthCheck);

// Protected endpoint for retrieving system & version information
systemRouter.get(
  "/info",
  authenticateToken,
  authorizeRoles(MANAGERS),
  getSystemInfo
);

// Public utility endpoint for retrieving metadata (order/payment statuses, categories)
systemRouter.get("/metadata", getMetadata);

// Protected endpoint for retrieving real-time Cloudflare Edge Analytics
systemRouter.get(
  "/cloudflare-analytics",
  authenticateToken,
  authorizeRoles(OPERATORS),
  getCloudflareAnalytics
);

// Protected endpoint for flushing Cloudflare Edge & System Cache
systemRouter.post(
  "/purge-cache",
  authenticateToken,
  authorizeRoles(OPERATORS),
  purgeSystemCache
);

export default systemRouter;
