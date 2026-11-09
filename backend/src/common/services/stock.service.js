import mongoose from "mongoose";
import { ProductModel } from "../models/product.model.js";
import { ItemModel } from "../models/item.model.js";
import { OrderModel } from "../models/order.model.js";
import { StockMovementModel } from "../models/stockMovement.model.js";
import { config } from "../config/index.js";
import { comboStockPieces } from "../utils/combo.js";
import { applyStockItemDelta } from "../../service/services/stockReceipt.service.js";

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

// A stock item id from a form/payload value, or null when the value isn't one
export const toStockItemId = (value) => {
  const id = value && typeof value === "object" ? value._id || value.id : value;
  return id && mongoose.Types.ObjectId.isValid(String(id)) ? String(id) : null;
};

// Pieces per sale from a form value: a whole number, at least 1
export const toStockQty = (value) => {
  const n = Math.round(Number(value));
  return Number.isFinite(n) && n >= 1 ? n : 1;
};

// Extra inventory links from a form/payload value: [{ stockItem, stockQty }], invalid and repeated pieces dropped
export const toExtraStock = (value) => {
  const out = [];
  for (const raw of Array.isArray(value) ? value : []) {
    const stockItem = toStockItemId(raw?.stockItem);
    if (!stockItem || out.some((l) => l.stockItem === stockItem)) continue;
    out.push({ stockItem, stockQty: toStockQty(raw?.stockQty) });
  }
  return out;
};

// Every inventory piece a catalog product/item sells (its main link plus extra links), from the matching variant or the product itself
const linkedStockItems = async (entity, filter, size = "") => {
  const doc = await modelFor(entity)
    .findOne(filter)
    .select("name type stockItem stockQty extraStock variants.size variants.stockItem variants.stockQty variants.extraStock combo")
    .lean();
  if (!doc) return { doc: null, links: [] };
  const src = doc.type === "variant" ? (doc.variants || []).find((v) => v.size === size) : doc;
  const links = [];
  if (src?.stockItem) links.push({ stockItemId: String(src.stockItem), perSale: toStockQty(src.stockQty) });
  for (const l of src?.extraStock || []) {
    if (l?.stockItem && !links.some((x) => x.stockItemId === String(l.stockItem))) links.push({ stockItemId: String(l.stockItem), perSale: toStockQty(l.stockQty) });
  }
  return { doc, links };
};

// Takes pieces out of one inventory item and records it in the ledger and the stock history
const takeOutStockItem = async ({ stockItemId, qty, order, actor, note = "" }, ledger) => {
  if (!stockItemId || !(qty > 0)) return;
  const res = await applyStockItemDelta(stockItemId, -qty);
  if (!res) return;
  const name = res.doc.shortName || res.doc.name || "";
  ledger.push({ entity: "stockItem", refId: res.doc._id, name, quantity: qty });
  await logStockMovement({
    entity: "stockItem",
    refId: res.doc._id,
    name,
    type: "order_deduct",
    delta: -qty,
    before: res.before,
    after: res.after,
    orderId: order._id,
    orderNumber: order.orderNumber,
    note,
    createdBy: actor,
  });
};

// Takes one catalog product/item out through all its inventory links; nothing happens when it has none
const takeOutLinked = async ({ entity, filter, size, qty, order, actor, note = "" }, ledger) => {
  const { links } = await linkedStockItems(entity, filter, size);
  for (const { stockItemId, perSale } of links) await takeOutStockItem({ stockItemId, qty: qty * perSale, order, actor, note }, ledger);
};

// Takes the order's pieces out of the linked inventory items and returns the ledger of what was taken.
// Only products/variants linked to an inventory item are tracked; everything else is left alone.
const deductForOrder = async (order, actor) => {
  const ledger = [];
  const lines = Array.isArray(order.items) ? order.items : [];

  for (const line of lines) {
    const qty = Number(line.quantity) || 0;
    if (qty <= 0) continue;
    try {
      if (line.itemType === "custom") {
        // A custom line takes out only the catalog pieces picked for it, times the lines ordered
        for (const piece of line.pieces || []) {
          const pieceQty = (Number(piece.quantity) || 0) * qty;
          if (!piece.refId || pieceQty <= 0) continue;
          await takeOutLinked({ entity: piece.entity === "item" ? "item" : "product", filter: { _id: piece.refId }, qty: pieceQty, order, actor, note: `Custom: ${line.name}` }, ledger);
        }
        continue;
      }
      const filter = buildRefFilter(line);
      if (!filter) continue;
      const entity = lineEntity(line);
      const { doc, links } = await linkedStockItems(entity, filter, line.size || "");
      if (!doc) continue;

      // A group product (combo) takes its pieces out through their own links
      if (entity === "item" && doc.type === "combo") {
        for (const piece of comboStockPieces(doc, qty)) {
          if (!(piece.quantity > 0)) continue;
          if (piece.entity === "stockItem") await takeOutStockItem({ stockItemId: String(piece.refId), qty: piece.quantity, order, actor, note: `Combo: ${doc.name}` }, ledger);
          else await takeOutLinked({ entity: piece.entity, filter: { _id: piece.refId }, size: piece.size || "", qty: piece.quantity, order, actor, note: `Combo: ${doc.name}` }, ledger);
        }
        continue;
      }
      for (const { stockItemId, perSale } of links) {
        await takeOutStockItem({ stockItemId, qty: qty * perSale, order, actor, note: line.size ? `${doc.name} (${line.size})` : "" }, ledger);
      }
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
      // Older orders took stock from the product itself; newer ones from the linked inventory item
      const res = row.entity === "stockItem"
        ? await applyStockItemDelta(row.refId, row.quantity)
        : await applyStockDelta(row.entity, { _id: row.refId }, row.quantity);
      if (!res) continue;
      await logStockMovement({
        entity: row.entity,
        refId: row.refId,
        name: res.doc.shortName || res.doc.name || row.name,
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
