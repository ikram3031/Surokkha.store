// src/routes/BrandRoute.js
import express from "express";
import {
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand,
} from "../controllers/BrandController.js";
import { authenticateToken, authorizeRoles } from "../../common/middlewares/auth.middleware.js";

const router = express.Router();

// GET /api/v1/brands
router.get("/", getBrands);

// POST /api/v1/brands
router.post("/", authenticateToken, authorizeRoles("Owner", "Admin"), createBrand);

// PUT /api/v1/brands/:id
router.put("/:id", authenticateToken, authorizeRoles("Owner", "Admin"), updateBrand);

// DELETE /api/v1/brands/:id
router.delete("/:id", authenticateToken, authorizeRoles("Owner", "Admin"), deleteBrand);

export default router;
