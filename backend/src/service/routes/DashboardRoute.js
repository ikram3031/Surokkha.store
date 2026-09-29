import express from 'express';
import { dailyOrders, getKpiStats, getOrderStatusDistribution } from '../controllers/DashboardController.js';

const router = express.Router();

router.get('/orders/daily', dailyOrders);
router.get('/orders/status-distribution', getOrderStatusDistribution);
router.get('/kpi', getKpiStats);

export default router;
