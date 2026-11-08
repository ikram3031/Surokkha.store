import mongoose from "mongoose";
import { ProductModel } from "../../common/models/product.model.js";
import { ItemModel } from "../../common/models/item.model.js";
import { StockItemModel } from "../../common/models/stockItem.model.js";
import { toStockItemId } from "../../common/services/stock.service.js";

// Links catalog products/items (and their variants) to the inventory pieces they sell

const modelFor = (entity) => (entity === "item" ? ItemModel : ProductModel);
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const isLinked = (d) => (d.type === "variant" ? (d.variants || []).some((v) => v.stockItem) : !!d.stockItem);

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
      .select("name type imageUrl thumbnailUrl isActive stockStatus price offerPrice stockItem variants.size variants.price variants.offerPrice variants.stockItem")
      .sort({ name: 1 })
      .lean();
    if (link === "linked") docs = docs.filter(isLinked);
    else if (link === "unlinked") docs = docs.filter((d) => !isLinked(d));

    const ids = new Set();
    for (const d of docs) {
      if (d.stockItem) ids.add(String(d.stockItem));
      for (const v of d.variants || []) if (v.stockItem) ids.add(String(v.stockItem));
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
      variants: d.type === "variant" ? (d.variants || []).map((v) => ({ size: v.size, price: v.offerPrice ?? v.price, stockItem: pieceView(v.stockItem, byId) })) : [],
    }));
    const summary = { total: rows.length, linked: docs.filter(isLinked).length };
    return res.json({ status: "success", data: rows, summary });
  } catch (error) {
    next(error);
  }
};

// PUT /stock-items/catalog/:entity/:id — body { stockItem } for simple, { variants: [{ size, stockItem }] } for variant
export const updateStockLink = async (req, res, next) => {
  try {
    const entity = req.params.entity === "item" ? "item" : "product";
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ status: "error", message: "Invalid id." });
    const doc = await modelFor(entity).findById(req.params.id).select("type stockItem variants");
    if (!doc) return res.status(404).json({ status: "error", message: "Not found." });

    const body = req.body || {};
    const wanted = new Set();
    if (doc.type === "variant") {
      const bySize = new Map((Array.isArray(body.variants) ? body.variants : []).map((v) => [String(v?.size || ""), toStockItemId(v?.stockItem)]));
      for (const v of doc.variants || []) {
        if (bySize.has(v.size)) v.stockItem = bySize.get(v.size);
        if (v.stockItem) wanted.add(String(v.stockItem));
      }
      doc.markModified("variants");
    } else {
      doc.stockItem = toStockItemId(body.stockItem);
      if (doc.stockItem) wanted.add(String(doc.stockItem));
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
