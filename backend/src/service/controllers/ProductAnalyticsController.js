import { ProductEventModel } from "../../common/models/productEvent.model.js";
import { OrderModel } from "../../common/models/order.model.js";
import { logger } from "../../common/config/logger.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;
const PRESET_DAYS = { "7": 7, "15": 15, "30": 30 };

// Midnight (Asia/Dhaka) at the start of today, as a UTC Date
const startOfDhakaToday = () => {
  const d = new Date(Date.now() + DHAKA_OFFSET_MS);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - DHAKA_OFFSET_MS);
};

const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ""));

// ?preset=today|yesterday|7|15|30  or  ?preset=custom&from=YYYY-MM-DD&to=YYYY-MM-DD (dates are Asia/Dhaka days)
const rangeOf = (query) => {
  const todayStart = startOfDhakaToday();
  const preset = String(query.preset || "today");

  if (preset === "custom") {
    if (!isDate(query.from) || !isDate(query.to)) return null;
    const from = new Date(`${query.from}T00:00:00+06:00`);
    const to = new Date(`${query.to}T23:59:59.999+06:00`);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) return null;
    // Raw events are kept 90 days, so a longer window would silently show partial data
    if (to - from > 92 * DAY_MS) return null;
    return { from, to, preset };
  }
  if (preset === "yesterday") {
    return { from: new Date(todayStart.getTime() - DAY_MS), to: new Date(todayStart.getTime() - 1), preset };
  }
  if (PRESET_DAYS[preset]) {
    // "Last 7 days" = today plus the 6 days before it
    return { from: new Date(todayStart.getTime() - (PRESET_DAYS[preset] - 1) * DAY_MS), to: new Date(), preset };
  }
  return { from: todayStart, to: new Date(), preset: "today" };
};

const pct = (num, den) => (den > 0 ? Math.round((num / den) * 1000) / 10 : 0);

// Website orders (online, not cancelled/fake) placed in the range - the real "converted" number
const countWebsiteOrders = async (range) => {
  const [agg] = await OrderModel.aggregate([
    {
      $match: {
        orderType: "online",
        status: { $nin: ["cancelled", "fake"] },
        createdAt: { $gte: range.from, $lte: range.to },
      },
    },
    { $group: { _id: null, orders: { $sum: 1 }, revenue: { $sum: "$totals.total" } } },
  ]);
  return { orders: agg?.orders || 0, revenue: agg?.revenue || 0 };
};

// Per-product funnel: views -> add to cart -> checkout -> purchase, with unique visitor counts
export const getProductFunnel = async (req, res) => {
  try {
    const range = rangeOf(req.query);
    if (!range) return res.status(400).json({ status: "error", message: "Invalid date range." });

    const match = { createdAt: { $gte: range.from, $lte: range.to } };
    const q = String(req.query.q || "").trim();
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      match.$or = [{ productName: rx }, { productKey: rx }];
    }

    const [rows, overallRows, website] = await Promise.all([
      ProductEventModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: { productKey: "$productKey", eventType: "$eventType" },
            total: { $sum: 1 },
            qty: { $sum: "$quantity" },
            value: { $sum: "$value" },
            visitors: { $addToSet: "$visitorId" },
            name: { $last: "$productName" },
          },
        },
        {
          $project: {
            total: 1, qty: 1, value: 1, name: 1,
            unique: { $size: { $setDifference: ["$visitors", [""]] } },
          },
        },
      ]),
      // Unique visitors across all products per step (a visitor who viewed 3 products counts once)
      ProductEventModel.aggregate([
        { $match: { createdAt: { $gte: range.from, $lte: range.to } } },
        { $group: { _id: "$eventType", total: { $sum: 1 }, visitors: { $addToSet: "$visitorId" } } },
        { $project: { total: 1, unique: { $size: { $setDifference: ["$visitors", [""]] } } } },
      ]),
      countWebsiteOrders(range),
    ]);

    const byProduct = new Map();
    for (const r of rows) {
      const key = r._id.productKey;
      if (!byProduct.has(key)) {
        byProduct.set(key, {
          productKey: key,
          name: key,
          view: { total: 0, unique: 0 },
          add_to_cart: { total: 0, unique: 0 },
          checkout: { total: 0, unique: 0 },
          purchase: { total: 0, unique: 0, qty: 0, value: 0 },
        });
      }
      const p = byProduct.get(key);
      if (r.name) p.name = r.name;
      p[r._id.eventType] = { total: r.total, unique: r.unique, qty: r.qty, value: r.value };
    }

    const data = [...byProduct.values()]
      .map((p) => ({
        ...p,
        cartRate: pct(p.add_to_cart.unique, p.view.unique),
        checkoutRate: pct(p.checkout.unique, p.add_to_cart.unique),
        purchaseRate: pct(p.purchase.unique, p.view.unique),
      }))
      .sort((a, b) => b.view.total - a.view.total);

    const overall = Object.fromEntries(overallRows.map((r) => [r._id, { total: r.total, unique: r.unique }]));
    const step = (type) => overall[type] || { total: 0, unique: 0 };

    // Funnel steps use unique visitors; "orders" is the real website order count
    const funnel = {
      views: step("view"),
      addToCart: step("add_to_cart"),
      checkout: step("checkout"),
      orders: website.orders,
      revenue: website.revenue,
      rates: {
        viewToCart: pct(step("add_to_cart").unique, step("view").unique),
        cartToCheckout: pct(step("checkout").unique, step("add_to_cart").unique),
        checkoutToOrder: pct(website.orders, step("checkout").unique),
        viewToOrder: pct(website.orders, step("view").unique),
      },
    };

    return res.json({ status: "success", data, funnel, range });
  } catch (err) {
    logger?.warn?.(`[ProductAnalytics] Failed to load product analytics. ${err.message}`);
    return res.status(500).json({ status: "error", message: "Failed to load product analytics.", detail: err.message });
  }
};

// Day-by-day totals for the chart, plus a per-product daily series for the top products (one color each)
export const getProductTrend = async (req, res) => {
  try {
    const range = rangeOf(req.query);
    if (!range) return res.status(400).json({ status: "error", message: "Invalid date range." });
    const metric = ["view", "add_to_cart", "checkout", "purchase"].includes(req.query.metric) ? req.query.metric : "view";
    const hourly = range.to - range.from <= DAY_MS + 1000;

    const bucket = hourly
      ? { $dateToString: { format: "%H:00", date: "$createdAt", timezone: "Asia/Dhaka" } }
      : { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Dhaka" } };

    const [totals, perProduct] = await Promise.all([
      ProductEventModel.aggregate([
        { $match: { createdAt: { $gte: range.from, $lte: range.to } } },
        { $group: { _id: { bucket, type: "$eventType" }, count: { $sum: 1 } } },
        { $sort: { "_id.bucket": 1 } },
      ]),
      ProductEventModel.aggregate([
        { $match: { createdAt: { $gte: range.from, $lte: range.to }, eventType: metric } },
        {
          $group: {
            _id: { bucket, productKey: "$productKey" },
            count: { $sum: 1 },
            name: { $last: "$productName" },
          },
        },
      ]),
    ]);

    const buckets = new Map();
    for (const t of totals) {
      const row = buckets.get(t._id.bucket) || { bucket: t._id.bucket, view: 0, add_to_cart: 0, checkout: 0, purchase: 0 };
      row[t._id.type] = t.count;
      buckets.set(t._id.bucket, row);
    }

    // Keep the 8 products with the most activity so the chart stays readable
    const sumByProduct = new Map();
    const names = new Map();
    for (const r of perProduct) {
      sumByProduct.set(r._id.productKey, (sumByProduct.get(r._id.productKey) || 0) + r.count);
      if (r.name) names.set(r._id.productKey, r.name);
    }
    const top = [...sumByProduct.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([key]) => key);
    const series = top.map((key) => ({ productKey: key, name: names.get(key) || key, total: sumByProduct.get(key) }));
    const rowsByBucket = new Map();
    for (const r of perProduct) {
      if (!top.includes(r._id.productKey)) continue;
      const row = rowsByBucket.get(r._id.bucket) || { bucket: r._id.bucket };
      row[r._id.productKey] = r.count;
      rowsByBucket.set(r._id.bucket, row);
    }

    const sortBuckets = (m) => [...m.values()].sort((a, b) => a.bucket.localeCompare(b.bucket));
    return res.json({
      status: "success",
      data: {
        hourly,
        metric,
        totals: sortBuckets(buckets),
        series,
        byProduct: sortBuckets(rowsByBucket),
      },
    });
  } catch (err) {
    logger?.warn?.(`[ProductAnalytics] Failed to load trend. ${err.message}`);
    return res.status(500).json({ status: "error", message: "Failed to load trend.", detail: err.message });
  }
};

// Real-time view of today: hourly activity, visitors active right now and the latest actions
export const getLiveActivity = async (req, res) => {
  try {
    const since = startOfDhakaToday();
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);

    const [hourly, activeNow, recent] = await Promise.all([
      ProductEventModel.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: { hour: { $hour: { date: "$createdAt", timezone: "Asia/Dhaka" } }, type: "$eventType" },
            count: { $sum: 1 },
          },
        },
      ]),
      // Not distinct(): the database connection runs in Stable API strict mode, which rejects that command
      ProductEventModel.aggregate([
        { $match: { createdAt: { $gte: fiveMinAgo }, visitorId: { $ne: "" } } },
        { $group: { _id: "$visitorId" } },
        { $count: "n" },
      ]),
      ProductEventModel.find({ createdAt: { $gte: since } })
        .select("productKey productName eventType quantity value source device ipAddress visitorId createdAt")
        .sort({ createdAt: -1 })
        .limit(40)
        .lean(),
    ]);

    const hours = Array.from({ length: 24 }, (_, h) => ({ hour: h, view: 0, add_to_cart: 0, checkout: 0, purchase: 0 }));
    for (const r of hourly) hours[r._id.hour][r._id.type] = r.count;

    return res.json({ status: "success", data: { hourly: hours, activeNow: activeNow[0]?.n || 0, recent } });
  } catch (err) {
    logger?.warn?.(`[ProductAnalytics] Failed to load live activity. ${err.message}`);
    return res.status(500).json({ status: "error", message: "Failed to load live activity.", detail: err.message });
  }
};

// One product: daily trend, traffic sources, devices and the most recent individual actions
export const getProductDetail = async (req, res) => {
  try {
    const range = rangeOf(req.query);
    if (!range) return res.status(400).json({ status: "error", message: "Invalid date range." });
    const productKey = String(req.params.productKey || "").trim();
    const match = { productKey, createdAt: { $gte: range.from, $lte: range.to } };

    const [daily, sources, devices, recent] = await Promise.all([
      ProductEventModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: { day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Dhaka" } }, type: "$eventType" },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.day": 1 } },
      ]),
      ProductEventModel.aggregate([
        { $match: { ...match, eventType: "view" } },
        { $group: { _id: "$source", views: { $sum: 1 } } },
        { $sort: { views: -1 } },
        { $limit: 10 },
      ]),
      ProductEventModel.aggregate([
        { $match: { ...match, eventType: "view" } },
        { $group: { _id: "$device", views: { $sum: 1 } } },
      ]),
      ProductEventModel.find(match)
        .select("eventType visitorId quantity value source device ipAddress createdAt")
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
    ]);

    const dayMap = new Map();
    for (const d of daily) {
      const row = dayMap.get(d._id.day) || { day: d._id.day, view: 0, add_to_cart: 0, checkout: 0, purchase: 0 };
      row[d._id.type] = d.count;
      dayMap.set(d._id.day, row);
    }

    return res.json({
      status: "success",
      data: {
        productKey,
        daily: [...dayMap.values()],
        sources: sources.map((s) => ({ source: s._id || "direct", views: s.views })),
        devices: devices.map((d) => ({ device: d._id, views: d.views })),
        recent,
      },
    });
  } catch (err) {
    logger?.warn?.(`[ProductAnalytics] Failed to load product details. ${err.message}`);
    return res.status(500).json({ status: "error", message: "Failed to load product details.", detail: err.message });
  }
};
