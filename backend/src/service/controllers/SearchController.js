import { ProductModel } from "../../common/models/product.model.js";
import { CategoryModel } from "../../common/models/category.model.js";
import { BrandModel } from "../../common/models/brand.model.js";
import { RecentSearchModel } from "../../common/models/recentSearch.model.js";
import { PopularSearchModel } from "../../common/models/popularSearch.model.js";

// Performs product search and asynchronously tracks search analytics
export const searchProducts = async (req, res, next) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) {
      res.json({ data: [] });
      return;
    }

    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "12", 10)));
    const regex = { $regex: q, $options: "i" };

    const [matchingBrands, matchingCategories] = await Promise.all([
      BrandModel.find({ name: regex }).select("did name slug").lean(),
      CategoryModel.find({ name: regex }).select("_id did name slug").lean(),
    ]);

    const matchingBrandDids = matchingBrands.map((b) => b.did).filter(Boolean);
    const matchingCategoryIds = matchingCategories.map((c) => c._id);

    const searchClauses = [
      { name: regex },
      { slug: regex },
      { description: regex },
    ];

    if (matchingBrandDids.length > 0) {
      searchClauses.push({ brand: { $in: matchingBrandDids } });
    }
    if (matchingCategoryIds.length > 0) {
      searchClauses.push({ categories: { $in: matchingCategoryIds } });
    }

    const docs = await ProductModel.find({ $or: searchClauses, isActive: { $ne: false } })
      .limit(limit)
      .populate("categories", "name slug did imageUrl")
      .lean();

    const allBrandDids = [...new Set(docs.flatMap((d) => (Array.isArray(d.brand) ? d.brand : [d.brand]).filter(Boolean)))];
    const brandDocs = allBrandDids.length > 0
      ? await BrandModel.find({ did: { $in: allBrandDids } }).select("did name").lean()
      : [];
    const brandMap = new Map(brandDocs.map((b) => [b.did, b.name]));

    const results = docs.map((p) => {
      const firstCat = Array.isArray(p.categories) && p.categories.length > 0 ? p.categories[0] : null;
      const category = firstCat ? (firstCat.name || firstCat.slug || null) : null;
      const categoryDid = firstCat?.did || null;
      
      const pBrandDids = Array.isArray(p.brand) ? p.brand : (p.brand ? [p.brand] : []);
      const brand = pBrandDids.map((did) => brandMap.get(did)).filter(Boolean)[0] || null;

      const rawImage = p.thumbnailUrl || p.imageUrl || (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null);
      const fullUrl = rawImage
        ? (rawImage.startsWith("http") ? rawImage : `https://server.decantrebd.com${rawImage.startsWith("/") ? "" : "/"}${rawImage}`)
        : null;

      return {
        id: p._id?.toString?.() ?? p.id,
        name: p.name,
        slug: p.slug,
        category,
        categoryDid,
        categories: p.categories || [],
        brand,
        imageUrl: fullUrl,
        thumbnailUrl: fullUrl,
        image: fullUrl,
        price: p.type === "variant" && Array.isArray(p.variants) && p.variants.length > 0
          ? (p.variants[0].offerPrice || p.variants[0].price)
          : (p.offerPrice || p.price || null),
      };
    });

    res.json({ data: results });

    trackSearchAsync(req, q);
  } catch (err) {
    next(err);
  }
};

// Asynchronously logs search terms for popular rankings and recent user history
const trackSearchAsync = async (req, searchString) => {
  try {
    const cleanTerm = searchString.trim().toLowerCase();
    if (!cleanTerm || cleanTerm.length < 2) return;

    await PopularSearchModel.findOneAndUpdate(
      { keyword: cleanTerm },
      { $inc: { count: 1 }, $set: { updatedAt: new Date() } },
      { upsert: true, new: true }
    );

    const userId = req.user?.id || req.user?.userId || req.user?._id;
    if (userId) {
      await RecentSearchModel.deleteMany({ userId, query: cleanTerm });
      await RecentSearchModel.create({ userId, query: cleanTerm, searchedAt: new Date() });

      const userSearches = await RecentSearchModel.find({ userId }).sort({ searchedAt: -1 }).select("_id").lean();
      if (userSearches.length > 10) {
        const idsToRemove = userSearches.slice(10).map((doc) => doc._id);
        await RecentSearchModel.deleteMany({ _id: { $in: idsToRemove } });
      }
    }
  } catch (err) {
    console.error("Search tracking error:", err);
  }
};

// Fetches recent search history for the authenticated user
export const getRecentSearches = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.userId || req.user?._id;
    if (!userId) {
      res.json({ data: [] });
      return;
    }

    const items = await RecentSearchModel.find({ userId })
      .sort({ searchedAt: -1 })
      .limit(10)
      .select("query searchedAt")
      .lean();

    const data = items.map((item) => ({
      id: item._id,
      query: item.query,
      searchedAt: item.searchedAt,
    }));

    res.json({ data });
  } catch (err) {
    next(err);
  }
};

// Clears all or specific recent search items for the authenticated user
export const clearRecentSearches = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.userId || req.user?._id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const queryToDelete = req.query.q ? String(req.query.q).trim().toLowerCase() : null;
    if (queryToDelete) {
      await RecentSearchModel.deleteMany({ userId, query: queryToDelete });
    } else {
      await RecentSearchModel.deleteMany({ userId });
    }

    res.json({ success: true, message: "Recent search history cleared" });
  } catch (err) {
    next(err);
  }
};

// Fetches top popular search keywords globally
export const getPopularSearches = async (req, res, next) => {
  try {
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit || "8", 10)));
    const items = await PopularSearchModel.find({})
      .sort({ count: -1, updatedAt: -1 })
      .limit(limit)
      .select("keyword count")
      .lean();

    const data = items.map((item) => ({
      keyword: item.keyword,
      count: item.count,
    }));

    res.json({ data });
  } catch (err) {
    next(err);
  }
};
