import { CheckoutLeadModel } from "../../common/models/checkoutLead.model.js";

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
      data,
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
