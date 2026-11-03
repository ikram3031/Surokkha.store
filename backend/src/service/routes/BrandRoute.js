// src/routes/BrandRoute.js
import express from "express";
import {
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand,
} from "../controllers/BrandController.js";
import { authenticateToken, authorizeRoles, OPERATORS } from "../../common/middlewares/auth.middleware.js";
import { requireFeature } from "../../common/middlewares/feature.middleware.js";

const router = express.Router();

const guard = requireFeature("brand");

// GET /api/v1/brands
router.get("/", guard, getBrands);

// POST /api/v1/brands
router.post("/", guard, authenticateToken, authorizeRoles(OPERATORS), createBrand);

// PUT /api/v1/brands/:id
router.put("/:id", guard, authenticateToken, authorizeRoles(OPERATORS), updateBrand);

// DELETE /api/v1/brands/:id
router.delete("/:id", guard, authenticateToken, authorizeRoles(OPERATORS), deleteBrand);

export default router;
