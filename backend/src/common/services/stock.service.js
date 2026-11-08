import mongoose from "mongoose";
import { ProductModel } from "../models/product.model.js";
import { ItemModel } from "../models/item.model.js";
import { OrderModel } from "../models/order.model.js";
import { StockMovementModel } from "../models/stockMovement.model.js";
import { config } from "../config/index.js";
import { comboStockPieces } from "../utils/combo.js";

const RELEASE_STATUSES = ["cancelled", "canceled", "fake", "return"];
const SHIPPED_STATUSES = ["shipped", "completed"];

const modelFor = (entity) => (entity === "item" ? ItemModel : ProductModel);

const lineEntity = (line) => (line.itemType === "item" ? "item" : "product");

// Builds a lookup filter for a product/item from an order line reference
const buildRefFilter = (orderItem) => {
  const id = orderItem.itemType === "item" ? orderItem.itemId : orderItem.productId;
  if (id && mongoose.Types.ObjectId.isValid(id)) return { _id: id };
  if (orderItem.productDid) return { did: orderItem.productDid };
  return null;
};

export const isStockTrackingOn = () => config.stockManagement?.simpleProduct !== false;

// Records one stock change for the inventory history
export const logStockMovement = async (entry) => {
  try {
    await StockMovementModel.create(entry);
  } catch (error) {
    console.error("Stock movement log failed:", error);
  }
};

// Atomically moves stockAmount by delta (never below 0) and keeps stockStatus in step; returns the document as it was before
export const applyStockDelta = async (entity, filter, delta) => {
  const stages = [
    { $set: { stockAmount: { $max: [0, { $add: [{ $ifNull: ["$stockAmount", 0] }, delta] }] } } },
  ];
  const statusBranches = [{ case: { $lte: ["$stockAmount", 0] }, then: "outofstock" }];
  if (delta > 0) statusBranches.push({ case: { $eq: ["$stockStatus", "outofstock"] }, then: "instock" });
  stages.push({ $set: { stockStatus: { $switch: { branches: statusBranches, default: "$stockStatus" } } } });

  const doc = await modelFor(entity)
    .findOneAndUpdate({ ...filter, type: { $ne: "variant" } }, stages, {
      new: false,
      projection: { stockAmount: 1, name: 1 },
    })
    .lean();
  if (!doc) return null;

  const before = Number(doc.stockAmount) || 0;
  return { doc, before, after: Math.max(0, before + delta) };
};

// Takes one stock line out and records it in the ledger; returns nothing when the product doesn't track stock
const takeOut = async ({ entity, filter, qty, name, order, actor, note = "" }, ledger) => {
  const res = await applyStockDelta(entity, filter, -qty);
  if (!res) return;
  const taken = Math.min(res.before, qty);
  if (taken <= 0) return;
  ledger.push({ entity, refId: res.doc._id, name: res.doc.name || name || "", quantity: taken });
  await logStockMovement({
    entity,
    refId: res.doc._id,
    name: res.doc.name || name || "",
    type: "order_deduct",
    delta: -taken,
    before: res.before,
    after: res.before - taken,
    orderId: order._id,
    orderNumber: order.orderNumber,
    note,
    createdBy: actor,
  });
};

// Takes the order's quantities out of stock and returns the ledger of what was actually taken
const deductForOrder = async (order, actor) => {
  const ledger = [];
  const lines = Array.isArray(order.items) ? order.items : [];

  for (const line of lines) {
    const qty = Number(line.quantity) || 0;
    if (line.itemType === "custom") {
      // A custom line takes out only the inventory pieces picked for it, times the lines ordered
      for (const piece of line.pieces || []) {
        const pieceQty = (Number(piece.quantity) || 0) * qty;
        if (!piece.refId || pieceQty <= 0) continue;
        try {
          await takeOut({ entity: piece.entity === "item" ? "item" : "product", filter: { _id: piece.refId }, qty: pieceQty, name: piece.name, order, actor, note: `Custom: ${line.name}` }, ledger);
        } catch (error) {
          console.error(`Stock deduct failed for order ${order.orderNumber}:`, error);
        }
      }
      continue;
    }
    const filter = buildRefFilter(line);
    if (qty <= 0 || !filter) continue;

    const entity = lineEntity(line);
    try {
      // A group product (combo) takes its catalog pieces out instead of itself
      if (entity === "item") {
        const combo = await ItemModel.findOne({ ...filter, type: "combo" }).select("name combo").lean();
        if (combo) {
          for (const piece of comboStockPieces(combo, qty)) {
            if (piece.quantity > 0) await takeOut({ entity: piece.entity, filter: { _id: piece.refId }, qty: piece.quantity, name: piece.name, order, actor, note: `Combo: ${combo.name}` }, ledger);
          }
          continue;
        }
      }
      const res = await applyStockDelta(entity, filter, -qty);
      if (!res) continue;
      const taken = Math.min(res.before, qty);
      if (taken <= 0) continue;
      ledger.push({ entity, refId: res.doc._id, name: res.doc.name || line.name || "", quantity: taken });
      await logStockMovement({
        entity,
        refId: res.doc._id,
        name: res.doc.name || line.name || "",
        type: "order_deduct",
        delta: -taken,
        before: res.before,
        after: res.before - taken,
        orderId: order._id,
        orderNumber: order.orderNumber,
        createdBy: actor,
      });
    } catch (error) {
      console.error(`Stock deduct failed for order ${order.orderNumber}:`, error);
    }
  }
  return ledger;
};

// Puts the ledger quantities back into stock (cancelled/fake orders, or a returned order restocked by hand)
const restoreLedger = async (order, type, actor, note = "") => {
  for (const row of order.stockLedger || []) {
    if (!row.refId || !(row.quantity > 0)) continue;
    try {
      const res = await applyStockDelta(row.entity, { _id: row.refId }, row.quantity);
      if (!res) continue;
      await logStockMovement({
        entity: row.entity,
        refId: row.refId,
        name: res.doc.name || row.name,
        type,
        delta: row.quantity,
        before: res.before,
        after: res.before + row.quantity,
        orderId: order._id,
        orderNumber: order.orderNumber,
        note,
        createdBy: actor,
      });
    } catch (error) {
      console.error(`Stock restore failed for order ${order.orderNumber}:`, error);
    }
  }
};

/**
 * Brings stock in line with the order's current status.
 * - active statuses (pending, processing, hold, shipped, completed): quantities are taken out of stock
 * - cancelled / fake / return: whatever the order took is put back
 * Orders that existed before inventory tracking (no stockStage) are left alone unless `init` is set.
 */
export const syncOrderStock = async (orderRef, options = {}) => {
  if (!isStockTrackingOn()) return;
  const { init = false, rebuild = false, forceRelease = false, actor = "system" } = options;

  try {
    const order = await OrderModel.findById(orderRef._id || orderRef).lean();
    if (!order) return;

    let stage = order.stockStage;
    if (!stage && !init) return;

    let working = order;
    if (rebuild && stage === "deducted") {
      await restoreLedger(working, "order_release", actor, "Order items edited");
      await OrderModel.updateOne({ _id: order._id }, { $set: { stockStage: "released", stockLedger: [] } });
      working = { ...order, stockLedger: [] };
      stage = "released";
    }

    let target;
    if (forceRelease || RELEASE_STATUSES.includes(order.status)) target = "released";
    else target = "deducted";

    if (stage === target) return;

    if (target === "deducted") {
      const ledger = await deductForOrder(working, actor);
      await OrderModel.updateOne({ _id: order._id }, { $set: { stockStage: "deducted", stockLedger: ledger } });
      return;
    }

    if (target === "released") {
      if (stage === "deducted") {
        const isReturn = order.status === "return";
        await restoreLedger(working, isReturn ? "return_restock" : "order_release", actor, isReturn ? "Order returned" : "");
      }
      await OrderModel.updateOne({ _id: order._id }, { $set: { stockStage: "released", stockLedger: [] } });
    }
  } catch (error) {
    console.error(`Order stock sync failed for ${orderRef?.orderNumber || orderRef?._id || orderRef}:`, error);
  }
};

// Soft-deleting an order that never left the warehouse gives its stock back
export const releaseStockForDeletedOrder = async (order, actor = "system") => {
  if (!order || SHIPPED_STATUSES.includes(order.status)) return;
  await syncOrderStock(order, { forceRelease: true, actor });
};
