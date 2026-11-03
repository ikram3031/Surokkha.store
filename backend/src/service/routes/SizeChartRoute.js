import express from "express";
import {
  getAllSizeCharts,
  getSizeChartByCategory,
  upsertSizeChart,
  deleteSizeChart,
} from "../controllers/SizeChartController.js";
import { authenticateToken, authorizeRoles, OPERATORS } from "../../common/middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", getAllSizeCharts);
router.get("/category/:categoryId", getSizeChartByCategory);
router.post(
  "/",
  authenticateToken,
  authorizeRoles(OPERATORS),
  upsertSizeChart
);
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles(OPERATORS),
  deleteSizeChart
);

export default router;
