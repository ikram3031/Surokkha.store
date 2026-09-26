import express from "express";
import {
  getAllSizeCharts,
  getSizeChartByCategory,
  upsertSizeChart,
  deleteSizeChart,
} from "../controllers/SizeChartController.js";
import {
  authenticateToken,
  authorizeRoles,
} from "../../common/middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", getAllSizeCharts);
router.get("/category/:categoryId", getSizeChartByCategory);
router.post(
  "/",
  authenticateToken,
  authorizeRoles("Owner", "Admin", "Manager"),
  upsertSizeChart
);
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  deleteSizeChart
);

export default router;
