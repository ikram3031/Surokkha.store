import { Router } from "express";
import { getProductFunnel, getProductDetail, getLiveActivity, getProductTrend, getVisitorDetail } from "../controllers/ProductAnalyticsController.js";
import { authenticateToken, authorizeRoles, OPERATORS } from "../../common/middlewares/auth.middleware.js";

const router = Router();

// Dashboard only (Owner, Admin, Manager, Super Admin)
const adminAuth = [authenticateToken, authorizeRoles(OPERATORS)];

router.get("/", ...adminAuth, getProductFunnel);
router.get("/live", ...adminAuth, getLiveActivity);
router.get("/trend", ...adminAuth, getProductTrend);
router.get("/visitor/:visitorId", ...adminAuth, getVisitorDetail);
router.get("/:productKey", ...adminAuth, getProductDetail);

export default router;
