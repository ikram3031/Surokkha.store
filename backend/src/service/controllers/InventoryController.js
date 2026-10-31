import { Types } from "mongoose";
import { ProductModel } from "../../common/models/product.model.js";
import { ItemModel } from "../../common/models/item.model.js";
import { OrderModel } from "../../common/models/order.model.js";
import { StockMovementModel } from "../../common/models/stockMovement.model.js";
import { applyStockDelta, logStockMovement } from "../../common/services/stock.service.js";

const modelFor = (entity) => (entity === "item" ? ItemModel : ProductModel);
const entityOf = (value) => (value === "item" ? "item" : "product");
const actorOf = (req) => req.user?.name || req.user?.did || "staff";

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Lists products or items with their stock, plus in/low/out counts for the whole catalogue
export const listInventory = async (req, res, next) => {
  try {
    const entity = entityOf(req.query.entity);
    const Model = modelFor(entity);
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || "25", 10)));
    const threshold = Math.max(1, parseInt(req.query.threshold || "10", 10));
    const status = String(req.query.status || "all");
    const search = String(req.query.search || "").trim();

    const base = { type: { $ne: "variant" } };
    const filter = { ...base };
    if (search) {
      const rx = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ name: rx }, { sku: rx }, { did: rx }];
    }
    if (status === "out") filter.stockAmount = { $lte: 0 };
    else if (status === "low") filter.stockAmount = { $gt: 0, $lt: threshold };
    else if (status === "in") filter.stockAmount = { $gte: threshold };

    const [rows, total, all, out, low, variantCount] = await Promise.all([
      Model.find(filter)
        .select("name sku did price offerPrice imageUrl thumbnailUrl stockAmount stockStatus type")
        .sort({ stockAmount: 1, name: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Model.countDocuments(filter),
      Model.countDocuments(base),
      Model.countDocuments({ ...base, stockAmount: { $lte: 0 } }),
      Model.countDocuments({ ...base, stockAmount: { $gt: 0, $lt: threshold } }),
      Model.countDocuments({ type: "variant" }),
    ]);

    const valueAgg = await Model.aggregate([
      { $match: { ...base, stockAmount: { $gt: 0 } } },
      { $group: { _id: null, units: { $sum: "$stockAmount" }, value: { $sum: { $multiply: ["$stockAmount", { $ifNull: ["$price", 0] }] } } } },
    ]);

    // Units promised to orders that have not shipped yet
    const committedAgg = await OrderModel.aggregate([
      { $match: { active: true, status: { $in: ["pending", "processing", "hold"] }, stockStage: "deducted" } },
      { $unwind: "$stockLedger" },
      { $match: { "stockLedger.entity": entity } },
      { $group: { _id: "$stockLedger.refId", quantity: { $sum: "$stockLedger.quantity" } } },
    ]);
    const committed = new Map(committedAgg.map((c) => [String(c._id), c.quantity]));

    return res.json({
      status: "success",
      data: rows.map((r) => ({
        id: String(r._id),
        entity,
        name: r.name,
        sku: r.sku || r.did || "",
        price: r.price ?? 0,
        offerPrice: r.offerPrice ?? null,
        imageUrl: r.thumbnailUrl || r.imageUrl || "",
        stockAmount: Number(r.stockAmount) || 0,
        stockStatus: r.stockStatus,
        committed: committed.get(String(r._id)) || 0,
      })),
      summary: {
        total: all,
        out,
        low,
        inStock: Math.max(0, all - out - low),
        units: valueAgg[0]?.units || 0,
        value: valueAgg[0]?.value || 0,
        variantProductsSkipped: variantCount,
        threshold,
      },
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    next(error);
  }
};

// Stock history, newest first; can be narrowed to one product/item
export const listStockMovements = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || "30", 10)));
    const filter = {};
    if (req.query.entity) filter.entity = entityOf(req.query.entity);
    if (req.query.refId && Types.ObjectId.isValid(req.query.refId)) filter.refId = req.query.refId;
    if (req.query.type) filter.type = String(req.query.type);
    const q = String(req.query.q || "").trim();
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [{ name: rx }, { orderNumber: rx }, { note: rx }];
    }

    const [data, total] = await Promise.all([
      StockMovementModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      StockMovementModel.countDocuments(filter),
    ]);

    return res.json({
      status: "success",
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    next(error);
  }
};

// Staff stock correction: add (purchase / found), remove (damage / lost) or set the exact count
export const adjustStock = async (req, res, next) => {
  try {
    const { id, mode, note } = req.body || {};
    const entity = entityOf(req.body?.entity);
    const quantity = Number(req.body?.quantity);

    if (!id || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: "error", message: "A valid product id is required." });
    }
    if (!["add", "remove", "set"].includes(mode)) {
      return res.status(400).json({ status: "error", message: "Mode must be add, remove or set." });
    }
    if (!Number.isFinite(quantity) || quantity < 0 || (mode !== "set" && quantity === 0)) {
      return res.status(400).json({ status: "error", message: "Enter a valid quantity." });
    }

    const Model = modelFor(entity);
    const current = await Model.findOne({ _id: id, type: { $ne: "variant" } }).select("stockAmount name").lean();
    if (!current) {
      return res.status(404).json({ status: "error", message: "Product not found, or it is a variant product." });
    }

    const currentAmount = Number(current.stockAmount) || 0;
    const delta = mode === "add" ? Math.round(quantity) : mode === "remove" ? -Math.round(quantity) : Math.round(quantity) - currentAmount;
    if (delta === 0) {
      return res.json({ status: "success", data: { id, stockAmount: currentAmount } });
    }

    const result = await applyStockDelta(entity, { _id: id }, delta);
    await logStockMovement({
      entity,
      refId: id,
      name: current.name,
      type: mode === "add" ? "manual_add" : mode === "remove" ? "manual_remove" : "manual_set",
      delta: result.after - result.before,
      before: result.before,
      after: result.after,
      note: String(note || "").slice(0, 300),
      createdBy: actorOf(req),
    });

    return res.json({ status: "success", data: { id, stockAmount: result.after } });
  } catch (error) {
    next(error);
  }
};
