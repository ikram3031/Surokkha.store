import express from 'express';
import { dailyOrders, getKpiStats, getOrderStatusDistribution, getTopProducts, getSoldCounts } from '../controllers/DashboardController.js';
import { authenticateToken, authorizeRoles, ALL_STAFF } from "../../common/middlewares/auth.middleware.js";

const router = express.Router();

const staffOnly = [authenticateToken, authorizeRoles(ALL_STAFF)];

router.get('/orders/daily', ...staffOnly, dailyOrders);
router.get('/orders/status-distribution', ...staffOnly, getOrderStatusDistribution);
router.get('/kpi', ...staffOnly, getKpiStats);
router.get('/products/top', ...staffOnly, getTopProducts);
router.get('/products/sold-counts', ...staffOnly, getSoldCounts);

export default router;
