import { CheckoutLeadModel } from "../../common/models/checkoutLead.model.js";
import { CustomerModel } from "../../common/models/customer.model.js";

const lastTenDigits = (raw) => String(raw || "").replace(/\D/g, "").slice(-10);

// Attaches the matching customer-list profile (matched on the last 10 phone digits) to each lead
const attachCustomers = async (leads) => {
  const keys = [...new Set(leads.map((l) => l.phoneKey || lastTenDigits(l.phone)).filter((k) => k.length === 10))];
  if (!keys.length) return leads.map((l) => ({ ...l, customer: null }));

  const customers = await CustomerModel.find({ phone: { $regex: `(${keys.join("|")})$` } })
    .sort({ updatedAt: -1 })
    .lean();

  const byKey = new Map();
  for (const c of customers) {
    const key = lastTenDigits(c.phone);
    if (!byKey.has(key)) byKey.set(key, c);
  }

  return leads.map((l) => {
    const c = byKey.get(l.phoneKey || lastTenDigits(l.phone));
    if (!c) return { ...l, customer: null };
    return {
      ...l,
      customer: {
        id: c._id.toString(),
        did: c.did,
        fullName: [c.firstName, c.lastName].filter(Boolean).join(" "),
        firstName: c.firstName,
        lastName: c.lastName || "",
        phone: c.phone,
        email: c.email || "",
        address: c.address || "",
        thana: c.thana || "",
        district: c.district || "",
        totalOrders: c.totalOrders || 0,
        totalSpent: c.totalSpent || 0,
        lastOrderAt: c.lastOrderAt || null,
        notes: c.notes || "",
        isActive: c.isActive !== false,
        recentOrders: (c.orders || []).slice(-5).reverse(),
      },
    };
  });
};

// Lists saved checkouts (abandoned = still open) for the dashboard, with status counts
export const listCheckoutLeads = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "20", 10)));

    const filter = {};
    if (["open", "converted"].includes(req.query.status)) filter.status = req.query.status;

    const q = String(req.query.q || "").trim();
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ fullName: rx }, { phone: rx }, { email: rx }, { address: rx }, { convertedOrderNumber: rx }];
    }

    const [data, total, open, converted, openValueAgg] = await Promise.all([
      CheckoutLeadModel.find(filter)
        .select("-userAgent -fbp -fbc")
        .sort({ lastActivityAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      CheckoutLeadModel.countDocuments(filter),
      CheckoutLeadModel.countDocuments({ status: "open" }),
      CheckoutLeadModel.countDocuments({ status: "converted" }),
      CheckoutLeadModel.aggregate([
        { $match: { status: "open" } },
        { $group: { _id: null, value: { $sum: "$cartTotal" } } },
      ]),
    ]);

    return res.json({
      status: "success",
      data: await attachCustomers(data),
      stats: { open, converted, openValue: openValueAgg[0]?.value || 0 },
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    return res.status(500).json({ status: "error", message: "Failed to load checkouts." });
  }
};

export const deleteCheckoutLead = async (req, res) => {
  try {
    const removed = await CheckoutLeadModel.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ status: "error", message: "Checkout not found." });
    return res.json({ status: "success" });
  } catch (err) {
    return res.status(400).json({ status: "error", message: "Failed to delete checkout." });
  }
};

// Returns one saved checkout so the dashboard can open it in the custom order page
export const getCheckoutLead = async (req, res) => {
  try {
    const lead = await CheckoutLeadModel.findById(req.params.id).select("-userAgent -fbp -fbc").lean();
    if (!lead) return res.status(404).json({ status: "error", message: "Checkout not found." });
    const [withCustomer] = await attachCustomers([lead]);
    return res.json({ status: "success", data: withCustomer });
  } catch (err) {
    return res.status(400).json({ status: "error", message: "Failed to load checkout." });
  }
};

// Marks a checkout converted once staff placed an order for it from the dashboard
export const convertCheckoutLead = async (req, res) => {
  try {
    const orderNumber = String(req.body?.orderNumber || "").trim().slice(0, 60);
    const lead = await CheckoutLeadModel.findByIdAndUpdate(
      req.params.id,
      { $set: { status: "converted", convertedOrderNumber: orderNumber, convertedAt: new Date() } },
      { new: true }
    ).lean();
    if (!lead) return res.status(404).json({ status: "error", message: "Checkout not found." });
    return res.json({ status: "success", data: lead });
  } catch (err) {
    return res.status(400).json({ status: "error", message: "Failed to update checkout." });
  }
};
