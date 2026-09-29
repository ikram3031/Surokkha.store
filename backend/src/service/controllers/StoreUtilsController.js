import { Types } from "mongoose";
import { StoreUtilsModel } from "../../common/models/storeUtils.model.js";
import { ProductModel } from "../../common/models/product.model.js";
import { serializeProduct } from "../../common/utils/productUtils.js";

/**
 * READ: Retrieves the store utility showcases (featured and best seller products).
 * Path: GET /api/v1/store-utils
 */
export const getStoreUtils = async (req, res, next) => {
  try {
    let storeUtils = await StoreUtilsModel.findOne({ key: "default" })
      .populate({
        path: "featured",
        match: {
          isActive: true,
          stockStatus: { $nin: ["outofstock", "out_of_stock"] },
        },
        populate: { path: "categories" },
      })
      .populate({
        path: "bestSeller",
        match: {
          isActive: true,
          stockStatus: { $nin: ["outofstock", "out_of_stock"] },
        },
        populate: { path: "categories" },
      })
      .populate({
        path: "onSale",
        match: {
          isActive: true,
          stockStatus: { $nin: ["outofstock", "out_of_stock"] },
        },
        populate: { path: "categories" },
      })
      .lean();

    if (!storeUtils) {
      storeUtils = await StoreUtilsModel.create({
        key: "default",
        featured: [],
        bestSeller: [],
        onSale: [],
      });
      storeUtils = storeUtils.toObject ? storeUtils.toObject() : storeUtils;
    }

    const isAvailableProduct = (p) => {
      if (!p || typeof p !== "object") return false;
      if (p.isActive === false) return false;
      if (p.stockStatus === "outofstock" || p.stockStatus === "out_of_stock") return false;
      return true;
    };

    let featuredList = Array.isArray(storeUtils.featured) ? storeUtils.featured.filter(isAvailableProduct) : [];
    if (featuredList.length === 0) {
      const taggedFeatured = await ProductModel.find({
        isActive: true,
        stockStatus: { $nin: ["outofstock", "out_of_stock"] },
        $or: [
          { tags: "featured" },
          { tags: "Featured" },
          { tags: { $regex: /^featured$/i } },
        ],
      })
        .populate("categories")
        .limit(30)
        .lean();

      if (taggedFeatured.length > 0) {
        featuredList = taggedFeatured;
        await StoreUtilsModel.updateOne(
          { key: "default" },
          { $set: { featured: taggedFeatured.map((p) => p._id) } }
        );
      }
    }

    let bestSellerList = Array.isArray(storeUtils.bestSeller) ? storeUtils.bestSeller.filter(isAvailableProduct) : [];
    if (bestSellerList.length === 0) {
      const taggedBestSeller = await ProductModel.find({
        isActive: true,
        stockStatus: { $nin: ["outofstock", "out_of_stock"] },
        $or: [
          { tags: "best-seller" },
          { tags: "bestseller" },
          { tags: "Best Seller" },
          { tags: { $regex: /^best-?seller$/i } },
        ],
      })
        .populate("categories")
        .limit(30)
        .lean();

      if (taggedBestSeller.length > 0) {
        bestSellerList = taggedBestSeller;
        await StoreUtilsModel.updateOne(
          { key: "default" },
          { $set: { bestSeller: taggedBestSeller.map((p) => p._id) } }
        );
      }
    }

    let onSaleList = Array.isArray(storeUtils.onSale) ? storeUtils.onSale.filter(isAvailableProduct) : [];
    if (onSaleList.length === 0) {
      const taggedOnSale = await ProductModel.find({
        isActive: true,
        stockStatus: { $nin: ["outofstock", "out_of_stock"] },
        $or: [
          { salePrice: { $gt: 0 } },
          { offerPrice: { $gt: 0 } },
          { tags: "sale" },
          { tags: "on-sale" },
          { tags: "Sale" },
          { tags: { $regex: /^on-?sale$/i } },
        ],
      })
        .populate("categories")
        .limit(30)
        .lean();

      if (taggedOnSale.length > 0) {
        onSaleList = taggedOnSale;
        await StoreUtilsModel.updateOne(
          { key: "default" },
          { $set: { onSale: taggedOnSale.map((p) => p._id) } }
        );
      }
    }

    const featuredProducts = featuredList.filter(isAvailableProduct).map(serializeProduct);
    const bestSellerProducts = bestSellerList.filter(isAvailableProduct).map(serializeProduct);
    const onSaleProducts = onSaleList.filter(isAvailableProduct).map(serializeProduct);

    res.json({
      status: "success",
      data: {
        featured: featuredProducts,
        bestSeller: bestSellerProducts,
        onSale: onSaleProducts,
        updatedAt: storeUtils.updatedAt || null,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * UPDATE: Updates the store utility showcases with arrays of Product ObjectIDs.
 * Path: PUT /api/v1/store-utils
 */
export const updateStoreUtils = async (req, res, next) => {
  try {
    const body = req.body || {};
    const updateData = {};

    // Validate and sanitize featured product ObjectIDs (support ObjectId, id, and did)
    if (body.featured !== undefined) {
      const rawFeatured = Array.isArray(body.featured)
        ? body.featured
        : [body.featured];

      const resolvedFeaturedIds = [];
      for (const item of rawFeatured) {
        const val = typeof item === "object" && item !== null ? item.id || item._id || item.did : item;
        if (!val) continue;

        if (Types.ObjectId.isValid(val)) {
          resolvedFeaturedIds.push(new Types.ObjectId(val));
        } else if (typeof val === "string") {
          const pDoc = await ProductModel.findOne({ did: val.trim() }).select("_id").lean();
          if (pDoc?._id) {
            resolvedFeaturedIds.push(pDoc._id);
          }
        }
      }

      updateData.featured = resolvedFeaturedIds;
    }

    // Validate and sanitize bestSeller product ObjectIDs (support ObjectId, id, and did)
    if (body.bestSeller !== undefined || body.best_seller !== undefined) {
      const rawBestSeller =
        body.bestSeller !== undefined ? body.bestSeller : body.best_seller;
      const rawBestSellerArr = Array.isArray(rawBestSeller)
        ? rawBestSeller
        : [rawBestSeller];

      const resolvedBestSellerIds = [];
      for (const item of rawBestSellerArr) {
        const val = typeof item === "object" && item !== null ? item.id || item._id || item.did : item;
        if (!val) continue;

        if (Types.ObjectId.isValid(val)) {
          resolvedBestSellerIds.push(new Types.ObjectId(val));
        } else if (typeof val === "string") {
          const pDoc = await ProductModel.findOne({ did: val.trim() }).select("_id").lean();
          if (pDoc?._id) {
            resolvedBestSellerIds.push(pDoc._id);
          }
        }
      }

      updateData.bestSeller = resolvedBestSellerIds;
    }

    if (body.onSale !== undefined || body.on_sale !== undefined) {
      const rawOnSale =
        body.onSale !== undefined ? body.onSale : body.on_sale;
      const rawOnSaleArr = Array.isArray(rawOnSale)
        ? rawOnSale
        : [rawOnSale];

      const resolvedOnSaleIds = [];
      for (const item of rawOnSaleArr) {
        const val = typeof item === "object" && item !== null ? item.id || item._id || item.did : item;
        if (!val) continue;

        if (Types.ObjectId.isValid(val)) {
          resolvedOnSaleIds.push(new Types.ObjectId(val));
        } else if (typeof val === "string") {
          const pDoc = await ProductModel.findOne({ did: val.trim() }).select("_id").lean();
          if (pDoc?._id) {
            resolvedOnSaleIds.push(pDoc._id);
          }
        }
      }

      updateData.onSale = resolvedOnSaleIds;
    }

    if (req.user?.userId || req.user?.id) {
      updateData.updatedBy = req.user.userId || req.user.id;
    }

    const updatedDoc = await StoreUtilsModel.findOneAndUpdate(
      { key: "default" },
      { $set: updateData },
      { new: true, upsert: true }
    )
      .populate({
        path: "featured",
        match: {
          isActive: true,
          stockStatus: { $nin: ["outofstock", "out_of_stock"] },
        },
        populate: { path: "categories" },
      })
      .populate({
        path: "bestSeller",
        match: {
          isActive: true,
          stockStatus: { $nin: ["outofstock", "out_of_stock"] },
        },
        populate: { path: "categories" },
      })
      .populate({
        path: "onSale",
        match: {
          isActive: true,
          stockStatus: { $nin: ["outofstock", "out_of_stock"] },
        },
        populate: { path: "categories" },
      })
      .lean();

    const isAvailableProduct = (p) => {
      if (!p || typeof p !== "object") return false;
      if (p.isActive === false) return false;
      if (p.stockStatus === "outofstock" || p.stockStatus === "out_of_stock") return false;
      return true;
    };

    const featuredProducts = Array.isArray(updatedDoc.featured)
      ? updatedDoc.featured.filter(isAvailableProduct).map(serializeProduct)
      : [];

    const bestSellerProducts = Array.isArray(updatedDoc.bestSeller)
      ? updatedDoc.bestSeller.filter(isAvailableProduct).map(serializeProduct)
      : [];

    const onSaleProducts = Array.isArray(updatedDoc.onSale)
      ? updatedDoc.onSale.filter(isAvailableProduct).map(serializeProduct)
      : [];

    res.json({
      status: "success",
      message: "Store utilities updated successfully",
      data: {
        featured: featuredProducts,
        bestSeller: bestSellerProducts,
        onSale: onSaleProducts,
        updatedAt: updatedDoc.updatedAt || null,
      },
    });
  } catch (err) {
    next(err);
  }
};
