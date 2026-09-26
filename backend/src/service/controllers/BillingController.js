import mongoose from "mongoose";
import { BillingModel } from "../../common/models/billing.model.js";
import { logger } from "../../common/config/logger.js";

const { Types } = mongoose;

const normalizeStatus = (status, amount, totalAmount) => {
  const normalized = (status || "").toString().trim().toLowerCase();
  if (normalized === "completed") return "paid";
  if (normalized === "failed") return "failed";
  if (normalized === "pending") return "pending";
  if (normalized === "partial") return "partial";
  if (amount >= totalAmount) return "paid";
  if (amount > 0) return "partial";
  return "pending";
};

// POST /billing - নতুন বিলিং রেকর্ড তৈরি করে
export const createBilling = async (req, res, next) => {
  try {
    const {
      orderId,
      billingMethod,
      billingPhone,
      billingEmail,
      amount,
      status: requestedStatus,
      totalAmount: requestedTotalAmount,
      paidAmount: requestedPaidAmount,
      pendingAmount: requestedPendingAmount,
      dueDate,
      billingDate,
      notes,
    } = req.body ?? {};

    if (orderId && !Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ status: "error", message: "Invalid orderId" });
    }
    if (!billingMethod || billingMethod.trim() === "") {
      return res.status(400).json({ status: "error", message: "billingMethod is required" });
    }
    if (amount === undefined || typeof amount !== "number" || amount < 0) {
      return res.status(400).json({ status: "error", message: "Valid amount is required" });
    }

    const totalAmount = Number(requestedTotalAmount ?? amount);
    const paidAmount = Number(requestedPaidAmount ?? amount);
    const pendingAmount = Number(requestedPendingAmount ?? Math.max(0, totalAmount - paidAmount));
    const status = normalizeStatus(requestedStatus, paidAmount, totalAmount);

    const billingData = {
      orderId,
      billingMethod: billingMethod.trim(),
      billingPhone: billingPhone?.trim() || "",
      billingEmail: billingEmail?.trim().toLowerCase() || "",
      totalAmount,
      paidAmount,
      pendingAmount,
      amount,
      status,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      billingDate: billingDate ? new Date(billingDate) : undefined,
      notes: notes?.trim() || "",
      createdBy: req.user?.userId || null,
    };

    const billing = await BillingModel.create(billingData);

    return res.status(201).json({
      status: "success",
      message: "Billing record created successfully",
      data: billing,
    });
  } catch (error) {
    logger.error({ error }, "Failed to create billing record");
    next(error);
  }
};

// GET /billing - বিলিং রেকর্ডের তালিকা দেখায়
export const listBilling = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "20", 10)));
    const filter = {};

    if (req.query.orderId && Types.ObjectId.isValid(req.query.orderId)) {
      filter.orderId = req.query.orderId;
    }

    if (req.query.billingMethod) {
      filter.billingMethod = { $regex: `^${req.query.billingMethod.toString().trim()}$`, $options: "i" };
    }

    if (req.query.status) {
      const statusQuery = req.query.status.toString().trim().toLowerCase();
      if (statusQuery === "completed") {
        filter.status = "paid";
      } else if (statusQuery === "failed") {
        filter.status = "failed";
      } else if (statusQuery === "pending") {
        filter.status = { $in: ["pending", "partial"] };
      } else {
        filter.status = statusQuery;
      }
    }

    if (req.query.search) {
      const search = req.query.search.toString().trim();
      if (search.length > 0) {
        const searchRegex = { $regex: search, $options: "i" };
        filter.$or = [
          { did: searchRegex },
          { billingMethod: searchRegex },
          { billingPhone: searchRegex },
          { billingEmail: searchRegex },
          { notes: searchRegex },
        ];
      }
    }

    const total = await BillingModel.countDocuments(filter);
    const billings = await BillingModel.find(filter)
      .populate("orderId")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return res.json({
      status: "success",
      data: billings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error({ error }, "Failed to list billing records");
    next(error);
  }
};

// GET /billing/:billingId - একটি বিলিং ডিটেইল দেখায়
export const getBillingById = async (req, res, next) => {
  try {
    const { billingId } = req.params;
    if (!Types.ObjectId.isValid(billingId)) {
      return res.status(400).json({ status: "error", message: "Invalid billing ID" });
    }

    const billing = await BillingModel.findById(billingId).populate("orderId").lean();
    if (!billing) {
      return res.status(404).json({ status: "error", message: "Billing record not found" });
    }

    return res.json({ status: "success", data: billing });
  } catch (error) {
    next(error);
  }
};

// PUT /billing/:billingId - বিলিং তথ্য আপডেট করে
export const updateBilling = async (req, res, next) => {
  try {
    const { billingId } = req.params;
    if (!Types.ObjectId.isValid(billingId)) {
      return res.status(400).json({ status: "error", message: "Invalid billing ID" });
    }

    const payload = req.body ?? {};
    const allowedUpdates = {};

    if (payload.billingMethod) {
      allowedUpdates.billingMethod = payload.billingMethod.trim();
    }
    if (payload.billingPhone !== undefined) {
      allowedUpdates.billingPhone = payload.billingPhone.trim();
    }
    if (payload.billingEmail !== undefined) {
      allowedUpdates.billingEmail = payload.billingEmail.trim().toLowerCase();
    }
    if (payload.amount !== undefined && typeof payload.amount === "number") {
      allowedUpdates.amount = payload.amount;
    }
    if (payload.totalAmount !== undefined && typeof payload.totalAmount === "number") {
      allowedUpdates.totalAmount = payload.totalAmount;
    }
    if (payload.paidAmount !== undefined && typeof payload.paidAmount === "number") {
      allowedUpdates.paidAmount = payload.paidAmount;
    }
    if (payload.pendingAmount !== undefined && typeof payload.pendingAmount === "number") {
      allowedUpdates.pendingAmount = payload.pendingAmount;
    }
    if (payload.status) {
      allowedUpdates.status = payload.status.trim().toLowerCase();
    }
    if (payload.dueDate !== undefined) {
      allowedUpdates.dueDate = payload.dueDate ? new Date(payload.dueDate) : null;
    }
    if (payload.billingDate !== undefined) {
      allowedUpdates.billingDate = payload.billingDate ? new Date(payload.billingDate) : null;
    }
    if (payload.notes !== undefined) {
      allowedUpdates.notes = payload.notes.trim();
    }
    if (payload.orderId !== undefined) {
      if (payload.orderId && !Types.ObjectId.isValid(payload.orderId)) {
        return res.status(400).json({ status: "error", message: "Invalid orderId" });
      }
      allowedUpdates.orderId = payload.orderId || undefined;
    }

    const billing = await BillingModel.findByIdAndUpdate(billingId, allowedUpdates, {
      new: true,
      runValidators: true,
    }).lean();

    if (!billing) {
      return res.status(404).json({ status: "error", message: "Billing record not found" });
    }

    return res.json({ status: "success", data: billing });
  } catch (error) {
    next(error);
  }
};

// DELETE /billing/:billingId - বিলিং রেকর্ড ডিলিট করে
export const deleteBilling = async (req, res, next) => {
  try {
    const { billingId } = req.params;
    if (!Types.ObjectId.isValid(billingId)) {
      return res.status(400).json({ status: "error", message: "Invalid billing ID" });
    }

    const deletedBilling = await BillingModel.findByIdAndDelete(billingId).lean();
    if (!deletedBilling) {
      return res.status(404).json({ status: "error", message: "Billing record not found" });
    }

    return res.json({ status: "success", message: "Billing record deleted successfully" });
  } catch (error) {
    next(error);
  }
};
