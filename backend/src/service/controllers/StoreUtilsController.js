import { Types } from "mongoose";
import { StoreUtilsModel } from "../../common/models/storeUtils.model.js";
import { ProductModel } from "../../common/models/product.model.js";
import { ItemModel } from "../../common/models/item.model.js";
import { serializeProduct } from "../../common/utils/productUtils.js";

const AVAILABLE_MATCH = {
  isActive: true,
  stockStatus: { $nin: ["outofstock", "out_of_stock"] },
};

/**
 * Showcase arrays hold ObjectIds that may point to either a Product or an Item.
 * Loads both collections, keeps only active in-stock docs, and preserves the saved order.
 */
const resolveShowcase = async (ids) => {
  const idList = (Array.isArray(ids) ? ids : []).map((id) => String(id?._id || id)).filter(Boolean);
  if (idList.length === 0) return [];

  const match = { _id: { $in: idList }, ...AVAILABLE_MATCH };
  const [products, items] = await Promise.all([
    ProductModel.find(match).populate("categories").lean(),
    ItemModel.find(match).populate("categories").lean(),
  ]);

  const byId = new Map();
  products.forEach((p) => byId.set(String(p._id), serializeProduct(p)));
  items.forEach((i) => byId.set(String(i._id), serializeProduct(i, "en", "item")));

  return idList.map((id) => byId.get(id)).filter(Boolean);
};

// Falls back to tag-matched products when a showcase is empty, and saves them as the new list
const tagFallback = async (field, orConditions) => {
  const tagged = await ProductModel.find({ ...AVAILABLE_MATCH, $or: orConditions })
    .populate("categories")
    .limit(30)
    .lean();

  if (tagged.length > 0) {
    await StoreUtilsModel.updateOne(
      { key: "default" },
      { $set: { [field]: tagged.map((p) => p._id) } }
    );
  }
  return tagged.map((p) => serializeProduct(p));
};

/**
 * READ: Retrieves the store utility showcases (featured, best seller and on-sale).
 * Path: GET /api/v1/store-utils
 */
export const getStoreUtils = async (req, res, next) => {
  try {
    let storeUtils = await StoreUtilsModel.findOne({ key: "default" }).lean();

    if (!storeUtils) {
      const created = await StoreUtilsModel.create({
        key: "default",
        featured: [],
        bestSeller: [],
        onSale: [],
      });
      storeUtils = created.toObject();
    }

    let featured = await resolveShowcase(storeUtils.featured);
    if (featured.length === 0) {
      featured = await tagFallback("featured", [
        { tags: "featured" },
        { tags: "Featured" },
        { tags: { $regex: /^featured$/i } },
      ]);
    }

    let bestSeller = await resolveShowcase(storeUtils.bestSeller);
    if (bestSeller.length === 0) {
      bestSeller = await tagFallback("bestSeller", [
        { tags: "best-seller" },
        { tags: "bestseller" },
        { tags: "Best Seller" },
        { tags: { $regex: /^best-?seller$/i } },
      ]);
    }

    let onSale = await resolveShowcase(storeUtils.onSale);
    if (onSale.length === 0) {
      onSale = await tagFallback("onSale", [
        { salePrice: { $gt: 0 } },
        { offerPrice: { $gt: 0 } },
        { tags: "sale" },
        { tags: "on-sale" },
        { tags: "Sale" },
        { tags: { $regex: /^on-?sale$/i } },
      ]);
    }

    res.json({
      status: "success",
      data: {
        featured,
        bestSeller,
        onSale,
        updatedAt: storeUtils.updatedAt || null,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Accepts ObjectIds, objects with id/_id/did, or bare did strings (looked up in Products, then Items)
const resolveIds = async (raw) => {
  const arr = Array.isArray(raw) ? raw : [raw];
  const resolved = [];
  for (const entry of arr) {
    const val = typeof entry === "object" && entry !== null ? entry.id || entry._id || entry.did : entry;
    if (!val) continue;

    if (Types.ObjectId.isValid(val)) {
      resolved.push(new Types.ObjectId(val));
    } else if (typeof val === "string") {
      const did = val.trim();
      const doc =
        (await ProductModel.findOne({ did }).select("_id").lean()) ||
        (await ItemModel.findOne({ did }).select("_id").lean());
      if (doc?._id) resolved.push(doc._id);
    }
  }
  return resolved;
};

/**
 * UPDATE: Updates the store utility showcases with arrays of Product or Item ObjectIDs.
 * Path: PUT /api/v1/store-utils
 */
export const updateStoreUtils = async (req, res, next) => {
  try {
    const body = req.body || {};
    const updateData = {};

    if (body.featured !== undefined) {
      updateData.featured = await resolveIds(body.featured);
    }
    if (body.bestSeller !== undefined || body.best_seller !== undefined) {
      updateData.bestSeller = await resolveIds(body.bestSeller !== undefined ? body.bestSeller : body.best_seller);
    }
    if (body.onSale !== undefined || body.on_sale !== undefined) {
      updateData.onSale = await resolveIds(body.onSale !== undefined ? body.onSale : body.on_sale);
    }

    if (req.user?.userId || req.user?.id) {
      updateData.updatedBy = req.user.userId || req.user.id;
    }

    const updatedDoc = await StoreUtilsModel.findOneAndUpdate(
      { key: "default" },
      { $set: updateData },
      { new: true, upsert: true }
    ).lean();

    const [featured, bestSeller, onSale] = await Promise.all([
      resolveShowcase(updatedDoc.featured),
      resolveShowcase(updatedDoc.bestSeller),
      resolveShowcase(updatedDoc.onSale),
    ]);

    res.json({
      status: "success",
      message: "Store utilities updated successfully",
      data: {
        featured,
        bestSeller,
        onSale,
        updatedAt: updatedDoc.updatedAt || null,
      },
    });
  } catch (err) {
    next(err);
  }
};
