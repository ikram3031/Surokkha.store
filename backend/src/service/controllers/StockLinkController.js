import mongoose from "mongoose";
import { ProductModel } from "../../common/models/product.model.js";
import { ItemModel } from "../../common/models/item.model.js";
import { StockItemModel } from "../../common/models/stockItem.model.js";
import { toExtraStock, toStockItemId, toStockQty } from "../../common/services/stock.service.js";

// Links catalog products/items (and their variants) to the inventory pieces they sell

const modelFor = (entity) => (entity === "item" ? ItemModel : ProductModel);
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const hasLink = (src) => !!src?.stockItem || (src?.extraStock || []).some((l) => l?.stockItem);
const isLinked = (d) => (d.type === "variant" ? (d.variants || []).some(hasLink) : hasLink(d));
const extraView = (list, byId) => (list || []).filter((l) => l?.stockItem).map((l) => ({ stockItem: pieceView(l.stockItem, byId), stockQty: l.stockQty || 1 }));

const pieceView = (id, byId) => {
  if (!id) return null;
  const s = byId.get(String(id));
  return s ? { id: String(s._id), shortName: s.shortName, name: s.name, unit: s.unit, quantity: Number(s.quantity) || 0 } : { id: String(id), shortName: "?", name: "Removed item", unit: "pcs", quantity: 0 };
};

// GET /stock-items/catalog?entity=product|item&search=&link=all|linked|unlinked
export const listStockLinks = async (req, res, next) => {
  try {
    const entity = req.query.entity === "item" ? "item" : "product";
    const search = String(req.query.search || "").trim();
    const link = String(req.query.link || "all");
    const filter = { type: { $in: ["simple", "variant"] } };
    if (search) filter.name = new RegExp(escapeRegex(search), "i");

    let docs = await modelFor(entity)
      .find(filter)
      .select("name type imageUrl thumbnailUrl isActive stockStatus price offerPrice stockItem stockQty extraStock variants.size variants.price variants.offerPrice variants.stockItem variants.stockQty variants.extraStock")
      .sort({ name: 1 })
      .lean();
    if (link === "linked") docs = docs.filter(isLinked);
    else if (link === "unlinked") docs = docs.filter((d) => !isLinked(d));

    const ids = new Set();
    for (const d of docs) {
      for (const src of [d, ...(d.variants || [])]) {
        if (src.stockItem) ids.add(String(src.stockItem));
        for (const l of src.extraStock || []) if (l?.stockItem) ids.add(String(l.stockItem));
      }
    }
    const pieces = await StockItemModel.find({ _id: { $in: [...ids] } }).select("shortName name unit quantity").lean();
    const byId = new Map(pieces.map((p) => [String(p._id), p]));

    const rows = docs.map((d) => ({
      id: String(d._id),
      entity,
      name: d.name,
      type: d.type,
      image: d.thumbnailUrl || d.imageUrl || "",
      isActive: d.isActive !== false,
      stockStatus: d.stockStatus,
      price: d.offerPrice ?? d.price ?? null,
      stockItem: d.type === "variant" ? null : pieceView(d.stockItem, byId),
      stockQty: d.stockQty || 1,
      extraStock: d.type === "variant" ? [] : extraView(d.extraStock, byId),
      variants: d.type === "variant" ? (d.variants || []).map((v) => ({ size: v.size, price: v.offerPrice ?? v.price, stockItem: pieceView(v.stockItem, byId), stockQty: v.stockQty || 1, extraStock: extraView(v.extraStock, byId) })) : [],
    }));
    const summary = { total: rows.length, linked: docs.filter(isLinked).length };
    return res.json({ status: "success", data: rows, summary });
  } catch (error) {
    next(error);
  }
};

// PUT /stock-items/catalog/:entity/:id — body { stockItem, stockQty, extraStock } for simple, { variants: [{ size, stockItem, stockQty, extraStock }] } for variant
export const updateStockLink = async (req, res, next) => {
  try {
    const entity = req.params.entity === "item" ? "item" : "product";
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ status: "error", message: "Invalid id." });
    const doc = await modelFor(entity).findById(req.params.id).select("type stockItem stockQty extraStock variants");
    if (!doc) return res.status(404).json({ status: "error", message: "Not found." });

    const body = req.body || {};
    const wanted = new Set();
    if (doc.type === "variant") {
      const bySize = new Map((Array.isArray(body.variants) ? body.variants : []).map((v) => [String(v?.size || ""), v || {}]));
      for (const v of doc.variants || []) {
        const next = bySize.get(v.size);
        if (next && next.stockItem !== undefined) v.stockItem = toStockItemId(next.stockItem);
        if (next && next.stockQty !== undefined) v.stockQty = toStockQty(next.stockQty);
        if (next && next.extraStock !== undefined) v.extraStock = toExtraStock(next.extraStock);
        if (v.stockItem) wanted.add(String(v.stockItem));
        for (const l of v.extraStock || []) if (l?.stockItem) wanted.add(String(l.stockItem));
      }
      doc.markModified("variants");
    } else {
      if (body.stockItem !== undefined) doc.stockItem = toStockItemId(body.stockItem);
      if (body.stockQty !== undefined) doc.stockQty = toStockQty(body.stockQty);
      if (body.extraStock !== undefined) doc.extraStock = toExtraStock(body.extraStock);
      if (doc.stockItem) wanted.add(String(doc.stockItem));
      for (const l of doc.extraStock || []) if (l?.stockItem) wanted.add(String(l.stockItem));
    }
    if (wanted.size) {
      const found = await StockItemModel.countDocuments({ _id: { $in: [...wanted] } });
      if (found !== wanted.size) return res.status(404).json({ status: "error", message: "Inventory item not found." });
    }
    await doc.save({ validateModifiedOnly: true });
    return res.json({ status: "success", message: "Inventory link saved." });
  } catch (error) {
    next(error);
  }
};

// DELETE /stock-items/:id — removes an inventory item and unlinks it from products/items.
// Refused while a group product uses it as a piece, since removing that piece would change the group's price.
export const deleteStockItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ status: "error", message: "Invalid id." });
    const item = await StockItemModel.findById(id).select("shortName").lean();
    if (!item) return res.status(404).json({ status: "error", message: "Not found." });

    const groups = await ItemModel.find({ type: "combo", "combo.pieces": { $elemMatch: { source: "stock", refId: id } } }).select("name").limit(5).lean();
    if (groups.length) {
      return res.status(409).json({ status: "error", message: `${item.shortName} is a piece in: ${groups.map((g) => g.name).join(", ")}. Remove it from those group products first.` });
    }

    const oid = new mongoose.Types.ObjectId(id);
    const unlink = async (Model) => {
      const a = await Model.updateMany({ stockItem: oid }, { $set: { stockItem: null } });
      const b = await Model.updateMany({ "variants.stockItem": oid }, { $set: { "variants.$[v].stockItem": null } }, { arrayFilters: [{ "v.stockItem": oid }] });
      const c = await Model.updateMany({ "extraStock.stockItem": oid }, { $pull: { extraStock: { stockItem: oid } } });
      const d = await Model.updateMany({ "variants.extraStock.stockItem": oid }, { $pull: { "variants.$[].extraStock": { stockItem: oid } } });
      return (a.modifiedCount || 0) + (b.modifiedCount || 0) + (c.modifiedCount || 0) + (d.modifiedCount || 0);
    };
    const unlinked = (await unlink(ProductModel)) + (await unlink(ItemModel));
    await StockItemModel.deleteOne({ _id: id });
    return res.json({ status: "success", message: `${item.shortName} deleted${unlinked ? `, unlinked from ${unlinked} product${unlinked === 1 ? "" : "s"}` : ""}.` });
  } catch (error) {
    next(error);
  }
};
