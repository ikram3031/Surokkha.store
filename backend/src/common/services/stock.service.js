import mongoose from "mongoose";
import { ProductModel } from "../models/product.model.js";
import { ItemModel } from "../models/item.model.js";
import { config } from "../config/index.js";

// Builds a lookup filter for a product/item from an order line reference
const buildRefFilter = (orderItem) => {
  const id = orderItem.itemType === "item" ? orderItem.itemId : orderItem.productId;
  if (id && mongoose.Types.ObjectId.isValid(id)) return { _id: id };
  if (orderItem.productDid) return { did: orderItem.productDid };
  return null;
};

// Decrements simple product/item stockAmount for each order line when stock management is on
export const decrementStockForOrder = async (order) => {
  if (config.stockManagement?.simpleProduct === false) return;
  const lines = Array.isArray(order?.items) ? order.items : [];

  for (const line of lines) {
    if (line.itemType === "custom") continue;
    const qty = Number(line.quantity) || 0;
    const filter = buildRefFilter(line);
    if (qty <= 0 || !filter) continue;

    const Model = line.itemType === "item" ? ItemModel : ProductModel;
    try {
      const doc = await Model.findOne({ ...filter, type: { $ne: "variant" } }).select("stockAmount").lean();
      const currentAmount = Number(doc?.stockAmount) || 0;
      if (!doc || currentAmount <= 0) continue;
      const nextAmount = Math.max(0, currentAmount - qty);
      const update = { stockAmount: nextAmount };
      if (nextAmount === 0) update.stockStatus = "outofstock";
      await Model.updateOne({ _id: doc._id }, { $set: update });
    } catch (error) {
      console.error(`Stock decrement failed for order ${order?.orderNumber}:`, error);
    }
  }
};
