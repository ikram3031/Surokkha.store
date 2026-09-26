import { OrderModel } from '../../common/models/order.model.js';
import { MemberModel } from '../../common/models/member.model.js';

export const dailyOrders = async (req, res, next) => {
  try {
    const days = Math.max(1, parseInt(req.query.days || '30', 10));

    // Use BD timezone offset (+06:00) for day boundaries
    const OFFSET_MS = 6 * 60 * 60 * 1000;
    const nowLocal = new Date(Date.now() + OFFSET_MS);
    const todayLocal = new Date(nowLocal);
    todayLocal.setUTCHours(0, 0, 0, 0);
    // Convert back to UTC-equivalent for MongoDB $match
    const from = new Date(todayLocal.getTime() - (days - 1) * 24 * 60 * 60 * 1000 - OFFSET_MS);

    const pipeline = [
      { $match: { active: { $ne: false }, createdAt: { $gte: from } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: '+06:00' } }, count: { $sum: 1 } } },
      { $sort: { '_id': 1 } },
    ];

    const agg = await OrderModel.aggregate(pipeline);
    const countsByDate = Object.fromEntries(agg.map((r) => [r._id, r.count]));

    const result = [];
    for (let i = 0; i < days; i++) {
      // Generate date key in BD local time to match $dateToString timezone: '+06:00'
      const d = new Date(from.getTime() + i * 24 * 60 * 60 * 1000 + OFFSET_MS);
      const key = d.toISOString().slice(0, 10);
      result.push({ date: key, count: countsByDate[key] || 0 });
    }

    return res.json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
};

export const getKpiStats = async (req, res, next) => {
  try {
    const range = req.query.range || '30days';
    const OFFSET_MS = 6 * 60 * 60 * 1000; // BD Timezone (+06:00)

    const nowUtc = new Date();
    const nowLocal = new Date(nowUtc.getTime() + OFFSET_MS);

    const todayLocalMidnight = new Date(nowLocal);
    todayLocalMidnight.setUTCHours(0, 0, 0, 0);

    let days = 30;
    if (range === 'today') {
      days = 1;
    } else if (range === '7days') {
      days = 7;
    } else if (range === '30days') {
      days = 30;
    } else if (range === '3months') {
      days = 90;
    }

    // Current period start (local midnight translated back to UTC)
    const currentStart = new Date(todayLocalMidnight.getTime() - (days - 1) * 24 * 60 * 60 * 1000 - OFFSET_MS);
    const currentEnd = nowUtc;

    // Previous period
    const prevEnd = currentStart;
    const prevStart = new Date(currentStart.getTime() - days * 24 * 60 * 60 * 1000);

    // 1. Current Stats (Orders)
    const currentOrdersAgg = await OrderModel.aggregate([
      { $match: { active: { $ne: false }, status: 'completed', createdAt: { $gte: currentStart, $lte: currentEnd } } },
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

    // Current Stats (Members)
    const currentMembersCount = await MemberModel.countDocuments({
      createdAt: { $gte: currentStart, $lte: currentEnd },
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

    // Previous Stats (Members)
    const previousMembersCount = await MemberModel.countDocuments({
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
    const range = req.query.range || '30days';
    const OFFSET_MS = 6 * 60 * 60 * 1000; // BD Timezone (+06:00)

    const nowUtc = new Date();
    const nowLocal = new Date(nowUtc.getTime() + OFFSET_MS);

    const todayLocalMidnight = new Date(nowLocal);
    todayLocalMidnight.setUTCHours(0, 0, 0, 0);

    let days = 30;
    if (range === 'today') {
      days = 1;
    } else if (range === '7days') {
      days = 7;
    } else if (range === '30days') {
      days = 30;
    } else if (range === '3months') {
      days = 90;
    }

    const currentStart = new Date(todayLocalMidnight.getTime() - (days - 1) * 24 * 60 * 60 * 1000 - OFFSET_MS);

    const agg = await OrderModel.aggregate([
      { $match: { active: { $ne: false }, createdAt: { $gte: currentStart } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const counts = {
      processing: 0,
      shipped: 0,
      completed: 0,
      cancelled: 0,
    };

    agg.forEach((item) => {
      if (item._id && typeof counts[item._id] !== 'undefined') {
        counts[item._id] = item.count;
      }
    });

    return res.json({
      status: 'success',
      data: {
        statusCounts: counts,
      },
    });
  } catch (err) {
    next(err);
  }
};

export default { dailyOrders, getKpiStats, getOrderStatusDistribution };
