import { OrderModel } from "../../common/models/order.model.js";

// Orders that never really sold: cancelled, fake or returned. Deleted orders have active: false.
const NOT_SOLD = ["cancelled", "canceled", "fake", "return"];
const CACHE_MS = 10 * 60 * 1000;
let cache = { at: 0, data: null };

// Counts, for every product and item, how many live orders contain it.
// Counted fresh from the orders (cached 10 minutes), so deleting, cancelling or faking an order drops it from the count.
const countOrdersPerProduct = async () => {
  const rows = await OrderModel.aggregate([
    { $match: { active: true, status: { $nin: NOT_SOLD } } },
    { $unwind: "$items" },
    { $match: { "items.itemType": { $ne: "custom" } } },
    {
      $project: {
        orderId: "$_id",
        ref: {
          $cond: [
            { $eq: ["$items.itemType", "item"] },
            { $ifNull: ["$items.itemId", ""] },
            { $ifNull: ["$items.productId", ""] },
          ],
        },
        did: { $ifNull: ["$items.productDid", ""] },
        quantity: { $ifNull: ["$items.quantity", 0] },
      },
    },
    // One order counts once per product, even when the product sits on two lines
    { $group: { _id: { order: "$orderId", ref: "$ref", did: "$did" }, quantity: { $sum: "$quantity" } } },
    { $group: { _id: { ref: "$_id.ref", did: "$_id.did" }, orders: { $sum: 1 }, units: { $sum: "$quantity" } } },
  ]);

  const data = {};
  const add = (key, orders, units) => {
    if (!key) return;
    const cur = data[key] || { orders: 0, units: 0 };
    data[key] = { orders: cur.orders + orders, units: cur.units + units };
  };
  for (const r of rows) {
    // Lines carry the Mongo id and/or the did; keep both so the shop can match either
    add(r._id.ref, r.orders, r.units);
    if (r._id.did && r._id.did !== r._id.ref) add(r._id.did, r.orders, r.units);
  }
  return data;
};

// GET /api/v1/store-utils/popularity : { [productId or did]: { orders, units } }
export const getPopularity = async (req, res, next) => {
  try {
    if (!cache.data || Date.now() - cache.at > CACHE_MS) {
      cache = { at: Date.now(), data: await countOrdersPerProduct() };
    }
    res.set("Cache-Control", "public, max-age=300");
    return res.json({ status: "success", data: cache.data });
  } catch (error) {
    next(error);
  }
};
