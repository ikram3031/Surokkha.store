import { ProductModel } from "../../common/models/product.model.js";
import { RecentSearchModel } from "../../common/models/recentSearch.model.js";
import { PopularSearchModel } from "../../common/models/popularSearch.model.js";
import { serializeProduct } from "../../common/utils/productUtils.js";

// Search products
export const searchProducts = async (req, res, next) => {
  try {
    const query = String(req.query.q || req.query.query || "").trim();
    const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 50);

    if (!query) {
      return res.json({ status: "success", data: [] });
    }

    const regex = new RegExp(query, "i");
    const products = await ProductModel.find({
      isActive: true,
      $or: [
        { name: regex },
        { description: regex },
        { tags: regex },
        { "categories.name": regex },
      ],
    })
      .limit(limit)
      .populate("categories")
      .lean();

    // Increment popular search counter asynchronously
    PopularSearchModel.findOneAndUpdate(
      { term: query.toLowerCase() },
      { $inc: { count: 1 }, $set: { lastSearchedAt: new Date() } },
      { upsert: true }
    ).catch(() => {});

    return res.json({ status: "success", data: products.map(serializeProduct) });
  } catch (err) {
    next(err);
  }
};

// Get popular searches
export const getPopularSearches = async (req, res, next) => {
  try {
    const popular = await PopularSearchModel.find()
      .sort({ count: -1 })
      .limit(10)
      .lean();
    return res.json({ status: "success", data: popular.map((p) => p.term) });
  } catch (err) {
    next(err);
  }
};

// Get recent searches
export const getRecentSearches = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.json({ status: "success", data: [] });
    }
    const recent = await RecentSearchModel.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    return res.json({ status: "success", data: recent.map((r) => r.query) });
  } catch (err) {
    next(err);
  }
};
