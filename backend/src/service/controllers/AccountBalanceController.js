import { PaymentModel } from "../../common/models/payment.model.js";
import { BillingModel } from "../../common/models/billing.model.js";
import { InvestmentModel } from "../../common/models/investment.model.js";
import { OrderModel } from "../../common/models/order.model.js";
import { logger } from "../../common/config/logger.js";
import { invoiceDateFromId } from "../services/pathaoCourierEvents.service.js";

// All day and month boundaries are Bangladesh calendar days, whatever timezone the server runs in
const BD_OFFSET_MS = 6 * 60 * 60 * 1000;
const bdDayKey = (date) => new Date(new Date(date).getTime() + BD_OFFSET_MS).toISOString().slice(0, 10);
const bdDayStart = (key) => new Date(`${key}T00:00:00.000+06:00`);
const bdDayEnd = (key) => new Date(`${key}T23:59:59.999+06:00`);
const shiftDays = (key, days) => bdDayKey(new Date(bdDayStart(key).getTime() + days * 86400000));
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const OPEN_STATUSES = ["pending", "partial", "active"];
const VOID_STATUSES = ["failed", "cancelled"];

// Start/end of the period from a preset or YYYY-MM-DD dates; null means unbounded
const resolveDateRange = (preset, startQuery, endQuery) => {
  const isDay = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ""));
  if (startQuery || endQuery) {
    const start = startQuery ? (isDay(startQuery) ? bdDayStart(startQuery) : new Date(startQuery)) : null;
    const end = endQuery ? (isDay(endQuery) ? bdDayEnd(endQuery) : new Date(endQuery)) : null;
    return { start, end, resolvedPreset: "custom" };
  }

  const today = bdDayKey(new Date());
  const p = (preset || "all").toString().toLowerCase().trim();
  if (p === "today") return { start: bdDayStart(today), end: bdDayEnd(today), resolvedPreset: "today" };
  if (p === "yesterday") {
    const y = shiftDays(today, -1);
    return { start: bdDayStart(y), end: bdDayEnd(y), resolvedPreset: "yesterday" };
  }
  if (["7days", "7_days", "last7days"].includes(p)) return { start: bdDayStart(shiftDays(today, -6)), end: bdDayEnd(today), resolvedPreset: "7days" };
  if (["30days", "30_days", "last30days"].includes(p)) return { start: bdDayStart(shiftDays(today, -29)), end: bdDayEnd(today), resolvedPreset: "30days" };
  if (["this_month", "thismonth", "month"].includes(p)) return { start: bdDayStart(`${today.slice(0, 7)}-01`), end: bdDayEnd(today), resolvedPreset: "this_month" };
  return { start: null, end: null, resolvedPreset: "all" };
};

/**
 * Cash-basis balance for a period:
 *  - money in  = what customers actually paid (dated the day it arrived: Pathao payout day for courier orders) + investments taken
 *  - money out = what was actually paid on bills (Investment Return bills included), dated by billingDate
 *  - opening   = all money in minus money out before the period; closing = opening + in - out
 * Unpaid amounts never touch the balance; they show as receivable (customers owe us) and payable (we owe on bills).
 */
export const getAccountBalance = async (req, res, next) => {
  try {
    const { preset, startDate, endDate, from, to } = req.query;
    const { start, end, resolvedPreset } = resolveDateRange(preset, startDate || from, endDate || to);

    const [payments, bills, investments] = await Promise.all([
      PaymentModel.find({ status: { $nin: VOID_STATUSES } })
        .select("orderId status paidAmount pendingAmount totalAmount paymentDate createdAt")
        .lean(),
      BillingModel.find({ status: { $nin: VOID_STATUSES } })
        .select("status paidAmount pendingAmount totalAmount amount billingDate createdAt investmentId")
        .lean(),
      InvestmentModel.find({})
        .select("takenAmount returnedAmount takenDate returnedDate createdAt")
        .lean(),
    ]);

    // Courier orders: the money arrives on Pathao's payout day (the invoice id's date)
    const orderIds = payments.map((p) => p.orderId).filter(Boolean);
    const orders = await OrderModel.find({ _id: { $in: orderIds } })
      .select("courier.settlement.invoiceId courier.settlement.settledAt courier.settlement.invoicedAt courier.settlement.status")
      .lean();
    const payoutDateByOrder = new Map();
    for (const o of orders) {
      const s = o.courier?.settlement || {};
      const date = invoiceDateFromId(s.invoiceId) || (["invoiced", "settled"].includes(s.status) ? s.settledAt || s.invoicedAt : null);
      if (date) payoutDateByOrder.set(String(o._id), date);
    }

    // Each cash movement: { date, amount, kind }
    const flows = [];
    let receivable = 0;
    for (const p of payments) {
      const paid = Number(p.paidAmount || 0);
      if (paid > 0) {
        const date = payoutDateByOrder.get(String(p.orderId)) || p.paymentDate || p.createdAt;
        flows.push({ date, amount: paid, kind: "receipts" });
      }
      if (OPEN_STATUSES.includes(p.status)) receivable += Number(p.pendingAmount || 0);
    }

    let payable = 0;
    for (const b of bills) {
      const paid = Number(b.paidAmount || 0);
      if (paid > 0) flows.push({ date: b.billingDate || b.createdAt, amount: paid, kind: b.investmentId ? "investmentReturns" : "bills" });
      if (OPEN_STATUSES.includes(b.status)) {
        const due = Number(b.pendingAmount ?? Math.max(0, Number(b.totalAmount || b.amount || 0) - paid));
        payable += due;
      }
    }

    let outstandingInvestment = 0;
    for (const inv of investments) {
      const takenDate = inv.takenDate || inv.createdAt;
      flows.push({ date: takenDate, amount: Number(inv.takenAmount || 0), kind: "investments" });
      // What is still owed to investors at the end of the period
      if (!end || new Date(takenDate) <= end) outstandingInvestment += Number(inv.takenAmount || 0);
      if (Number(inv.returnedAmount) > 0 && (!end || new Date(inv.returnedDate || inv.updatedAt || takenDate) <= end)) {
        outstandingInvestment -= Number(inv.returnedAmount || 0);
      }
    }

    const sign = { receipts: 1, investments: 1, bills: -1, investmentReturns: -1 };
    const period = { receipts: 0, investments: 0, bills: 0, investmentReturns: 0 };
    let openingBalance = 0;
    const dayMap = new Map();

    if (start && end) {
      for (let key = bdDayKey(start); key <= bdDayKey(end); key = shiftDays(key, 1)) {
        dayMap.set(key, { date: key, payments: 0, bills: 0, investments: 0 });
      }
    }

    for (const f of flows) {
      if (!f.date || !(f.amount > 0)) continue;
      const at = new Date(f.date);
      if (start && at < start) {
        openingBalance += sign[f.kind] * f.amount;
        continue;
      }
      if (end && at > end) continue;
      period[f.kind] += f.amount;
      const key = bdDayKey(at);
      const point = dayMap.get(key) || { date: key, payments: 0, bills: 0, investments: 0 };
      if (f.kind === "receipts") point.payments += f.amount;
      else if (f.kind === "investments") point.investments += f.amount;
      else point.bills += f.amount;
      dayMap.set(key, point);
    }

    const totalIn = period.receipts + period.investments;
    const totalOut = period.bills + period.investmentReturns;
    const closingBalance = openingBalance + totalIn - totalOut;
    outstandingInvestment = Math.max(0, outstandingInvestment);
    // What the business is worth: cash in hand plus what customers owe, minus unpaid bills and money owed to investors
    const businessAsset = closingBalance + receivable - payable - outstandingInvestment;

    const timeline = Array.from(dayMap.values())
      .map((p) => ({ ...p, payments: round2(p.payments), bills: round2(p.bills), investments: round2(p.investments) }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return res.json({
      status: "success",
      data: {
        openingBalance: round2(openingBalance),
        receipts: round2(period.receipts),
        investmentsTaken: round2(period.investments),
        totalIn: round2(totalIn),
        billsPaid: round2(period.bills),
        investmentReturns: round2(period.investmentReturns),
        totalOut: round2(totalOut),
        netFlow: round2(totalIn - totalOut),
        operatingBalance: round2(period.receipts - period.bills),
        closingBalance: round2(closingBalance),
        receivable: round2(receivable),
        payable: round2(payable),
        outstandingInvestment: round2(outstandingInvestment),
        businessAsset: round2(businessAsset),
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
