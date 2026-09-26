import { OrderModel } from '../../common/models/order.model.js';
import { ProductModel } from '../../common/models/product.model.js';
import { PaymentModel } from '../../common/models/payment.model.js';

const OFFSET_MS = 6 * 60 * 60 * 1000;

// Parses custom start or end date strings into UTC boundaries
const parseCustomDate = (dateStr, isEnd) => {
  if (!dateStr) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
    const [y, m, d] = dateStr.trim().split('-').map(Number);
    const ms = isEnd
      ? Date.UTC(y, m - 1, d, 23, 59, 59, 999) - OFFSET_MS
      : Date.UTC(y, m - 1, d, 0, 0, 0, 0) - OFFSET_MS;
    return new Date(ms);
  }
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  return null;
};

// Parses date range and channel filters for aggregation pipelines
const buildFilters = (req) => {
  const { range, startDate, endDate, channel } = req.query || {};
  const nowUtc = new Date();
  const nowBd = new Date(nowUtc.getTime() + OFFSET_MS);

  const bdYear = nowBd.getUTCFullYear();
  const bdMonth = nowBd.getUTCMonth();
  const bdDate = nowBd.getUTCDate();

  let startUtc = null;
  let endUtc = null;

  if (startDate && endDate) {
    startUtc = parseCustomDate(startDate, false);
    endUtc = parseCustomDate(endDate, true);
  }

  if (!startUtc || !endUtc) {
    if (range === 'today') {
      startUtc = new Date(Date.UTC(bdYear, bdMonth, bdDate, 0, 0, 0, 0) - OFFSET_MS);
      endUtc = new Date(Date.UTC(bdYear, bdMonth, bdDate, 23, 59, 59, 999) - OFFSET_MS);
    } else if (range === 'yesterday') {
      startUtc = new Date(Date.UTC(bdYear, bdMonth, bdDate - 1, 0, 0, 0, 0) - OFFSET_MS);
      endUtc = new Date(Date.UTC(bdYear, bdMonth, bdDate - 1, 23, 59, 59, 999) - OFFSET_MS);
    } else if (range === '7days') {
      startUtc = new Date(Date.UTC(bdYear, bdMonth, bdDate - 6, 0, 0, 0, 0) - OFFSET_MS);
      endUtc = new Date(Date.UTC(bdYear, bdMonth, bdDate, 23, 59, 59, 999) - OFFSET_MS);
    } else if (range === '30days') {
      startUtc = new Date(Date.UTC(bdYear, bdMonth, bdDate - 29, 0, 0, 0, 0) - OFFSET_MS);
      endUtc = new Date(Date.UTC(bdYear, bdMonth, bdDate, 23, 59, 59, 999) - OFFSET_MS);
    } else if (range === 'thisMonth') {
      startUtc = new Date(Date.UTC(bdYear, bdMonth, 1, 0, 0, 0, 0) - OFFSET_MS);
      endUtc = new Date(Date.UTC(bdYear, bdMonth, bdDate, 23, 59, 59, 999) - OFFSET_MS);
    } else if (range === 'lastMonth') {
      startUtc = new Date(Date.UTC(bdYear, bdMonth - 1, 1, 0, 0, 0, 0) - OFFSET_MS);
      endUtc = new Date(Date.UTC(bdYear, bdMonth, 0, 23, 59, 59, 999) - OFFSET_MS);
    } else if (range === 'thisYear') {
      startUtc = new Date(Date.UTC(bdYear, 0, 1, 0, 0, 0, 0) - OFFSET_MS);
      endUtc = new Date(Date.UTC(bdYear, bdMonth, bdDate, 23, 59, 59, 999) - OFFSET_MS);
    } else {
      startUtc = new Date(Date.UTC(bdYear, bdMonth, bdDate - 29, 0, 0, 0, 0) - OFFSET_MS);
      endUtc = new Date(Date.UTC(bdYear, bdMonth, bdDate, 23, 59, 59, 999) - OFFSET_MS);
    }
  }

  const matchQuery = {
    createdAt: { $gte: startUtc, $lte: endUtc }
  };

  if (channel === 'pos') {
    matchQuery.orderNumber = /^IS/;
  } else if (channel === 'online') {
    matchQuery.orderNumber = { $not: /^IS/ };
  }

  return { startUtc, endUtc, matchQuery, channel };
};

// Aggregates high-level revenue and order KPI summary metrics
export const getSummaryReport = async (req, res, next) => {
  try {
    const { matchQuery } = buildFilters(req);

    const agg = await OrderModel.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          grossSales: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'completed'] },
                { $add: [{ $ifNull: ['$totals.subtotal', 0] }, { $ifNull: ['$discountTotalAmount', 0] }] },
                0
              ]
            }
          },
          netSales: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'completed'] },
                { $ifNull: ['$totals.subtotal', 0] },
                0
              ]
            }
          },
          totalDiscount: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'completed'] },
                { $ifNull: ['$discountTotalAmount', 0] },
                0
              ]
            }
          },
          completedOrdersCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
            }
          },
          totalOrders: {
            $sum: {
              $cond: [{ $ne: ['$status', 'cancelled'] }, 1, 0]
            }
          },
          onlineSales: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'completed'] },
                    { $not: [{ $regexMatch: { input: { $ifNull: ['$orderNumber', ''] }, regex: '^IS' } }] }
                  ]
                },
                { $ifNull: ['$totals.subtotal', 0] },
                0
              ]
            }
          },
          posSales: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'completed'] },
                    { $regexMatch: { input: { $ifNull: ['$orderNumber', ''] }, regex: '^IS' } }
                  ]
                },
                { $ifNull: ['$totals.subtotal', 0] },
                0
              ]
            }
          }
        }
      }
    ]);

    const result = agg[0] || {
      grossSales: 0,
      netSales: 0,
      totalDiscount: 0,
      totalOrders: 0,
      completedOrdersCount: 0,
      onlineSales: 0,
      posSales: 0
    };

    result.aov = result.completedOrdersCount > 0 ? (result.netSales / result.completedOrdersCount) : 0;

    return res.json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

// Generates sales and order metrics grouped by date in Bangladesh timezone
export const getSalesTimeline = async (req, res, next) => {
  try {
    const { matchQuery } = buildFilters(req);
    const completedMatch = { ...matchQuery, status: 'completed' };

    const agg = await OrderModel.aggregate([
      { $match: completedMatch },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: '+06:00' } },
          grossSales: { $sum: { $add: [{ $ifNull: ['$totals.subtotal', 0] }, { $ifNull: ['$discountTotalAmount', 0] }] } },
          netSales: { $sum: { $ifNull: ['$totals.subtotal', 0] } },
          discount: { $sum: { $ifNull: ['$discountTotalAmount', 0] } },
          ordersCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return res.json({ status: 'success', data: agg });
  } catch (error) {
    next(error);
  }
};

// Aggregates top-performing products grouped by name and SKU from completed orders
export const getTopProductsReport = async (req, res, next) => {
  try {
    const { matchQuery } = buildFilters(req);
    const completedMatch = { ...matchQuery, status: 'completed' };

    const agg = await OrderModel.aggregate([
      { $match: completedMatch },
      { $unwind: '$items' },
      {
        $group: {
          _id: {
            name: '$items.name',
            sku: { $ifNull: ['$items.sku', '$items.productDid'] }
          },
          unitsSold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: [{ $ifNull: ['$items.quantity', 0] }, { $ifNull: ['$items.unitPrice', 0] }] } }
        }
      },
      {
        $project: {
          _id: '$_id.name',
          sku: { $ifNull: ['$_id.sku', 'N/A'] },
          unitsSold: 1,
          revenue: 1
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 100 }
    ]);

    return res.json({ status: 'success', data: agg });
  } catch (error) {
    next(error);
  }
};

// Aggregates payment statistics grouped by payment method
export const getPaymentReport = async (req, res, next) => {
  try {
    const { startUtc, endUtc, channel } = buildFilters(req);

    const pipeline = [
      {
        $match: {
          createdAt: { $gte: startUtc, $lte: endUtc }
        }
      }
    ];

    if (channel === 'pos' || channel === 'online') {
      pipeline.push(
        {
          $lookup: {
            from: 'orders',
            localField: 'orderId',
            foreignField: '_id',
            as: 'order'
          }
        },
        { $unwind: '$order' }
      );
      if (channel === 'pos') {
        pipeline.push({ $match: { 'order.orderNumber': /^IS/ } });
      } else if (channel === 'online') {
        pipeline.push({ $match: { 'order.orderNumber': { $not: /^IS/ } } });
      }
    }

    pipeline.push(
      {
        $group: {
          _id: '$paymentMethod',
          totalAmount: { $sum: { $ifNull: ['$totalAmount', 0] } },
          paidAmount: { $sum: { $ifNull: ['$paidAmount', 0] } },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } }
    );

    const agg = await PaymentModel.aggregate(pipeline);

    return res.json({ status: 'success', data: agg });
  } catch (error) {
    next(error);
  }
};

// Analyzes product stock levels, alerts, and total inventory valuation
export const getInventoryReport = async (req, res, next) => {
  try {
    const products = await ProductModel.find({ isActive: { $ne: false } })
      .select('name sku type price offerPrice stockAmount stockStatus variants')
      .lean();

    let totalValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    const productsList = [];

    products.forEach((p) => {
      let currentStock = 0;
      let val = 0;

      if (p.type === 'variant' && Array.isArray(p.variants) && p.variants.length > 0) {
        const variantStockSum = p.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
        if (variantStockSum > 0) {
          currentStock = variantStockSum;
          val = p.variants.reduce((sum, v) => sum + ((Number(v.stock) || 0) * (Number(v.price) || Number(p.price) || 0)), 0);
        } else {
          currentStock = Number(p.stockAmount) || 0;
          const avgPrice = p.variants.reduce((sum, v) => sum + (Number(v.price) || 0), 0) / p.variants.length;
          val = currentStock * (avgPrice || Number(p.price) || 0);
        }
      } else {
        currentStock = Number(p.stockAmount) || 0;
        val = currentStock * (Number(p.price) || 0);
      }

      totalValuation += val;

      if (currentStock === 0 || p.stockStatus === 'outofstock') {
        outOfStockCount++;
      } else if (currentStock > 0 && currentStock < 5) {
        lowStockCount++;
      }

      if (currentStock < 10) {
        productsList.push({
          name: p.name,
          sku: p.sku || 'N/A',
          type: p.type || 'simple',
          stock: currentStock,
          status: currentStock === 0 ? 'Out of Stock' : 'Low Stock'
        });
      }
    });

    productsList.sort((a, b) => a.stock - b.stock);

    return res.json({
      status: 'success',
      data: {
        totalValuation,
        lowStockCount,
        outOfStockCount,
        alerts: productsList.slice(0, 100)
      }
    });
  } catch (error) {
    next(error);
  }
};
