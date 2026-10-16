import express from 'express';
import { dailyOrders, getKpiStats, getOrderStatusDistribution, getTopProducts } from '../controllers/DashboardController.js';

const router = express.Router();

router.get('/orders/daily', dailyOrders);
router.get('/orders/status-distribution', getOrderStatusDistribution);
router.get('/kpi', getKpiStats);
router.get('/products/top', getTopProducts);

export default router;
