import crypto from "crypto";
import { BillingModel } from "../../common/models/billing.model.js";
import { syncPathaoOrders } from "../services/pathaoOrderSync.service.js";
import { logger } from "../../common/config/logger.js";

// Pathao's own auto bills (see pathaoBill.service.js)
const PATHAO_BILLING_METHOD = "pathao";

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const isDayKey = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ""));
// Previous Bangladesh calendar day, whatever timezone the server runs in
const bdYesterday = () => new Date(Date.now() + 6 * 3600000 - 86400000).toISOString().slice(0, 10);

// Plexivia calls with a shared key; without PLEXIVIA_SYNC_KEY set the endpoint stays closed
export const requirePlexiviaKey = (req, res, next) => {
  const expected = process.env.PLEXIVIA_SYNC_KEY || "";
  const given = String(req.headers["x-plexivia-key"] || "");
  const ok =
    expected.length > 0 &&
    given.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  if (!ok) return res.status(401).json({ success: false, message: "Invalid sync key" });
  return next();
};

/**
 * One day's bills as a single summary for Plexivia:
 * Pathao bills are totalled per bill type, every other bill is listed on its own.
 * Pathao is synced first so the day's courier charges are current.
 */
export const getDailyBillSummary = async (req, res, next) => {
  try {
    const day = isDayKey(req.query.date) ? req.query.date : bdYesterday();

    let pathaoSync = "skipped";
    if (req.query.sync !== "false") {
      try {
        const result = await syncPathaoOrders("PLEXIVIA");
        pathaoSync = result?.skipped ? `skipped: ${result.reason}` : "done";
      } catch (err) {
        pathaoSync = `failed: ${err.message}`;
        logger.warn({ err: err.message }, "[PlexiviaSync] Pathao sync before daily summary failed");
      }
    }

    const bills = await BillingModel.find({
      billingDate: { $gte: new Date(`${day}T00:00:00.000+06:00`), $lte: new Date(`${day}T23:59:59.999+06:00`) },
      // Only money actually spent; Pathao bills are dated the day Pathao took its charge
      status: "paid",
    })
      .populate("billTypeId", "name")
      .sort({ billingDate: 1 })
      .lean();

    const pathaoGroups = new Map();
    const others = [];
    for (const b of bills) {
      const type = b.billTypeId?.name || "Other";
      const amount = round2(b.totalAmount ?? b.amount);
      if (b.billingMethod === PATHAO_BILLING_METHOD) {
        const group = pathaoGroups.get(type) || { label: `Pathao - ${type}`, quantity: 0, amount: 0 };
        group.quantity += 1;
        group.amount = round2(group.amount + amount);
        pathaoGroups.set(type, group);
      } else {
        others.push({ label: b.title || b.name || type, type, amount, status: b.status });
      }
    }

    const lineItems = [
      ...pathaoGroups.values(),
      ...others.map((o) => ({ label: `${o.label} (${o.type})`, quantity: 1, amount: o.amount })),
    ];
    const total = round2(lineItems.reduce((acc, li) => acc + li.amount, 0));

    return res.json({
      success: true,
      data: { date: day, bills_count: bills.length, total, paid: total, line_items: lineItems, pathao_sync: pathaoSync },
    });
  } catch (error) {
    return next(error);
  }
};
