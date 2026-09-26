import { ReviewModel } from "../../common/models/review.model.js";
import { ProductModel } from "../../common/models/product.model.js";

// GET reviews for a single product
export const getProductReviews = async (req, res) => {
  try {
    const { productDid } = req.params;
    const reviews = await ReviewModel.find({
      productDid,
      status: "approved",
      active: true,
    }).sort({ createdAt: -1 }).lean();
    res.json({ status: "success", data: reviews });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Unable to retrieve reviews" });
  }
};

// GET single review by ID
export const getReviewById = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await ReviewModel.findById(id).lean();
    if (!review) {
      return res.status(404).json({ status: "error", message: "Review not found" });
    }
    res.json({ status: "success", data: review });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Unable to retrieve review" });
  }
};

// POST create a review
export const createReview = async (req, res) => {
  try {
    const { productDid, rating, comment, userName } = req.body || {};
    if (!productDid || !rating) {
      return res.status(400).json({ status: "error", message: "productDid and rating are required" });
    }

    const review = await ReviewModel.create({
      productDid,
      rating: Number(rating),
      comment: comment || "",
      userName: userName || req.user?.name || "Customer",
      userId: req.user?.userId || req.user?.id || null,
      status: "pending",
      active: true,
    });

    res.status(201).json({ status: "success", data: review, message: "Review submitted for approval" });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Unable to create review" });
  }
};

// PUT update own review
export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body || {};
    const userId = req.user?.userId || req.user?.id;

    const review = await ReviewModel.findById(id);
    if (!review) {
      return res.status(404).json({ status: "error", message: "Review not found" });
    }

    if (review.userId && String(review.userId) !== String(userId)) {
      return res.status(403).json({ status: "error", message: "You can only edit your own reviews" });
    }

    if (rating !== undefined) review.rating = Number(rating);
    if (comment !== undefined) review.comment = comment;
    review.status = "pending";
    await review.save();

    res.json({ status: "success", data: review, message: "Review updated and pending re-approval" });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Unable to update review" });
  }
};
