import { ProductEventModel } from "../models/productEvent.model.js";
import { OrderModel } from "../models/order.model.js";

const ORDER_FIELDS = "orderNumber status totals.total createdAt billingInfo.firstName billingInfo.lastName billingInfo.phone ipAddress tracking siteKey";

const DHAKA_DAY = { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Dhaka" };

// Shapes an order row for the visitor timeline
const slimOrder = (o) => ({
  id: String(o._id),
  orderNumber: o.orderNumber,
  status: o.status,
  total: o.totals?.total || 0,
  createdAt: o.createdAt,
  name: [o.billingInfo?.firstName, o.billingInfo?.lastName].filter(Boolean).join(" "),
  phone: o.billingInfo?.phone || "",
  ipAddress: o.ipAddress || o.tracking?.ipAddress || "",
  device: o.tracking?.device || "",
  os: o.tracking?.os || "",
  browser: o.tracking?.browser || "",
  visitorId: o.tracking?.visitorId || "",
  siteKey: o.siteKey,
});

// Everything known about one browser visitor id: stats, every product action and every order
export const getVisitorProfile = async (visitorId, { eventLimit = 300 } = {}) => {
  const id = String(visitorId || "").trim();
  if (!id) return null;

  const [summary, days, sources, events, orders] = await Promise.all([
    ProductEventModel.aggregate([
      { $match: { visitorId: id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          firstSeen: { $min: "$createdAt" },
          lastSeen: { $max: "$createdAt" },
          ips: { $addToSet: "$ipAddress" },
          devices: { $addToSet: "$device" },
          sites: { $addToSet: "$site" },
          views: { $sum: { $cond: [{ $eq: ["$eventType", "view"] }, 1, 0] } },
          carts: { $sum: { $cond: [{ $eq: ["$eventType", "add_to_cart"] }, 1, 0] } },
          checkouts: { $sum: { $cond: [{ $eq: ["$eventType", "checkout"] }, 1, 0] } },
        },
      },
    ]),
    ProductEventModel.aggregate([{ $match: { visitorId: id } }, { $group: { _id: { $dateToString: DHAKA_DAY } } }, { $count: "n" }]),
    ProductEventModel.aggregate([
      { $match: { visitorId: id } },
      { $group: { _id: "$source", n: { $sum: 1 }, first: { $min: "$createdAt" } } },
      { $sort: { first: 1 } },
    ]),
    ProductEventModel.find({ visitorId: id })
      .select("site productKey productName eventType quantity value source referrer pageUrl device os browser ipAddress createdAt")
      .sort({ createdAt: -1 })
      .limit(eventLimit)
      .lean(),
    OrderModel.find({ "tracking.visitorId": id }).select(ORDER_FIELDS).sort({ createdAt: -1 }).limit(50).lean(),
  ]);

  const s = summary[0] || {};
  return {
    visitorId: id,
    firstSeen: s.firstSeen || orders.at(-1)?.createdAt || null,
    lastSeen: s.lastSeen || orders[0]?.createdAt || null,
    totalEvents: s.total || 0,
    activeDays: days[0]?.n || 0,
    views: s.views || 0,
    carts: s.carts || 0,
    checkouts: s.checkouts || 0,
    ips: (s.ips || []).filter(Boolean),
    devices: (s.devices || []).filter(Boolean),
    sites: s.sites || [],
    firstSource: sources[0]?._id || "",
    sources: sources.map((x) => ({ source: x._id || "direct", count: x.n })),
    orders: orders.map(slimOrder),
    events,
  };
};

// Other orders that share this order's IP or phone (possible same person on another device)
export const getRelatedOrders = async (order) => {
  const ip = order.ipAddress || order.tracking?.ipAddress;
  const phone = order.billingInfo?.phone;
  const or = [ip && { ipAddress: ip }, phone && { "billingInfo.phone": phone }].filter(Boolean);
  if (!or.length) return [];
  const rows = await OrderModel.find({ _id: { $ne: order._id }, $or: or }).select(ORDER_FIELDS).sort({ createdAt: -1 }).limit(30).lean();
  return rows.map((o) => ({
    ...slimOrder(o),
    matchedBy: [ip && slimOrder(o).ipAddress === ip && "ip", phone && o.billingInfo?.phone === phone && "phone"].filter(Boolean),
  }));
};

// First-seen date and order count for a batch of visitor ids (used to flag returning visitors on the live feed)
export const getVisitorFlags = async (visitorIds = []) => {
  const ids = [...new Set(visitorIds.filter(Boolean))];
  if (!ids.length) return {};
  const [seen, orders] = await Promise.all([
    ProductEventModel.aggregate([
      { $match: { visitorId: { $in: ids } } },
      { $group: { _id: "$visitorId", firstSeen: { $min: "$createdAt" }, days: { $addToSet: { $dateToString: DHAKA_DAY } } } },
      { $project: { firstSeen: 1, activeDays: { $size: "$days" } } },
    ]),
    OrderModel.aggregate([
      { $match: { "tracking.visitorId": { $in: ids } } },
      { $group: { _id: "$tracking.visitorId", n: { $sum: 1 } } },
    ]),
  ]);
  const flags = {};
  for (const r of seen) flags[r._id] = { firstSeen: r.firstSeen, activeDays: r.activeDays, orders: 0 };
  for (const r of orders) flags[r._id] = { ...(flags[r._id] || {}), orders: r.n };
  return flags;
};
