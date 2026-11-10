import { Types } from "mongoose";
import { PurchaseModel, nextPurchaseNumber } from "../../common/models/purchase.model.js";
import { VendorModel } from "../../common/models/vendor.model.js";
import { StockItemModel } from "../../common/models/stockItem.model.js";
import { StockReceiptModel } from "../../common/models/stockReceipt.model.js";
import { PaymentTypeModel } from "../../common/models/paymentType.model.js";
import { BillingModel } from "../../common/models/billing.model.js";
import { BillTypeModel } from "../../common/models/billType.model.js";
import { applyReceipt, cancelReceipt, ReceiptError } from "../services/stockReceipt.service.js";

const PURCHASE_BILL_TYPE = "Product Purchase";
const OPEN_STATUSES = ["draft", "ordered", "received"];

class InputError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const actorOf = (req) => req.user?.name || req.user?.did || "staff";
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const toDate = (v, fallback = new Date()) => {
  if (!v) return fallback;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) throw new InputError("Invalid date.");
  return d;
};

// Stable reference shared by the purchase and its stock receipt
const stockRef = (p) => `surokkha-purchase:${p._id}`;

// Sends input errors as 400/404/409 and anything else on to the error handler
const handle = (res, next, error) => {
  if (error instanceof InputError || error instanceof ReceiptError) {
    return res.status(error.status || 400).json({ status: "error", message: error.message });
  }
  return next(error);
};

const findPurchase = async (id) => {
  const query = Types.ObjectId.isValid(id) ? { _id: id } : { purchaseNumber: String(id) };
  const p = await PurchaseModel.findOne(query);
  if (!p) throw new InputError("Purchase not found.", 404);
  return p;
};

// ---- Vendors ----

// Clean vendor fields from the request body
const vendorFields = (body = {}, partial = false) => {
  const out = {};
  if (!partial || body.name !== undefined) {
    const name = String(body.name || "").trim();
    if (!name) throw new InputError("Vendor name is required.");
    out.name = name.slice(0, 120);
  }
  for (const k of ["phone", "email", "address", "notes"]) {
    if (body[k] !== undefined) out[k] = String(body[k] || "").trim().slice(0, k === "notes" || k === "address" ? 500 : k === "phone" ? 30 : 120);
  }
  if (body.status !== undefined) out.status = body.status === "inactive" ? "inactive" : "active";
  return out;
};

// GET /purchases/vendors — vendors, searched by name or phone; ?status=all includes inactive ones
export const listVendors = async (req, res, next) => {
  try {
    const filter = req.query.status === "all" ? {} : { status: "active" };
    const q = String(req.query.q || "").trim();
    if (q) filter.$or = [{ name: new RegExp(escapeRegex(q), "i") }, { phone: new RegExp(escapeRegex(q), "i") }];
    const rows = await VendorModel.find(filter).sort({ name: 1 }).collation({ locale: "en", strength: 2 }).lean();
    const stats = await PurchaseModel.aggregate([
      { $match: { vendorId: { $in: rows.map((r) => r._id) }, status: { $in: ["ordered", "received"] } } },
      { $group: { _id: "$vendorId", count: { $sum: 1 }, total: { $sum: "$total" }, paid: { $sum: "$paidAmount" } } },
    ]);
    const byVendor = new Map(stats.map((s) => [String(s._id), s]));
    return res.json({
      status: "success",
      data: rows.map(({ _id, ...v }) => {
        const s = byVendor.get(String(_id));
        return { ...v, id: String(_id), purchaseCount: s?.count || 0, purchaseTotal: round2(s?.total), due: round2((s?.total || 0) - (s?.paid || 0)) };
      }),
    });
  } catch (error) {
    return handle(res, next, error);
  }
};

// POST /purchases/vendors
export const createVendor = async (req, res, next) => {
  try {
    const vendor = await VendorModel.create({ ...vendorFields(req.body), createdBy: actorOf(req) });
    return res.status(201).json({ status: "success", data: vendor });
  } catch (error) {
    return handle(res, next, error);
  }
};

// PUT /purchases/vendors/:id — purchases keep the name they were saved with
export const updateVendor = async (req, res, next) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) throw new InputError("Vendor not found.", 404);
    const vendor = await VendorModel.findByIdAndUpdate(req.params.id, { $set: vendorFields(req.body, true) }, { new: true });
    if (!vendor) throw new InputError("Vendor not found.", 404);
    return res.json({ status: "success", data: vendor });
  } catch (error) {
    return handle(res, next, error);
  }
};

// DELETE /purchases/vendors/:id — hides the vendor; its purchases stay
export const deleteVendor = async (req, res, next) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) throw new InputError("Vendor not found.", 404);
    const vendor = await VendorModel.findByIdAndUpdate(req.params.id, { $set: { status: "inactive" } }, { new: true });
    if (!vendor) throw new InputError("Vendor not found.", 404);
    return res.json({ status: "success", message: "Vendor removed" });
  } catch (error) {
    return handle(res, next, error);
  }
};

// ---- Purchase building blocks ----

// Validates and prices lines against the stock items; items already on the purchase stay allowed if made inactive
const buildLines = async (raw, known = new Set()) => {
  if (!Array.isArray(raw) || raw.length === 0) throw new InputError("Add at least one item.");
  const ids = [...new Set(raw.map((l) => String(l?.stockItemId || "")))];
  if (ids.some((id) => !Types.ObjectId.isValid(id))) throw new InputError("Choose a stock item on every line.");
  const items = await StockItemModel.find({ _id: { $in: ids } }).select("shortName name unit isActive").lean();
  const byId = new Map(items.map((i) => [String(i._id), i]));

  return raw.map((l, i) => {
    const id = String(l.stockItemId);
    const item = byId.get(id);
    if (!item) throw new InputError(`Line ${i + 1}: stock item not found.`);
    if (item.isActive === false && !known.has(id)) throw new InputError(`Line ${i + 1}: ${item.shortName} is inactive.`);
    const packs = Number(l.packs);
    const unitsPerPack = Number(l.unitsPerPack) || 1;
    const packPrice = Number(l.packPrice);
    if (!Number.isFinite(packs) || packs <= 0) throw new InputError(`Line ${i + 1}: quantity must be more than 0.`);
    if (!Number.isInteger(unitsPerPack) || unitsPerPack < 1) throw new InputError(`Line ${i + 1}: units per pack must be a whole number.`);
    if (!Number.isFinite(packPrice) || packPrice < 0) throw new InputError(`Line ${i + 1}: enter a valid price.`);
    const units = Math.round(packs * unitsPerPack);
    if (units <= 0) throw new InputError(`Line ${i + 1}: quantity is too small.`);
    const total = round2(packs * packPrice);
    return {
      stockItemId: item._id,
      shortName: item.shortName,
      name: item.name || "",
      unit: item.unit || "pcs",
      packLabel: unitsPerPack > 1 ? String(l.packLabel || "Pack").trim().slice(0, 40) : "",
      packs,
      unitsPerPack,
      units,
      packPrice: round2(packPrice),
      unitCost: Math.round((total / units) * 1e6) / 1e6,
      total,
    };
  });
};

// Validates one payment; the method name comes from Payment Methods when an id is given
const buildPayment = async (raw = {}) => {
  const amount = round2(raw.amount);
  if (!(amount > 0)) throw new InputError("Payment amount must be more than 0.");
  let method = String(raw.method || "").trim();
  let paymentTypeId = null;
  if (raw.paymentTypeId) {
    if (!Types.ObjectId.isValid(raw.paymentTypeId)) throw new InputError("Payment method not found.");
    const pt = await PaymentTypeModel.findById(raw.paymentTypeId).select("name").lean();
    if (!pt) throw new InputError("Payment method not found.");
    method = pt.name;
    paymentTypeId = pt._id;
  }
  if (!method) throw new InputError("Choose how the payment was made.");
  return {
    method: method.slice(0, 80),
    paymentTypeId,
    amount,
    reference: String(raw.reference || "").trim().slice(0, 120),
    paidAt: toDate(raw.paidAt),
    note: String(raw.note || "").trim().slice(0, 300),
  };
};

// Recomputes subtotal, total, paid amount and payment status
const recalc = (p) => {
  p.subtotal = round2(p.lines.reduce((s, l) => s + l.total, 0));
  p.discount = round2(Math.max(0, Number(p.discount) || 0));
  p.shipping = round2(Math.max(0, Number(p.shipping) || 0));
  p.total = round2(Math.max(0, p.subtotal - p.discount + p.shipping));
  p.paidAmount = round2(p.payments.reduce((s, x) => s + x.amount, 0));
  if (p.paidAmount > p.total + 0.009) throw new InputError(`Paid (৳${p.paidAmount}) is more than the total (৳${p.total}).`);
  p.paymentStatus = p.paidAmount <= 0 ? "pending" : p.paidAmount + 0.009 >= p.total ? "paid" : "partial";
};

// Copies vendor details onto the purchase from a saved vendor or a typed name
const applyVendor = async (p, body) => {
  if (body.vendorId) {
    if (!Types.ObjectId.isValid(body.vendorId)) throw new InputError("Vendor not found.");
    const v = await VendorModel.findById(body.vendorId).lean();
    if (!v) throw new InputError("Vendor not found.");
    p.vendorId = v._id;
    p.vendorName = v.name;
    p.vendorPhone = v.phone || "";
    p.vendorEmail = v.email || "";
    return;
  }
  if (body.vendorName !== undefined) {
    const name = String(body.vendorName || "").trim();
    if (!name) throw new InputError("Vendor is required.");
    p.vendorId = null;
    p.vendorName = name.slice(0, 120);
    if (body.vendorPhone !== undefined) p.vendorPhone = String(body.vendorPhone || "").trim().slice(0, 30);
    if (body.vendorEmail !== undefined) p.vendorEmail = String(body.vendorEmail || "").trim().slice(0, 120);
  }
};

// Units and cost per item, for spotting edits that change stock
const stockKey = (lines) =>
  JSON.stringify(
    [...lines]
      .map((l) => [String(l.stockItemId), Number(l.units), Number(l.total)])
      .sort((a, b) => a[0].localeCompare(b[0]) || a[1] - b[1])
  );

// Puts this purchase's units into stock (received) or takes them back out (cancelled); throws before anything is saved
const syncStock = async (p, actor) => {
  const ref = stockRef(p);
  p.stockVersion = (p.stockVersion || 0) + 1;
  if (p.status === "received") {
    await applyReceipt(
      {
        externalRef: ref,
        version: p.stockVersion,
        purchaseNumber: p.purchaseNumber,
        vendorName: p.vendorName,
        vendorPhone: p.vendorPhone,
        receivedAt: p.receivedAt,
        notes: p.notes,
        lines: p.lines.map((l) => ({
          stockItemId: String(l.stockItemId),
          packLabel: l.packLabel,
          packs: l.packs,
          unitsPerPack: l.unitsPerPack,
          unitCost: l.unitCost,
          total: l.total,
        })),
      },
      actor,
      "surokkha"
    );
  } else if (p.status === "cancelled") {
    await cancelReceipt(ref, actor, `${p.purchaseNumber} cancelled`, p.stockVersion);
  }
};

// Bill type every purchase bill is filed under; created the first time it is needed
const purchaseBillType = async () => {
  const found = await BillTypeModel.findOne({ name: { $regex: `^${PURCHASE_BILL_TYPE}$`, $options: "i" } }).select("_id").lean();
  if (found) return found._id;
  const created = await BillTypeModel.create({ name: PURCHASE_BILL_TYPE, description: "Stock bought from vendors (kept in step by Purchases)" });
  return created._id;
};

// Short line text for the bill, e.g. "MO × 5 Packet (50 pcs)"
const lineLabel = (l) =>
  l.unitsPerPack > 1 ? `${l.shortName} × ${l.packs} ${l.packLabel || "pack"} (${l.units} ${l.unit || "pcs"})` : `${l.shortName} × ${l.units} ${l.unit || "pcs"}`;

// Keeps one "Product Purchase" bill in step with the purchase; drafts and cancelled purchases leave it cancelled
const syncBill = async (p, req) => {
  const existing = p.billingId ? await BillingModel.findById(p.billingId) : await BillingModel.findOne({ purchaseId: p._id });

  if (p.status === "draft" || p.status === "cancelled") {
    if (existing && existing.status !== "cancelled") {
      existing.status = "cancelled";
      existing.notes = `${existing.notes || ""}\n${p.status === "cancelled" ? "Purchase cancelled" : "Purchase moved back to draft"} ${new Date().toISOString().slice(0, 10)}`.trim();
      existing.updatedBy = req.user?.userId || null;
      await existing.save();
    }
    return existing;
  }

  const total = round2(p.total);
  const paid = round2(Math.min(total, p.paidAmount));
  const methods = [...new Set(p.payments.map((x) => x.method).filter(Boolean))];
  const fields = {
    purchaseId: p._id,
    billTypeId: await purchaseBillType(),
    title: `Purchase ${p.purchaseNumber} - ${p.vendorName}`,
    name: p.vendorName,
    billingMethod: methods.length === 1 ? methods[0] : methods.length > 1 ? "Multiple" : "manual",
    billingPhone: p.vendorPhone || "",
    billingEmail: p.vendorEmail || "",
    billingDate: p.receivedAt || p.orderDate,
    baseAmount: total,
    totalAmount: total,
    amount: total,
    paidAmount: paid,
    pendingAmount: round2(Math.max(0, total - paid)),
    status: paid >= total && total > 0 ? "paid" : paid > 0 ? "partial" : "pending",
    notes: [
      `Product purchase ${p.purchaseNumber} (${p.status})`,
      ...p.lines.map((l) => `${lineLabel(l)} = ৳${round2(l.total)}`),
      p.shipping ? `Shipping / carrying ৳${p.shipping}` : "",
      p.discount ? `Discount -৳${p.discount}` : "",
      ...p.payments.map((x) => `Paid ৳${round2(x.amount)} via ${x.method}${x.reference ? ` (${x.reference})` : ""} on ${new Date(x.paidAt).toISOString().slice(0, 10)}`),
      p.notes || "",
    ]
      .filter(Boolean)
      .join("\n"),
    updatedBy: req.user?.userId || null,
  };

  if (existing) {
    existing.set(fields);
    await existing.save();
    return existing;
  }
  return BillingModel.create({ ...fields, createdBy: req.user?.userId || null });
};

// Saves the purchase after its stock moved, then keeps its bill in step
const persist = async (p, req, stockChanged) => {
  if (stockChanged) await syncStock(p, actorOf(req));
  p.updatedBy = actorOf(req);
  await p.save();
  const bill = await syncBill(p, req);
  if (bill && String(p.billingId || "") !== String(bill._id)) {
    p.billingId = bill._id;
    await p.save();
  }
  return p;
};

// ---- Purchases ----

// GET /purchases — list with status / vendor / text filters and page totals
export const listPurchases = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "25", 10)));
    const filter = {};
    if (req.query.status && req.query.status !== "all") filter.status = String(req.query.status).toLowerCase();
    if (req.query.vendor && Types.ObjectId.isValid(req.query.vendor)) filter.vendorId = req.query.vendor;
    if (req.query.paymentStatus) filter.paymentStatus = String(req.query.paymentStatus);
    const q = String(req.query.q || "").trim();
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [{ purchaseNumber: rx }, { vendorName: rx }, { "lines.shortName": rx }];
    }
    const [rows, total, summary] = await Promise.all([
      PurchaseModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      PurchaseModel.countDocuments(filter),
      PurchaseModel.aggregate([
        { $group: {
          _id: null,
          total: { $sum: { $cond: [{ $in: ["$status", ["ordered", "received"]] }, "$total", 0] } },
          paid: { $sum: { $cond: [{ $in: ["$status", ["ordered", "received"]] }, "$paidAmount", 0] } },
          ordered: { $sum: { $cond: [{ $eq: ["$status", "ordered"] }, 1, 0] } },
          drafts: { $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] } },
        } },
      ]),
    ]);
    const s = summary[0] || {};
    return res.json({
      status: "success",
      data: rows.map(({ _id, ...r }) => ({ ...r, id: String(_id) })),
      summary: { total: round2(s.total), due: round2((s.total || 0) - (s.paid || 0)), ordered: s.ordered || 0, drafts: s.drafts || 0 },
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handle(res, next, error);
  }
};

// GET /purchases/:id — one purchase with its stock receipt state and bill number
export const getPurchase = async (req, res, next) => {
  try {
    const p = await findPurchase(req.params.id);
    const [receipt, bill] = await Promise.all([
      StockReceiptModel.findOne({ externalRef: stockRef(p) }).select("status version totalUnits updatedAt").lean(),
      p.billingId ? BillingModel.findById(p.billingId).select("did status").lean() : null,
    ]);
    return res.json({
      status: "success",
      data: { ...p.toJSON(), stock: receipt ? { status: receipt.status, version: receipt.version, totalUnits: receipt.totalUnits, updatedAt: receipt.updatedAt } : null, bill },
    });
  } catch (error) {
    return handle(res, next, error);
  }
};

// POST /purchases — records a purchase as draft, ordered or already received
export const createPurchase = async (req, res, next) => {
  try {
    const body = req.body || {};
    const status = OPEN_STATUSES.includes(body.status) ? body.status : "draft";
    const p = new PurchaseModel({
      status,
      orderDate: toDate(body.orderDate),
      receivedAt: status === "received" ? toDate(body.receivedAt) : null,
      discount: body.discount,
      shipping: body.shipping,
      notes: String(body.notes || "").slice(0, 1000),
      createdBy: actorOf(req),
      payments: [],
    });
    await applyVendor(p, body);
    if (!p.vendorName) throw new InputError("Vendor is required.");
    p.lines = await buildLines(body.lines);
    for (const raw of Array.isArray(body.payments) ? body.payments : []) p.payments.push(await buildPayment(raw));
    recalc(p);
    // Numbered only once the input is valid, so rejected forms leave no gaps
    p.purchaseNumber = await nextPurchaseNumber();
    const saved = await persist(p, req, status === "received");
    return res.status(201).json({ status: "success", data: saved });
  } catch (error) {
    return handle(res, next, error);
  }
};

// PUT /purchases/:id — edits vendor, lines, dates, discount/shipping or moves draft → ordered → received
export const updatePurchase = async (req, res, next) => {
  try {
    const body = req.body || {};
    const p = await findPurchase(req.params.id);
    if (p.status === "cancelled") throw new InputError("A cancelled purchase cannot be edited.");

    const before = stockKey(p.lines);
    const wasReceived = p.status === "received";
    if (body.status !== undefined) {
      if (!OPEN_STATUSES.includes(body.status)) throw new InputError("Use cancel to cancel a purchase.");
      if (wasReceived && body.status !== "received") throw new InputError("A received purchase cannot go back; cancel it instead.");
      p.status = body.status;
    }
    await applyVendor(p, body);
    if (body.lines !== undefined) p.lines = await buildLines(body.lines, new Set(p.lines.map((l) => String(l.stockItemId))));
    if (body.orderDate) p.orderDate = toDate(body.orderDate);
    if (p.status === "received") p.receivedAt = body.receivedAt ? toDate(body.receivedAt) : p.receivedAt || new Date();
    if (body.discount !== undefined) p.discount = body.discount;
    if (body.shipping !== undefined) p.shipping = body.shipping;
    if (body.notes !== undefined) p.notes = String(body.notes || "").slice(0, 1000);
    recalc(p);

    const stockChanged = p.status === "received" && (!wasReceived || stockKey(p.lines) !== before);
    const saved = await persist(p, req, stockChanged);
    return res.json({ status: "success", data: saved });
  } catch (error) {
    return handle(res, next, error);
  }
};

// POST /purchases/:id/receive — goods arrived: adds the units to stock items
export const receivePurchase = async (req, res, next) => {
  try {
    const p = await findPurchase(req.params.id);
    if (p.status === "cancelled") throw new InputError("A cancelled purchase cannot be received.");
    if (p.status === "received") return res.json({ status: "success", data: p });
    p.status = "received";
    p.receivedAt = toDate(req.body?.receivedAt);
    recalc(p);
    const saved = await persist(p, req, true);
    return res.json({ status: "success", data: saved });
  } catch (error) {
    return handle(res, next, error);
  }
};

// POST /purchases/:id/payments — money paid to the vendor; the bill's paid amount follows
export const addPurchasePayment = async (req, res, next) => {
  try {
    const p = await findPurchase(req.params.id);
    if (p.status === "cancelled") throw new InputError("A cancelled purchase cannot take payments.");
    p.payments.push(await buildPayment(req.body));
    recalc(p);
    const saved = await persist(p, req, false);
    return res.status(201).json({ status: "success", data: saved });
  } catch (error) {
    return handle(res, next, error);
  }
};

// DELETE /purchases/:id/payments/:paymentId — removes a payment entered by mistake
export const removePurchasePayment = async (req, res, next) => {
  try {
    const p = await findPurchase(req.params.id);
    if (p.status === "cancelled") throw new InputError("A cancelled purchase cannot be changed.");
    const count = p.payments.length;
    p.payments = p.payments.filter((x) => String(x._id) !== String(req.params.paymentId));
    if (p.payments.length === count) throw new InputError("Payment not found.", 404);
    recalc(p);
    const saved = await persist(p, req, false);
    return res.json({ status: "success", data: saved });
  } catch (error) {
    return handle(res, next, error);
  }
};

// POST /purchases/:id/cancel — cancels the purchase, takes received units back out and voids the bill
export const cancelPurchase = async (req, res, next) => {
  try {
    const p = await findPurchase(req.params.id);
    if (p.status === "cancelled") return res.json({ status: "success", data: p });
    const touchedStock = p.status === "received" || (p.stockVersion || 0) > 0;
    p.status = "cancelled";
    if (req.body?.reason) p.notes = `${p.notes ? `${p.notes}\n` : ""}Cancelled: ${String(req.body.reason).slice(0, 300)}`;
    const saved = await persist(p, req, touchedStock);
    return res.json({ status: "success", data: saved });
  } catch (error) {
    return handle(res, next, error);
  }
};
