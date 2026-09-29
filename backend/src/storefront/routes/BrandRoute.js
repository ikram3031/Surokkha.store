import express from "express";
import { getBrands } from "../controllers/BrandController.js";
import { requireFeature } from "../../common/middlewares/feature.middleware.js";

const router = express.Router();

const guard = requireFeature("brand");

router.get("/", guard, getBrands);

export default router;
