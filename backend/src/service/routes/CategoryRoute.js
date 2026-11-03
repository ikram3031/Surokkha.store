import express from "express";
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/CategoryController.js";
import { authenticateToken, authorizeRoles, OPERATORS } from "../../common/middlewares/auth.middleware.js";
import { upload } from "../../common/middlewares/upload.middleware.js";

const router = express.Router();

// GET /api/v1/categories -> list all categories
router.get("/", getAllCategories);

// POST /api/v1/categories -> create a new category
router.post("/", authenticateToken, authorizeRoles(OPERATORS), upload("image"), createCategory);

// GET /api/v1/categories/:id -> get single category by ObjectId
router.get("/:id", getCategoryById);

// PUT /api/v1/categories/:id -> update category by ID or slug/did
router.put("/:id", authenticateToken, authorizeRoles(OPERATORS), upload("image"), updateCategory);

// DELETE /api/v1/categories/:id -> delete category by ID or slug/did
router.delete("/:id", authenticateToken, authorizeRoles(OPERATORS), deleteCategory);

export default router;
