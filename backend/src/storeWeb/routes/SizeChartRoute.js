import express from "express";
import {
  getAllSizeCharts,
  getSizeChartByCategory,
} from "../controllers/SizeChartController.js";

const router = express.Router();

router.get("/", getAllSizeCharts);
router.get("/category/:categoryId", getSizeChartByCategory);

export default router;
