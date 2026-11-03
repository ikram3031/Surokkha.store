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
import { authenticateToken, authorizeRoles, OPERATORS } from "../../common/middlewares/auth.middleware.js";

const reviewRouter = Router();

// Bulk admin operations
reviewRouter.post("/bulk-update", authenticateToken, authorizeRoles(OPERATORS), bulkUpdateReviews);
reviewRouter.post("/bulk-delete", authenticateToken, authorizeRoles(OPERATORS), bulkDeleteReviews);

// Public route to get approved reviews for a single product details page
reviewRouter.get("/product/:productDid", getProductReviews);

// Admin route to list all reviews with filters (pagination, status, product, etc)
reviewRouter.get("/", authenticateToken, authorizeRoles(OPERATORS), listReviews);

// Public/Admin route to get a single review detail
// In a stricter system this might require auth, but typically single review detail might be fetched publicly if approved
reviewRouter.get("/:id", getReviewById);

// Create a review (Requires authentication as a member/user)
reviewRouter.post("/", authenticateToken, authorizeRoles(OPERATORS), createReview);

// Update a review (Member can update own review if not approved; Admin can update any review)
reviewRouter.put("/:id", authenticateToken, authorizeRoles(OPERATORS), updateReview);

// Dedicated route to toggle approval status (Admin only)
reviewRouter.patch("/:id/status", authenticateToken, authorizeRoles(OPERATORS), updateReviewStatus);

// Delete a review (Member can delete own; Admin can delete any)
reviewRouter.delete("/:id", authenticateToken, authorizeRoles(OPERATORS), deleteReview);

export default reviewRouter;
