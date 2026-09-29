import express from "express";
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/CategoryController.js";
import { authenticateToken, authorizeRoles } from "../../common/middlewares/auth.middleware.js";

const router = express.Router();

// GET /api/v1/categories -> list all categories
router.get("/", getAllCategories);

// POST /api/v1/categories -> create a new category
router.post("/", authenticateToken, authorizeRoles("Owner", "Admin"), createCategory);

// GET /api/v1/categories/:id -> get single category by ObjectId
router.get("/:id", getCategoryById);

// PUT /api/v1/categories/:id -> update category by ID or slug/did
router.put("/:id", authenticateToken, authorizeRoles("Owner", "Admin"), updateCategory);

// DELETE /api/v1/categories/:id -> delete category by ID or slug/did
router.delete("/:id", authenticateToken, authorizeRoles("Owner", "Admin"), deleteCategory);

export default router;
