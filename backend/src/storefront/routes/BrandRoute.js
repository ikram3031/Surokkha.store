import express from "express";
import { getBrands } from "../controllers/BrandController.js";
import { requireFeature } from "../../common/middlewares/feature.middleware.js";

const router = express.Router();

router.use(requireFeature("brand"));

router.get("/", getBrands);

export default router;
