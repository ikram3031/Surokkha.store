import crypto from "crypto";
import { BillingModel } from "../../common/models/billing.model.js";
import { StoreSettingsModel } from "../../common/models/storeSettings.model.js";
import { PaymentModel } from "../../common/models/payment.model.js";
import "../../common/models/order.model.js";
import { syncPathaoOrders } from "../services/pathaoOrderSync.service.js";
import { logger } from "../../common/config/logger.js";

// Pathao's own auto bills (see pathaoBill.service.js)
const PATHAO_BILLING_METHOD = "pathao";

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const isDayKey = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ""));
// Previous Bangladesh calendar day, whatever timezone the server runs in
const bdYesterday = () => new Date(Date.now() + 6 * 3600000 - 86400000).toISOString().slice(0, 10);

const sha256 = (v) => crypto.createHash("sha256").update(String(v)).digest("hex");
const loadSync = async () => (await StoreSettingsModel.findOne({ key: "default" }).lean())?.plexiviaSync || {};

// Plexivia calls with the shared key set in Settings → Integrations. Only its hash is stored;
// no key saved (or sync switched off) means the endpoints stay closed.
export const requirePlexiviaKey = async (req, res, next) => {
  try {
    const sync = await loadSync();
    const given = String(req.headers["x-plexivia-key"] || "");
    const ok =
      sync.isEnabled &&
      sync.keyHash &&
      given.length > 0 &&
      crypto.timingSafeEqual(Buffer.from(sha256(given)), Buffer.from(sync.keyHash));
    if (!ok) return res.status(401).json({ success: false, message: "Invalid sync key" });
    // Remember the last successful connection, for the dashboard card
    StoreSettingsModel.updateOne(
      { key: "default" },
      { $set: { "plexiviaSync.lastSeenAt": new Date(), "plexiviaSync.lastSeenIp": req.ip || "", "plexiviaSync.lastEndpoint": req.path } }
    ).catch(() => {});
    return next();
  } catch (error) {
    return next(error);
  }
};

// GET /plexivia/ping — lets Plexivia's "Test connection" confirm the keys match
export const pingPlexivia = (_req, res) => res.json({ success: true, data: { store: "surokkha", at: new Date().toISOString() } });

// ---- Dashboard (Owner) management of the key ----
const toSyncResponse = (s = {}) => ({
  isEnabled: Boolean(s.isEnabled),
  hasKey: Boolean(s.keyHash),
  keyHint: s.keyHint || "",
  keyUpdatedAt: s.keyUpdatedAt || null,
  lastSeenAt: s.lastSeenAt || null,
  lastSeenIp: s.lastSeenIp || "",
  lastEndpoint: s.lastEndpoint || "",
});

// GET /settings/plexivia-sync
export const getPlexiviaSyncSettings = async (_req, res, next) => {
  try {
    return res.json({ status: "success", data: toSyncResponse(await loadSync()) });
  } catch (error) {
    return next(error);
  }
};

// PUT /settings/plexivia-sync  { isEnabled, key? } — a new key replaces the old one at once
export const updatePlexiviaSyncSettings = async (req, res, next) => {
  try {
    const body = req.body || {};
    const set = { "plexiviaSync.isEnabled": Boolean(body.isEnabled) };
    const key = String(body.key || "").trim();
    if (key) {
      if (key.length < 32) return res.status(400).json({ status: "error", message: "Key must be at least 32 characters" });
      set["plexiviaSync.keyHash"] = sha256(key);
      set["plexiviaSync.keyHint"] = `…${key.slice(-4)}`;
      set["plexiviaSync.keyUpdatedAt"] = new Date();
    }
    const doc = await StoreSettingsModel.findOneAndUpdate({ key: "default" }, { $set: set }, { new: true, upsert: true }).lean();
    return res.json({ status: "success", message: "Plexivia sync settings saved", data: toSyncResponse(doc?.plexiviaSync) });
  } catch (error) {
    return next(error);
  }
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

/**
 * One day's money received for Plexivia: every paid / partial customer payment
 * recorded that day, with the order it belongs to.
 * GET /plexivia/daily-payment-summary?date=YYYY-MM-DD (default: yesterday, Bangladesh time)
 */
export const getDailyPaymentSummary = async (req, res, next) => {
  try {
    const day = isDayKey(req.query.date) ? req.query.date : bdYesterday();
    const payments = await PaymentModel.find({
      paymentDate: { $gte: new Date(`${day}T00:00:00.000+06:00`), $lte: new Date(`${day}T23:59:59.999+06:00`) },
      status: { $in: ["paid", "partial"] },
      paidAmount: { $gt: 0 },
      isActive: { $ne: false },
    })
      .populate("orderId", "orderNumber billingInfo.fullName billingInfo.phone items.name items.quantity totals.total status")
      .sort({ paymentDate: 1 })
      .lean();

    const orders = payments.map((p) => {
      const o = p.orderId || {};
      return {
        order_number: o.orderNumber || "",
        customer: o.billingInfo?.fullName || "",
        phone: o.billingInfo?.phone || p.paymentPhone || "",
        items: (o.items || []).map((i) => `${i.name} x${i.quantity}`).join(", "),
        order_total: round2(o.totals?.total),
        paid: round2(p.paidAmount),
        method: p.paymentMethod,
        transaction_id: p.transactionId || "",
        status: p.status,
        paid_at: p.paymentDate,
      };
    });
    const total = round2(orders.reduce((acc, o) => acc + o.paid, 0));

    return res.json({ success: true, data: { date: day, payments_count: orders.length, total, orders } });
  } catch (error) {
    return next(error);
  }
};
