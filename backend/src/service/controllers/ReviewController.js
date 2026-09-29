import { ReviewModel } from "../../common/models/review.model.js";
import { ProductModel } from "../../common/models/product.model.js";
import { MemberModel } from "../../common/models/member.model.js";
import { logger } from "../../common/config/logger.js";
import { USER_ROLES } from "../../common/models/user.model.js";

// Creates a new customer review for a product with duplicate prevention
export const createReview = async (req, res) => {
  try {
    const { productDid, rating, description } = req.body;
    const memberDid = req.user.did;

    if (!productDid || !rating || !description) {
      return res.status(400).json({ status: "error", message: "productDid, rating, and description are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ status: "error", message: "Rating must be between 1 and 5" });
    }

    const product = await ProductModel.findOne({
      $or: [
        { did: productDid },
        { slug: productDid },
        { _id: productDid.match(/^[0-9a-fA-F]{24}$/) ? productDid : null },
      ],
    });
    if (!product) {
      return res.status(404).json({ status: "error", message: "Product not found" });
    }

    const canonicalDid = product.did || productDid;
    const existingReview = await ReviewModel.findOne({
      productDid: canonicalDid,
      memberDid,
      active: true,
    });
    if (existingReview) {
      return res.status(409).json({ status: "error", message: "You have already reviewed this product" });
    }

    const member = await MemberModel.findOne({ did: memberDid });
    if (!member) {
      return res.status(404).json({ status: "error", message: "Member not found" });
    }

    const review = new ReviewModel({
      productDid: canonicalDid,
      productId: product._id,
      memberDid,
      memberId: member._id,
      description,
      rating,
      isApproved: false,
      createdBy: member._id,
      createdByType: "Member",
    });

    await review.save();
    return res.status(201).json({ status: "success", data: review, message: "Review submitted successfully and is pending approval." });
  } catch (err) {
    logger.error({ err }, "Failed to create review");
    return res.status(500).json({ status: "error", message: "Unable to create review" });
  }
};

// Fetches approved reviews and rating breakdown statistics for a product
export const getProductReviews = async (req, res) => {
  try {
    const { productDid } = req.params;
    const skip = parseInt(req.query.skip, 10) || 0;
    const limit = parseInt(req.query.limit, 10) || 10;

    let targetDid = productDid;
    const product = await ProductModel.findOne({
      $or: [
        { did: productDid },
        { slug: productDid },
        { _id: productDid.match(/^[0-9a-fA-F]{24}$/) ? productDid : null },
      ],
    }).select("did");

    if (product?.did) {
      targetDid = product.did;
    }

    const reviews = await ReviewModel.find({ productDid: targetDid, isApproved: true, active: true })
      .populate("memberId", "name did email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await ReviewModel.countDocuments({ productDid: targetDid, isApproved: true, active: true });

    const statsResult = await ReviewModel.aggregate([
      { $match: { productDid: targetDid, isApproved: true, active: true } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          count5: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
          count4: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
          count3: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
          count2: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
          count1: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
        },
      },
    ]);

    let stats = {
      totalReviews: total,
      averageRating: 0,
      ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };

    if (statsResult.length > 0) {
      const data = statsResult[0];
      stats.averageRating = Number(data.averageRating.toFixed(2));
      stats.ratingBreakdown = {
        5: data.count5,
        4: data.count4,
        3: data.count3,
        2: data.count2,
        1: data.count1,
      };
    }

    return res.json({
      status: "success",
      data: {
        stats,
        reviews,
        pagination: { skip, limit, total },
      },
    });
  } catch (err) {
    logger.error({ err }, "Failed to fetch product reviews");
    return res.status(500).json({ status: "error", message: "Unable to fetch product reviews" });
  }
};

// Lists all reviews with optional pagination and filtering
export const listReviews = async (req, res) => {
  try {
    const skip = parseInt(req.query.skip, 10) || 0;
    const limit = parseInt(req.query.limit, 10) || 20;
    const { isApproved, productDid, memberDid } = req.query;

    let query = { active: true };
    if (isApproved !== undefined) query.isApproved = isApproved === "true";
    if (productDid) query.productDid = productDid;
    if (memberDid) query.memberDid = memberDid;

    const reviews = await ReviewModel.find(query)
      .populate("memberId", "name email phone did")
      .populate("productId", "name slug imageUrl")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await ReviewModel.countDocuments(query);

    return res.json({ status: "success", data: reviews, pagination: { skip, limit, total } });
  } catch (err) {
    logger.error({ err }, "Failed to list reviews");
    return res.status(500).json({ status: "error", message: "Unable to list reviews" });
  }
};

// Fetches a single review by id or did
export const getReviewById = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await ReviewModel.findOne({ $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { did: id }], active: true })
      .populate("memberId", "name email did")
      .populate("productId", "name slug")
      .lean();

    if (!review) return res.status(404).json({ status: "error", message: "Review not found" });

    return res.json({ status: "success", data: review });
  } catch (err) {
    logger.error({ err }, "Failed to fetch review");
    return res.status(500).json({ status: "error", message: "Unable to fetch review" });
  }
};

// Updates review rating or content with member ownership or admin override
export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, description, isApproved } = req.body;
    
    const review = await ReviewModel.findOne({ $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { did: id }], active: true });
    if (!review) return res.status(404).json({ status: "error", message: "Review not found" });

    const userRole = typeof req.user.role === "string" ? req.user.role.toLowerCase() : "";
    const isAdmin = ["owner", "admin", "manager", "super admin"].includes(userRole);
    
    if (!isAdmin) {
      if (req.user.did !== review.memberDid) {
        return res.status(403).json({ status: "error", message: "Forbidden: You can only edit your own reviews" });
      }
      if (review.isApproved) {
        review.isApproved = false;
      }
    }

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) return res.status(400).json({ status: "error", message: "Rating must be between 1 and 5" });
      review.rating = rating;
    }
    if (description !== undefined) review.description = description;
    
    if (isAdmin && isApproved !== undefined) {
      review.isApproved = isApproved;
    }

    review.updatedBy = req.user._id || req.user.id;
    review.updatedByType = isAdmin ? "User" : "Member";

    await review.save();
    return res.json({ status: "success", data: review });
  } catch (err) {
    logger.error({ err }, "Failed to update review");
    return res.status(500).json({ status: "error", message: "Unable to update review" });
  }
};

// Toggles approval status for a single review by administrative roles
export const updateReviewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    if (isApproved === undefined) {
      return res.status(400).json({ status: "error", message: "isApproved is required" });
    }

    const review = await ReviewModel.findOne({ $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { did: id }], active: true });
    if (!review) return res.status(404).json({ status: "error", message: "Review not found" });

    review.isApproved = Boolean(isApproved);
    review.updatedBy = req.user._id || req.user.id;
    review.updatedByType = "User";

    await review.save();
    return res.json({ status: "success", data: review, message: "Review status updated successfully" });
  } catch (err) {
    logger.error({ err }, "Failed to update review status");
    return res.status(500).json({ status: "error", message: "Unable to update review status" });
  }
};

// Soft-deletes a review by member owner or administrative user
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    
    const review = await ReviewModel.findOne({ $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { did: id }], active: true });
    if (!review) return res.status(404).json({ status: "error", message: "Review not found" });

    const userRole = typeof req.user.role === "string" ? req.user.role.toLowerCase() : "";
    const isAdmin = ["owner", "admin", "manager", "super admin"].includes(userRole);
    
    if (!isAdmin && req.user.did !== review.memberDid) {
      return res.status(403).json({ status: "error", message: "Forbidden: You can only delete your own reviews" });
    }

    review.active = false;
    review.updatedBy = req.user._id || req.user.id;
    review.updatedByType = isAdmin ? "User" : "Member";
    await review.save();
    
    return res.json({ status: "success", message: "Review deleted successfully" });
  } catch (err) {
    logger.error({ err }, "Failed to delete review");
    return res.status(500).json({ status: "error", message: "Unable to delete review" });
  }
};

// Performs bulk update of review approval statuses
export const bulkUpdateReviews = async (req, res) => {
  try {
    const { ids, isApproved } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ status: "error", message: "Review IDs are required" });
    }
    
    if (isApproved === undefined) {
      return res.status(400).json({ status: "error", message: "isApproved is required for bulk update" });
    }

    const validIds = ids.map(id => id.match(/^[0-9a-fA-F]{24}$/) ? id : null).filter(Boolean);
    
    await ReviewModel.updateMany(
      { _id: { $in: validIds } },
      { $set: { isApproved: Boolean(isApproved), updatedBy: req.user._id || req.user.id, updatedByType: "User" } }
    );

    return res.json({ status: "success", message: `Successfully updated ${validIds.length} reviews` });
  } catch (err) {
    logger.error({ err }, "Failed to bulk update reviews");
    return res.status(500).json({ status: "error", message: "Unable to bulk update reviews" });
  }
};

// Performs bulk soft deletion of reviews
export const bulkDeleteReviews = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ status: "error", message: "Review IDs are required" });
    }

    const validIds = ids.map(id => id.match(/^[0-9a-fA-F]{24}$/) ? id : null).filter(Boolean);
    
    await ReviewModel.updateMany(
      { _id: { $in: validIds } },
      { $set: { active: false, updatedBy: req.user._id || req.user.id, updatedByType: "User" } }
    );

    return res.json({ status: "success", message: `Successfully deleted ${validIds.length} reviews` });
  } catch (err) {
    logger.error({ err }, "Failed to bulk delete reviews");
    return res.status(500).json({ status: "error", message: "Unable to bulk delete reviews" });
  }
};
