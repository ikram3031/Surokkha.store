import { Types } from "mongoose";
import { StockItemModel } from "../../common/models/stockItem.model.js";
import { StockReceiptModel } from "../../common/models/stockReceipt.model.js";
import { StockMovementModel } from "../../common/models/stockMovement.model.js";
import { logStockMovement } from "../../common/services/stock.service.js";
import { applyStockItemDelta } from "../services/stockReceipt.service.js";

const actorOf = (req) => req.user?.name || req.user?.did || "staff";
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
// Capitalizes the first letter of every word, leaving the rest as typed (KN95 stays KN95)
const titleCase = (v) => v.replace(/(^|\s)(\S)/g, (m, sp, ch) => sp + ch.toUpperCase());
const fail = (res, code, message) => res.status(code).json({ status: "error", message });

// Validates the editable fields of a stock item; returns an error string or the clean values
const cleanItem = (body = {}, partial = false) => {
  const out = {};
  if (!partial || body.shortName !== undefined) {
    const shortName = String(body.shortName || "").trim().toUpperCase();
    if (!shortName) return "Short name is required.";
    if (shortName.length > 40) return "Short name must be 40 characters or less.";
    out.shortName = shortName;
  }
  if (body.name !== undefined) out.name = titleCase(String(body.name || "").trim().replace(/\s+/g, " ")).slice(0, 160);
  if (body.unit !== undefined) {
    const unit = String(body.unit || "pcs").trim().slice(0, 20) || "pcs";
    if (/^\d+(\.\d+)?$/.test(unit)) return "Unit must be a word like pcs. Put how many come in a packet under Pack sizes.";
    out.unit = unit;
  }
  if (body.notes !== undefined) out.notes = String(body.notes || "").trim().slice(0, 500);
  if (body.reorderLevel !== undefined) {
    const r = Number(body.reorderLevel);
    if (!Number.isFinite(r) || r < 0) return "Reorder level must be 0 or more.";
    out.reorderLevel = Math.round(r);
  }
  if (body.isActive !== undefined) out.isActive = Boolean(body.isActive);
  if (body.packs !== undefined) {
    if (!Array.isArray(body.packs)) return "Packs must be a list.";
    const packs = [];
    for (const p of body.packs) {
      const label = String(p?.label || "").trim();
      const unitsPerPack = Number(p?.unitsPerPack);
      if (!label && !p?.unitsPerPack) continue;
      if (!label) return "Each pack size needs a label.";
      if (!Number.isInteger(unitsPerPack) || unitsPerPack < 1) return `"${label}" needs a whole number of units (1 or more).`;
      packs.push({ label: label.slice(0, 40), unitsPerPack });
    }
    out.packs = packs;
  }
  return out;
};

// Older items could have a number saved as the unit (e.g. "10"); those are counted in pieces
const unitOf = (u) => (u && !/^\d+(\.\d+)?$/.test(String(u).trim()) ? u : "pcs");

// Units each item got from purchases still in force (received, not cancelled); Plexivia owns these
const purchasedUnits = async (ids) => {
  const match = { status: "received", version: { $gt: 0 } };
  if (ids) match["lines.stockItemId"] = { $in: ids };
  const rows = await StockReceiptModel.aggregate([
    { $match: match },
    { $unwind: "$lines" },
    ...(ids ? [{ $match: { "lines.stockItemId": { $in: ids } } }] : []),
    { $group: { _id: "$lines.stockItemId", units: { $sum: "$lines.units" } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), Number(r.units) || 0]));
};

// Stock item as shown in the dashboard and sent to Plexivia; fromPurchases splits the count into purchased and added here
export const toStockItemView = (d, fromPurchases) => {
  const quantity = Number(d.quantity) || 0;
  const reorderLevel = Number(d.reorderLevel) || 0;
  const split = fromPurchases === undefined ? {} : { fromPurchases, byHand: quantity - fromPurchases };
  return {
    ...split,
    id: String(d._id),
    shortName: d.shortName,
    name: d.name || "",
    unit: unitOf(d.unit),
    packs: d.packs || [],
    quantity,
    avgCost: Number(d.avgCost) || 0,
    lastCost: Number(d.lastCost) || 0,
    stockValue: round2(Math.max(0, quantity) * (Number(d.avgCost) || 0)),
    reorderLevel,
    isOut: quantity <= 0,
    // Out of stock always counts as low; otherwise only when a reorder level is set
    isLow: quantity <= 0 || (reorderLevel > 0 && quantity <= reorderLevel),
    isActive: d.isActive !== false,
    notes: d.notes || "",
    updatedAt: d.updatedAt,
    createdAt: d.createdAt,
  };
};

// GET /stock-items — list with search, status filter and totals
export const listStockItems = async (req, res, next) => {
  try {
    const search = String(req.query.search || "").trim();
    const status = String(req.query.status || "active");
    const filter = {};
    if (status === "active") filter.isActive = true;
    else if (status === "inactive") filter.isActive = false;
    if (search) {
      const rx = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ shortName: rx }, { name: rx }];
    }
    const docs = await StockItemModel.find(filter).sort({ shortName: 1 }).lean();
    const bought = await purchasedUnits(docs.map((d) => d._id));
    let rows = docs.map((d) => toStockItemView(d, bought.get(String(d._id)) || 0));
    if (status === "low") rows = rows.filter((r) => r.isActive && r.isLow);
    const active = rows.filter((r) => r.isActive);
    const summary = {
      items: active.length,
      units: active.reduce((s, r) => s + r.quantity, 0),
      value: round2(active.reduce((s, r) => s + r.stockValue, 0)),
      low: active.filter((r) => r.isLow).length,
    };
    return res.json({ status: "success", data: rows, summary });
  } catch (error) {
    next(error);
  }
};

// POST /stock-items — creates an item; an opening quantity is logged as a manual add
export const createStockItem = async (req, res, next) => {
  try {
    const clean = cleanItem(req.body);
    if (typeof clean === "string") return fail(res, 400, clean);
    if (await StockItemModel.exists({ shortName: clean.shortName })) return fail(res, 409, `Short name ${clean.shortName} already exists.`);

    const opening = Math.round(Number(req.body?.openingQuantity) || 0);
    const openingCost = round2(req.body?.openingCost);
    const doc = await StockItemModel.create({ ...clean, createdBy: actorOf(req), updatedBy: actorOf(req) });
    if (opening > 0) {
      const res2 = await applyStockItemDelta(doc._id, opening, openingCost > 0 ? openingCost : null);
      await logStockMovement({
        entity: "stockItem",
        refId: doc._id,
        name: doc.shortName,
        type: "manual_add",
        delta: opening,
        before: res2.before,
        after: res2.after,
        note: "Opening stock",
        createdBy: actorOf(req),
      });
    }
    const fresh = await StockItemModel.findById(doc._id).lean();
    return res.status(201).json({ status: "success", data: toStockItemView(fresh) });
  } catch (error) {
    if (error?.code === 11000) return fail(res, 409, "That short name already exists.");
    next(error);
  }
};

// PUT /stock-items/:id — edits details; quantity only changes through adjust or purchases
export const updateStockItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) return fail(res, 400, "Invalid id.");
    const clean = cleanItem(req.body, true);
    if (typeof clean === "string") return fail(res, 400, clean);
    if (clean.shortName && (await StockItemModel.exists({ shortName: clean.shortName, _id: { $ne: id } }))) {
      return fail(res, 409, `Short name ${clean.shortName} already exists.`);
    }
    let handTarget = null;
    if (req.body?.handQuantity !== undefined && req.body.handQuantity !== null && req.body.handQuantity !== "") {
      handTarget = Math.round(Number(req.body.handQuantity));
      if (!Number.isFinite(handTarget)) return fail(res, 400, "Enter a valid count for stock added here.");
    }
    const doc = await StockItemModel.findByIdAndUpdate(id, { $set: { ...clean, updatedBy: actorOf(req) } }, { new: true }).lean();
    if (!doc) return fail(res, 404, "Stock item not found.");

    // Stock added here is edited to a new count; purchased stock is left to Plexivia
    const bought = (await purchasedUnits([doc._id])).get(String(doc._id)) || 0;
    if (handTarget !== null) {
      const currentHand = (Number(doc.quantity) || 0) - bought;
      const delta = handTarget - currentHand;
      if (bought + handTarget < 0) return fail(res, 400, `Stock can't go below 0: ${bought} came from purchases.`);
      if (delta !== 0) {
        const result = await applyStockItemDelta(doc._id, delta, null);
        await logStockMovement({
          entity: "stockItem",
          refId: doc._id,
          name: doc.shortName,
          type: delta > 0 ? "manual_add" : "manual_remove",
          delta,
          before: result.before,
          after: result.after,
          note: `Stock added here changed ${currentHand} → ${handTarget}`,
          createdBy: actorOf(req),
        });
      }
    }
    const fresh = await StockItemModel.findById(doc._id).lean();
    return res.json({ status: "success", data: toStockItemView(fresh, bought) });
  } catch (error) {
    if (error?.code === 11000) return fail(res, 409, "That short name already exists.");
    next(error);
  }
};

// POST /stock-items/:id/adjust — add, remove or set the count by hand (damage, found, recount)
export const adjustStockItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { mode, note } = req.body || {};
    const quantity = Number(req.body?.quantity);
    if (!Types.ObjectId.isValid(id)) return fail(res, 400, "Invalid id.");
    if (!["add", "remove", "set"].includes(mode)) return fail(res, 400, "Mode must be add, remove or set.");
    if (!Number.isFinite(quantity) || quantity < 0 || (mode !== "set" && quantity === 0)) return fail(res, 400, "Enter a valid quantity.");

    const current = await StockItemModel.findById(id).select("quantity shortName").lean();
    if (!current) return fail(res, 404, "Stock item not found.");
    const qty = Math.round(quantity);
    const delta = mode === "add" ? qty : mode === "remove" ? -qty : qty - (Number(current.quantity) || 0);
    if (delta === 0) {
      const same = await StockItemModel.findById(id).lean();
      return res.json({ status: "success", data: toStockItemView(same) });
    }
    const result = await applyStockItemDelta(id, delta, null);
    await logStockMovement({
      entity: "stockItem",
      refId: id,
      name: current.shortName,
      type: mode === "add" ? "manual_add" : mode === "remove" ? "manual_remove" : "manual_set",
      delta,
      before: result.before,
      after: result.after,
      note: String(note || "").slice(0, 300),
      createdBy: actorOf(req),
    });
    const fresh = await StockItemModel.findById(id).lean();
    return res.json({ status: "success", data: toStockItemView(fresh) });
  } catch (error) {
    next(error);
  }
};

// GET /stock-items/movements — stock history for stock items (optionally one item)
export const listStockItemMovements = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || "50", 10)));
    const filter = { entity: "stockItem" };
    if (req.query.refId && Types.ObjectId.isValid(req.query.refId)) filter.refId = req.query.refId;
    if (req.query.type) filter.type = String(req.query.type);
    if (req.query.q) {
      const rx = new RegExp(escapeRegex(String(req.query.q)), "i");
      filter.$or = [{ name: rx }, { note: rx }, { externalRef: rx }];
    }
    const [rows, total] = await Promise.all([
      StockMovementModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      StockMovementModel.countDocuments(filter),
    ]);
    return res.json({
      status: "success",
      data: rows.map((r) => ({ ...r, id: String(r._id), refId: String(r.refId), _id: undefined })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// GET /stock-items/receipts — purchases received from Plexivia
export const listStockReceipts = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "25", 10)));
    const filter = { version: { $gt: 0 } };
    if (req.query.status) filter.status = String(req.query.status);
    if (req.query.q) {
      const rx = new RegExp(escapeRegex(String(req.query.q)), "i");
      filter.$or = [{ purchaseNumber: rx }, { vendorName: rx }, { "lines.shortName": rx }];
    }
    const [rows, total] = await Promise.all([
      StockReceiptModel.find(filter).sort({ receivedAt: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      StockReceiptModel.countDocuments(filter),
    ]);
    return res.json({
      status: "success",
      data: rows.map(({ _id, lockedAt, ...r }) => ({ ...r, id: String(_id) })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// Manual changes that can be taken back; purchases are corrected from the Plexivia purchase instead
const UNDOABLE_TYPES = ["manual_add", "manual_remove", "manual_set"];

// POST /stock-items/movements/:movementId/undo — reverses one manual change by exactly what it moved
export const undoStockItemMovement = async (req, res, next) => {
  try {
    const { movementId } = req.params;
    if (!Types.ObjectId.isValid(movementId)) return fail(res, 400, "Invalid id.");
    const original = await StockMovementModel.findOne({ _id: movementId, entity: "stockItem" }).lean();
    if (!original) return fail(res, 404, "Stock change not found.");
    if (!UNDOABLE_TYPES.includes(original.type)) return fail(res, 400, "Only hand adjustments can be undone. Purchases are corrected from the purchase in Plexivia.");
    if (original.undoneAt) return fail(res, 409, "This change was already undone.");
    const delta = -(Number(original.delta) || 0);

    // Claim first so two clicks can't undo the same change twice
    const claimed = await StockMovementModel.findOneAndUpdate(
      { _id: movementId, undoneAt: null },
      { $set: { undoneAt: new Date(), undoneBy: actorOf(req) } },
      { new: true }
    ).lean();
    if (!claimed) return fail(res, 409, "This change was already undone.");

    try {
      const result = delta === 0 ? null : await applyStockItemDelta(original.refId, delta, null);
      await logStockMovement({
        entity: "stockItem",
        refId: original.refId,
        name: original.name,
        type: "manual_undo",
        delta,
        before: result ? result.before : original.after,
        after: result ? result.after : original.after,
        note: `Undo of ${original.delta > 0 ? "+" : ""}${original.delta}${original.note ? ` (${original.note})` : ""}${req.body?.note ? ` · ${req.body.note}` : ""}`.slice(0, 300),
        undoOf: original._id,
        createdBy: actorOf(req),
      });
    } catch (err) {
      await StockMovementModel.updateOne({ _id: movementId }, { $set: { undoneAt: null, undoneBy: "" } });
      throw err;
    }

    const fresh = await StockItemModel.findById(original.refId).lean();
    return res.json({ status: "success", data: fresh ? toStockItemView(fresh) : null });
  } catch (error) {
    next(error);
  }
};
