import mongoose from "mongoose";
import { StockItemModel } from "../../common/models/stockItem.model.js";
import { StockReceiptModel } from "../../common/models/stockReceipt.model.js";
import { logStockMovement } from "../../common/services/stock.service.js";

const LOCK_STALE_MS = 60 * 1000;
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export class ReceiptError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

// Moves one stock item's quantity by delta; on a receive it also blends the new cost into the average
export const applyStockItemDelta = async (id, delta, unitCost = null) => {
  const before = await StockItemModel.findById(id).select("quantity avgCost shortName name").lean();
  if (!before) return null;
  const qtyBefore = Number(before.quantity) || 0;
  const set = {};
  if (delta > 0 && unitCost !== null && Number.isFinite(unitCost)) {
    const base = Math.max(0, qtyBefore);
    const blended = base + delta > 0 ? (base * (Number(before.avgCost) || 0) + delta * unitCost) / (base + delta) : unitCost;
    set.avgCost = round2(blended);
    set.lastCost = round2(unitCost);
  }
  const doc = await StockItemModel.findByIdAndUpdate(
    id,
    { $inc: { quantity: delta }, ...(Object.keys(set).length ? { $set: set } : {}) },
    { new: true, projection: { quantity: 1, shortName: 1, name: 1 } }
  ).lean();
  const after = Number(doc.quantity) || 0;
  return { doc, before: after - delta, after };
};

// Checks and normalises the lines Plexivia sends; units are always re-derived from packs × unitsPerPack
const normaliseLines = async (rawLines) => {
  if (!Array.isArray(rawLines) || rawLines.length === 0) throw new ReceiptError("At least one line is required.");
  const ids = [...new Set(rawLines.map((l) => String(l?.stockItemId || "")))];
  if (ids.some((id) => !mongoose.Types.ObjectId.isValid(id))) throw new ReceiptError("Every line needs a valid stockItemId.");
  const items = await StockItemModel.find({ _id: { $in: ids } }).select("shortName").lean();
  const byId = new Map(items.map((i) => [String(i._id), i]));
  const missing = ids.filter((id) => !byId.has(id));
  if (missing.length) throw new ReceiptError(`Unknown stock item(s): ${missing.join(", ")}`, 404);

  return rawLines.map((l) => {
    const packs = Number(l.packs);
    const unitsPerPack = Number(l.unitsPerPack) || 1;
    if (!Number.isFinite(packs) || packs <= 0) throw new ReceiptError("Packs must be more than 0.");
    if (!Number.isInteger(unitsPerPack) || unitsPerPack < 1) throw new ReceiptError("Units per pack must be a whole number of 1 or more.");
    const units = Math.round(packs * unitsPerPack);
    if (units <= 0) throw new ReceiptError("Each line must add at least one unit.");
    const total = round2(l.total ?? Number(l.unitCost || 0) * units);
    const unitCost = round2(Number(l.unitCost) || (units ? total / units : 0));
    const item = byId.get(String(l.stockItemId));
    return {
      stockItemId: item._id,
      shortName: item.shortName,
      packLabel: String(l.packLabel || "").slice(0, 40),
      packs,
      unitsPerPack,
      units,
      unitCost,
      total,
    };
  });
};

// Units per stock item for a set of lines
const unitsByItem = (lines = []) => {
  const map = new Map();
  for (const l of lines) map.set(String(l.stockItemId), (map.get(String(l.stockItemId)) || 0) + (Number(l.units) || 0));
  return map;
};

// Cost per unit for the positive part of a change, weighted across the item's lines
const costByItem = (lines = []) => {
  const map = new Map();
  for (const l of lines) {
    const key = String(l.stockItemId);
    const cur = map.get(key) || { units: 0, total: 0 };
    map.set(key, { units: cur.units + l.units, total: cur.total + l.total });
  }
  return new Map([...map].map(([k, v]) => [k, v.units ? v.total / v.units : 0]));
};

// Takes the per-receipt lock so two calls for the same purchase never apply stock twice
const acquireLock = async (externalRef) => {
  const now = new Date();
  await StockReceiptModel.updateOne(
    { externalRef },
    { $setOnInsert: { externalRef, status: "received", lines: [], version: 0 } },
    { upsert: true }
  ).catch((e) => {
    if (e?.code !== 11000) throw e;
  });
  const locked = await StockReceiptModel.findOneAndUpdate(
    { externalRef, $or: [{ lockedAt: null }, { lockedAt: { $lt: new Date(now.getTime() - LOCK_STALE_MS) } }] },
    { $set: { lockedAt: now } },
    { new: true }
  ).lean();
  if (!locked) throw new ReceiptError("This purchase is being synced right now. Try again in a moment.", 409);
  return locked;
};

const releaseLock = (externalRef) => StockReceiptModel.updateOne({ externalRef }, { $set: { lockedAt: null } }).catch(() => {});

// Applies the difference between what is in stock for this receipt and the wanted units; reverses everything on failure
const applyDiff = async (externalRef, previousLines, nextLines, { type, actor, note }) => {
  const prev = unitsByItem(previousLines);
  const next = unitsByItem(nextLines);
  const cost = costByItem(nextLines);
  const keys = [...new Set([...prev.keys(), ...next.keys()])];
  const applied = [];
  try {
    for (const key of keys) {
      const delta = (next.get(key) || 0) - (prev.get(key) || 0);
      if (delta === 0) continue;
      const res = await applyStockItemDelta(key, delta, delta > 0 ? cost.get(key) ?? null : null);
      if (!res) throw new ReceiptError(`Stock item ${key} no longer exists.`, 404);
      applied.push({ key, delta });
      await logStockMovement({
        entity: "stockItem",
        refId: res.doc._id,
        name: res.doc.shortName,
        type,
        delta,
        before: res.before,
        after: res.after,
        externalRef,
        note: String(note || "").slice(0, 300),
        createdBy: actor,
      });
    }
  } catch (error) {
    for (const { key, delta } of applied.reverse()) {
      await StockItemModel.updateOne({ _id: key }, { $inc: { quantity: -delta } }).catch(() => {});
    }
    throw error;
  }
  return applied;
};

// Receipt as returned to Plexivia
export const toReceiptView = (r) =>
  r && {
    externalRef: r.externalRef,
    purchaseNumber: r.purchaseNumber,
    vendorName: r.vendorName,
    status: r.status,
    version: r.version,
    totalUnits: r.totalUnits,
    totalCost: r.totalCost,
    receivedAt: r.receivedAt,
    lines: (r.lines || []).map((l) => ({ ...l, stockItemId: String(l.stockItemId) })),
    updatedAt: r.updatedAt,
  };

// Creates or updates the stock for one received purchase. Sending the same payload again changes nothing.
export const applyReceipt = async (payload, actor = "plexivia") => {
  const externalRef = String(payload?.externalRef || "").trim();
  if (!externalRef) throw new ReceiptError("externalRef is required.");
  const version = Number(payload?.version) || 0;
  const lines = await normaliseLines(payload?.lines);

  const current = await acquireLock(externalRef);
  try {
    if (version && current.version > version) return { receipt: toReceiptView(current), changed: false, stale: true };
    const previous = current.status === "cancelled" ? [] : current.lines || [];
    const isNew = previous.length === 0;
    const applied = await applyDiff(externalRef, previous, lines, {
      type: isNew ? "purchase_receive" : "purchase_adjust",
      actor,
      note: `${payload.purchaseNumber || externalRef}${payload.vendorName ? ` · ${payload.vendorName}` : ""}`,
    });
    const saved = await StockReceiptModel.findOneAndUpdate(
      { externalRef },
      {
        $set: {
          purchaseNumber: String(payload.purchaseNumber || "").slice(0, 60),
          vendorName: String(payload.vendorName || "").slice(0, 120),
          vendorPhone: String(payload.vendorPhone || "").slice(0, 30),
          receivedAt: payload.receivedAt ? new Date(payload.receivedAt) : current.receivedAt || new Date(),
          notes: String(payload.notes || "").slice(0, 500),
          status: "received",
          lines,
          totalUnits: lines.reduce((s, l) => s + l.units, 0),
          totalCost: round2(lines.reduce((s, l) => s + l.total, 0)),
          version: version ? Math.max(version, current.version || 0) : (current.version || 0) + 1,
        },
      },
      { new: true }
    ).lean();
    return { receipt: toReceiptView(saved), changed: applied.length > 0 };
  } catch (error) {
    if (!current.version) await StockReceiptModel.deleteOne({ externalRef, version: 0 }).catch(() => {});
    throw error;
  } finally {
    await releaseLock(externalRef);
  }
};

// Takes a cancelled purchase's units back out of stock
export const cancelReceipt = async (externalRef, actor = "plexivia", note = "", version = 0) => {
  const ref = String(externalRef || "").trim();
  const existing = await StockReceiptModel.findOne({ externalRef: ref }).lean();
  if (!existing) return { receipt: null, changed: false };
  if (existing.status === "cancelled") return { receipt: toReceiptView(existing), changed: false };

  await acquireLock(ref);
  try {
    const fresh = await StockReceiptModel.findOne({ externalRef: ref }).lean();
    if (fresh.status === "cancelled") return { receipt: toReceiptView(fresh), changed: false };
    const applied = await applyDiff(ref, fresh.lines || [], [], {
      type: "purchase_cancel",
      actor,
      note: note || `${fresh.purchaseNumber || ref} cancelled`,
    });
    const saved = await StockReceiptModel.findOneAndUpdate(
      { externalRef: ref },
      { $set: { status: "cancelled", version: Number(version) ? Math.max(Number(version), fresh.version || 0) : (fresh.version || 0) + 1 } },
      { new: true }
    ).lean();
    return { receipt: toReceiptView(saved), changed: applied.length > 0 };
  } finally {
    await releaseLock(ref);
  }
};
