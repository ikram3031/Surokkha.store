import { Router } from "express";
import {
  createReview,
  getProductReviews,
  listReviews,
  getReviewById,
  updateReview,
  updateReviewStatus,
  deleteReview,
  bulkUpdateReviews,
  bulkDeleteReviews,
} from "../controllers/ReviewController.js";
import {
  authenticateToken,
  authorizeRoles,
} from "../../common/middlewares/auth.middleware.js";

const reviewRouter = Router();

// Bulk admin operations
reviewRouter.post("/bulk-update", authenticateToken, authorizeRoles("Owner", "Admin", "Manager", "Super Admin"), bulkUpdateReviews);
reviewRouter.post("/bulk-delete", authenticateToken, authorizeRoles("Owner", "Admin", "Manager", "Super Admin"), bulkDeleteReviews);

// Public route to get approved reviews for a single product details page
reviewRouter.get("/product/:productDid", getProductReviews);

// Admin route to list all reviews with filters (pagination, status, product, etc)
reviewRouter.get("/", authenticateToken, authorizeRoles("Owner", "Admin", "Manager", "Super Admin"), listReviews);

// Public/Admin route to get a single review detail
// In a stricter system this might require auth, but typically single review detail might be fetched publicly if approved
reviewRouter.get("/:id", getReviewById);

// Create a review (Requires authentication as a member/user)
reviewRouter.post("/", authenticateToken, createReview);

// Update a review (Member can update own review if not approved; Admin can update any review)
reviewRouter.put("/:id", authenticateToken, updateReview);

// Dedicated route to toggle approval status (Admin only)
reviewRouter.patch("/:id/status", authenticateToken, authorizeRoles("Owner", "Admin", "Manager", "Super Admin"), updateReviewStatus);

// Delete a review (Member can delete own; Admin can delete any)
reviewRouter.delete("/:id", authenticateToken, deleteReview);

export default reviewRouter;
