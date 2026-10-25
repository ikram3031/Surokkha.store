import { OrderModel } from '../../common/models/order.model.js';
import { CustomerModel } from '../../common/models/customer.model.js';

const OFFSET_MS = 6 * 60 * 60 * 1000; // BD Timezone (+06:00)
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_CUSTOM_DAYS = 366;
const DAYS_BY_RANGE = { today: 1, '7days': 7, '30days': 30, '3months': 90 };

// Parses YYYY-MM-DD as BD-local midnight, expressed in "shifted" ms (UTC ms + offset); null when invalid
const parseLocalDate = (value) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
  return m ? Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};

// Resolves ?range=today|month|7days|30days|3months|all|custom (+ from/to for custom) into BD-day aligned bounds.
// start is inclusive, end exclusive; prevStart/prevEnd cover the equally long period just before (empty for "all").
export const resolveRange = (query = {}) => {
  const todayLocal = Math.floor((Date.now() + OFFSET_MS) / DAY_MS) * DAY_MS;
  let range = query.range || '30days';
  let startLocal;
  let endLocal = todayLocal + DAY_MS;

  if (range === 'custom') {
    const from = parseLocalDate(query.from);
    const to = parseLocalDate(query.to);
    if (from === null || to === null) {
      range = '30days';
    } else {
      startLocal = Math.min(from, to);
      endLocal = Math.max(from, to) + DAY_MS;
      if (endLocal - startLocal > MAX_CUSTOM_DAYS * DAY_MS) startLocal = endLocal - MAX_CUSTOM_DAYS * DAY_MS;
    }
  }
  if (range === 'all') {
    return { range, start: new Date(0), end: new Date(endLocal - OFFSET_MS), days: 0, startLocal: null, prevStart: new Date(0), prevEnd: new Date(0) };
  }
  if (range === 'month') {
    const d = new Date(todayLocal);
    startLocal = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
  } else if (range !== 'custom') {
    range = DAYS_BY_RANGE[range] ? range : '30days';
    startLocal = todayLocal - (DAYS_BY_RANGE[range] - 1) * DAY_MS;
  }

  const days = Math.round((endLocal - startLocal) / DAY_MS);
  return {
    range,
    start: new Date(startLocal - OFFSET_MS),
    end: new Date(endLocal - OFFSET_MS),
    days,
    startLocal,
    prevStart: new Date(startLocal - days * DAY_MS - OFFSET_MS),
    prevEnd: new Date(startLocal - OFFSET_MS),
  };
};

export const dailyOrders = async (req, res, next) => {
  try {
    // Follow the dashboard range filter; the legacy ?days=N (last N days) still works without ?range
    let startLocal;
    let days;
    if (req.query.range && req.query.range !== 'all') {
      const r = resolveRange(req.query);
      startLocal = r.startLocal;
      days = r.days;
    } else {
      days = Math.min(MAX_CUSTOM_DAYS, Math.max(1, parseInt(req.query.days || '30', 10)));
      startLocal = Math.floor((Date.now() + OFFSET_MS) / DAY_MS) * DAY_MS - (days - 1) * DAY_MS;
    }
    const from = new Date(startLocal - OFFSET_MS);
    const to = new Date(startLocal + days * DAY_MS - OFFSET_MS);

    const pipeline = [
      { $match: { active: { $ne: false }, createdAt: { $gte: from, $lt: to } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: '+06:00' } },
          count: { $sum: 1 },
          placed: {
            $sum: {
              $cond: [
                { $in: ['$status', ['cancelled', 'fake']] },
                0,
                1,
              ],
            },
          },
          delivered: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'completed'] },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { '_id': 1 } },
    ];

    const agg = await OrderModel.aggregate(pipeline);
    const dataByDate = Object.fromEntries(
      agg.map((r) => [
        r._id,
        {
          count: r.count || 0,
          placed: r.placed || 0,
          delivered: r.delivered || 0,
        },
      ])
    );

    const result = [];
    for (let i = 0; i < days; i++) {
      // Generate date key in BD local time to match $dateToString timezone: '+06:00'
      const d = new Date(startLocal + i * DAY_MS);
      const key = d.toISOString().slice(0, 10);
      const dayData = dataByDate[key] || { count: 0, placed: 0, delivered: 0 };
      result.push({
        date: key,
        count: dayData.count,
        placed: dayData.placed,
        delivered: dayData.delivered,
      });
    }

    return res.json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
};

export const getKpiStats = async (req, res, next) => {
  try {
    const { start: currentStart, end: currentEnd, prevStart, prevEnd } = resolveRange(req.query);

    // 1. Current Stats (Orders)
    const currentOrdersAgg = await OrderModel.aggregate([
      { $match: { active: { $ne: false }, status: 'completed', createdAt: { $gte: currentStart, $lt: currentEnd } } },
      {
        $group: {
          _id: null,
          sales: { $sum: '$totals.subtotal' },
          count: { $sum: 1 },
        },
      },
    ]);

    const currentSales = currentOrdersAgg[0]?.sales || 0;
    const currentOrdersCount = currentOrdersAgg[0]?.count || 0;
    const currentAOV = currentOrdersCount > 0 ? currentSales / currentOrdersCount : 0;

    // Current Stats (Customers)
    const currentMembersCount = await CustomerModel.countDocuments({
      createdAt: { $gte: currentStart, $lt: currentEnd },
    });

    // 2. Previous Stats (Orders)
    const previousOrdersAgg = await OrderModel.aggregate([
      { $match: { active: { $ne: false }, status: 'completed', createdAt: { $gte: prevStart, $lt: prevEnd } } },
      {
        $group: {
          _id: null,
          sales: { $sum: '$totals.subtotal' },
          count: { $sum: 1 },
        },
      },
    ]);

    const previousSales = previousOrdersAgg[0]?.sales || 0;
    const previousOrdersCount = previousOrdersAgg[0]?.count || 0;
    const previousAOV = previousOrdersCount > 0 ? previousSales / previousOrdersCount : 0;

    // Previous Stats (Customers)
    const previousMembersCount = await CustomerModel.countDocuments({
      createdAt: { $gte: prevStart, $lt: prevEnd },
    });

    // 3. Trends
    const salesTrend = previousSales > 0 ? ((currentSales - previousSales) / previousSales) * 100 : 0;
    const ordersTrend = previousOrdersCount > 0 ? ((currentOrdersCount - previousOrdersCount) / previousOrdersCount) * 100 : 0;
    const aovTrend = previousAOV > 0 ? ((currentAOV - previousAOV) / previousAOV) * 100 : 0;
    const membersTrend = previousMembersCount > 0 ? ((currentMembersCount - previousMembersCount) / previousMembersCount) * 100 : 0;

    return res.json({
      status: 'success',
      data: {
        sales: currentSales,
        completedOrders: currentOrdersCount,
        aov: currentAOV,
        members: currentMembersCount,
        trends: {
          sales: salesTrend.toFixed(1),
          orders: ordersTrend.toFixed(1),
          aov: aovTrend.toFixed(1),
          members: membersTrend.toFixed(1),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getOrderStatusDistribution = async (req, res, next) => {
  try {
    const { start: currentStart, end: currentEnd } = resolveRange(req.query);

    // Fake orders are stored inactive (active: false), so include them by status; other inactive orders are deleted
    const agg = await OrderModel.aggregate([
      { $match: { createdAt: { $gte: currentStart, $lt: currentEnd }, $or: [{ active: { $ne: false } }, { status: 'fake' }] } },
      { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$totals.total' } } }
    ]);

    // One bucket per order status in the model (pending, processing, hold, shipped, ...)
    const statuses = OrderModel.schema.path('status').enumValues;
    const counts = Object.fromEntries(statuses.map((st) => [st, 0]));
    const amounts = Object.fromEntries(statuses.map((st) => [st, 0]));

    agg.forEach((item) => {
      if (item._id && typeof counts[item._id] !== 'undefined') {
        counts[item._id] = item.count;
        amounts[item._id] = item.amount || 0;
      }
    });

    return res.json({
      status: 'success',
      data: {
        statusCounts: counts,
        statusAmounts: amounts,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Best-selling products over a range: units sold and sales amount (cancelled, fake and returned orders excluded)
export const getTopProducts = async (req, res, next) => {
  try {
    const { start, end } = resolveRange(req.query);
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit || '8', 10)));

    const products = await OrderModel.aggregate([
      { $match: { active: { $ne: false }, createdAt: { $gte: start, $lt: end }, status: { $nin: ['cancelled', 'fake', 'return'] } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: { $cond: [{ $gt: [{ $strLenCP: { $ifNull: ['$items.productId', ''] } }, 0] }, '$items.productId', '$items.name'] },
          name: { $first: '$items.name' },
          image: { $first: '$items.image' },
          unitsSold: { $sum: '$items.quantity' },
          salesAmount: { $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] } },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { unitsSold: -1, salesAmount: -1 } },
      { $limit: limit },
    ]);

    return res.json({ status: 'success', data: { range: req.query.range || '30days', products } });
  } catch (err) {
    next(err);
  }
};

export default { dailyOrders, getKpiStats, getOrderStatusDistribution, getTopProducts };
