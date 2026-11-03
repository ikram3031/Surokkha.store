import { Router } from "express";
import {
  createReview,
  getProductReviews,
  getReviewById,
  updateReview,
} from "../controllers/ReviewController.js";
import { authenticateMember } from "../../common/middlewares/auth.middleware.js";

const reviewRouter = Router();

// Public route to get approved reviews for a single product
reviewRouter.get("/product/:productDid", getProductReviews);

// Public/Member route to get a single review detail
reviewRouter.get("/:id", getReviewById);

// Create a review (Requires authenticated member/customer)
reviewRouter.post("/", authenticateMember, createReview);

// Update a review (Member can update own review if permitted)
reviewRouter.put("/:id", authenticateMember, updateReview);

export default reviewRouter;
