import { PaymentModel } from "../../common/models/payment.model.js";
import { BillingModel } from "../../common/models/billing.model.js";
import { InvestmentModel } from "../../common/models/investment.model.js";
import { logger } from "../../common/config/logger.js";

// Resolves start and end Date objects based on preset string or custom date parameters
const resolveDateRange = (preset, startDateQuery, endDateQuery) => {
  const now = new Date();
  if (startDateQuery || endDateQuery) {
    let start = null;
    let end = null;
    if (startDateQuery) {
      start = new Date(startDateQuery);
      if (startDateQuery.length <= 10) {
        start.setHours(0, 0, 0, 0);
      }
    }
    if (endDateQuery) {
      end = new Date(endDateQuery);
      if (endDateQuery.length <= 10) {
        end.setHours(23, 59, 59, 999);
      }
    }
    return { start, end, resolvedPreset: "custom" };
  }

  const p = (preset || "all").toString().toLowerCase().trim();
  if (p === "today") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { start, end, resolvedPreset: "today" };
  }
  if (p === "yesterday") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
    return { start, end, resolvedPreset: "yesterday" };
  }
  if (p === "7days" || p === "7_days" || p === "last7days") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { start, end, resolvedPreset: "7days" };
  }
  if (p === "30days" || p === "30_days" || p === "last30days") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { start, end, resolvedPreset: "30days" };
  }
  if (p === "this_month" || p === "thismonth" || p === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { start, end, resolvedPreset: "this_month" };
  }

  return { start: null, end: null, resolvedPreset: "all" };
};

// Formats a Date object into YYYY-MM-DD string format
const formatDateKey = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Computes account balances, financial breakdown metrics, and chart timeline data
export const getAccountBalance = async (req, res, next) => {
  try {
    const { preset, startDate, endDate, from, to } = req.query;
    const { start, end, resolvedPreset } = resolveDateRange(preset, startDate || from, endDate || to);

    const paymentMatch = { status: { $nin: ["failed", "cancelled"] } };
    const billingMatch = { status: { $nin: ["failed", "cancelled"] } };
    const investmentMatch = {};

    const paymentDateFilter = {};
    const billingDateFilter = {};
    const investmentDateFilter = {};

    if (start || end) {
      if (start) {
        paymentDateFilter.$gte = start;
        billingDateFilter.$gte = start;
        investmentDateFilter.$gte = start;
      }
      if (end) {
        paymentDateFilter.$lte = end;
        billingDateFilter.$lte = end;
        investmentDateFilter.$lte = end;
      }
    }

    const [paymentAgg, billingAgg, investmentAgg] = await Promise.all([
      PaymentModel.aggregate([
        {
          $addFields: {
            effectiveDate: { $ifNull: ["$paymentDate", "$createdAt"] },
          },
        },
        {
          $match: {
            ...paymentMatch,
            ...(Object.keys(paymentDateFilter).length > 0 ? { effectiveDate: paymentDateFilter } : {}),
          },
        },
        {
          $group: {
            _id: null,
            totalReceipt: {
              $sum: {
                $cond: [{ $gt: ["$paidAmount", 0] }, "$paidAmount", "$amount"],
              },
            },
          },
        },
      ]),
      BillingModel.aggregate([
        {
          $addFields: {
            effectiveDate: { $ifNull: ["$billingDate", "$createdAt"] },
          },
        },
        {
          $match: {
            ...billingMatch,
            ...(Object.keys(billingDateFilter).length > 0 ? { effectiveDate: billingDateFilter } : {}),
          },
        },
        {
          $group: {
            _id: null,
            totalBills: {
              $sum: {
                $cond: [{ $gt: ["$paidAmount", 0] }, "$paidAmount", "$amount"],
              },
            },
          },
        },
      ]),
      InvestmentModel.aggregate([
        {
          $addFields: {
            effectiveDate: { $ifNull: ["$takenDate", "$createdAt"] },
          },
        },
        {
          $match: {
            ...investmentMatch,
            ...(Object.keys(investmentDateFilter).length > 0 ? { effectiveDate: investmentDateFilter } : {}),
          },
        },
        {
          $group: {
            _id: null,
            totalInvestments: { $sum: "$takenAmount" },
            totalInvestmentsReturned: { $sum: "$returnedAmount" },
          },
        },
      ]),
    ]);

    const totalReceipt = paymentAgg[0]?.totalReceipt || 0;
    const totalPayments = totalReceipt;
    const totalBills = billingAgg[0]?.totalBills || 0;
    const totalInvestments = investmentAgg[0]?.totalInvestments || 0;
    const totalInvestmentsReturned = investmentAgg[0]?.totalInvestmentsReturned || 0;
    const netInvestments = totalInvestments - totalInvestmentsReturned;
    const balance = totalReceipt - totalBills;
    const businessAsset = balance - netInvestments;

    const [paymentTimelineAgg, billingTimelineAgg, investmentTimelineAgg] = await Promise.all([
      PaymentModel.aggregate([
        {
          $addFields: {
            effectiveDate: { $ifNull: ["$paymentDate", "$createdAt"] },
          },
        },
        {
          $match: {
            ...paymentMatch,
            ...(Object.keys(paymentDateFilter).length > 0 ? { effectiveDate: paymentDateFilter } : {}),
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$effectiveDate" } },
            payments: {
              $sum: {
                $cond: [{ $gt: ["$paidAmount", 0] }, "$paidAmount", "$amount"],
              },
            },
          },
        },
      ]),
      BillingModel.aggregate([
        {
          $addFields: {
            effectiveDate: { $ifNull: ["$billingDate", "$createdAt"] },
          },
        },
        {
          $match: {
            ...billingMatch,
            ...(Object.keys(billingDateFilter).length > 0 ? { effectiveDate: billingDateFilter } : {}),
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$effectiveDate" } },
            bills: {
              $sum: {
                $cond: [{ $gt: ["$paidAmount", 0] }, "$paidAmount", "$amount"],
              },
            },
          },
        },
      ]),
      InvestmentModel.aggregate([
        {
          $addFields: {
            effectiveDate: { $ifNull: ["$takenDate", "$createdAt"] },
          },
        },
        {
          $match: {
            ...investmentMatch,
            ...(Object.keys(investmentDateFilter).length > 0 ? { effectiveDate: investmentDateFilter } : {}),
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$effectiveDate" } },
            investments: { $sum: "$takenAmount" },
          },
        },
      ]),
    ]);

    const datePointMap = new Map();

    if (start && end) {
      const cursor = new Date(start);
      while (cursor <= end) {
        const key = formatDateKey(cursor);
        datePointMap.set(key, { date: key, payments: 0, bills: 0, investments: 0 });
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    paymentTimelineAgg.forEach((item) => {
      if (!item._id) return;
      const existing = datePointMap.get(item._id) || { date: item._id, payments: 0, bills: 0, investments: 0 };
      existing.payments = item.payments || 0;
      datePointMap.set(item._id, existing);
    });

    billingTimelineAgg.forEach((item) => {
      if (!item._id) return;
      const existing = datePointMap.get(item._id) || { date: item._id, payments: 0, bills: 0, investments: 0 };
      existing.bills = item.bills || 0;
      datePointMap.set(item._id, existing);
    });

    investmentTimelineAgg.forEach((item) => {
      if (!item._id) return;
      const existing = datePointMap.get(item._id) || { date: item._id, payments: 0, bills: 0, investments: 0 };
      existing.investments = item.investments || 0;
      datePointMap.set(item._id, existing);
    });

    const timeline = Array.from(datePointMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    return res.json({
      status: "success",
      data: {
        totalReceipt,
        totalPayments,
        totalBills,
        totalInvestments,
        totalInvestmentsReturned,
        netInvestments,
        balance,
        businessAsset,
        dateRange: {
          preset: resolvedPreset,
          startDate: start ? start.toISOString() : null,
          endDate: end ? end.toISOString() : null,
        },
        timeline,
      },
    });
  } catch (error) {
    logger.error({ error }, "Failed to get account balance summary");
    next(error);
  }
};
