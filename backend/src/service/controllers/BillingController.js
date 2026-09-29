import mongoose from "mongoose";
import { BillingModel } from "../../common/models/billing.model.js";
import { BillTypeModel } from "../../common/models/billType.model.js";
import { logger } from "../../common/config/logger.js";

const { Types } = mongoose;

// Normalizes billing status string and compares amounts
const normalizeStatus = (status, amount, totalAmount) => {
  const normalized = (status || "").toString().trim().toLowerCase();
  if (["paid", "failed", "pending", "partial", "returned", "active", "cancelled"].includes(normalized)) {
    return normalized;
  }
  if (normalized === "completed") return "paid";
  if (amount >= totalAmount && totalAmount > 0) return "paid";
  if (amount > 0) return "partial";
  return "pending";
};

// Creates a new billing entry with optional order or bill type associations
export const createBilling = async (req, res, next) => {
  try {
    const {
      orderId,
      billTypeId,
      billType,
      investorId,
      investmentId,
      title,
      name,
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
    if (billTypeId && !Types.ObjectId.isValid(billTypeId)) {
      return res.status(400).json({ status: "error", message: "Invalid billTypeId" });
    }
    if (investorId && !Types.ObjectId.isValid(investorId)) {
      return res.status(400).json({ status: "error", message: "Invalid investorId" });
    }
    if (investmentId && !Types.ObjectId.isValid(investmentId)) {
      return res.status(400).json({ status: "error", message: "Invalid investmentId" });
    }
    if (amount === undefined || typeof amount !== "number" || amount < 0) {
      return res.status(400).json({ status: "error", message: "Valid amount is required" });
    }

    let resolvedBillTypeId = billTypeId || null;
    if (!resolvedBillTypeId && billType && typeof billType === "string") {
      const found = await BillTypeModel.findOne({ name: { $regex: `^${billType.trim()}$`, $options: "i" } }).lean();
      if (found) {
        resolvedBillTypeId = found._id;
      }
    }

    const totalAmount = Number(requestedTotalAmount ?? amount);
    const paidAmount = Number(requestedPaidAmount ?? amount);
    const pendingAmount = Number(requestedPendingAmount ?? Math.max(0, totalAmount - paidAmount));
    const status = normalizeStatus(requestedStatus, paidAmount, totalAmount);

    const billingData = {
      orderId: orderId || null,
      billTypeId: resolvedBillTypeId,
      investorId: investorId || null,
      investmentId: investmentId || null,
      title: (title || name || "").toString().trim(),
      name: (name || title || "").toString().trim(),
      billingMethod: billingMethod?.trim() || "manual",
      billingPhone: billingPhone?.trim() || "",
      billingEmail: billingEmail?.trim().toLowerCase() || "",
      totalAmount,
      paidAmount,
      pendingAmount,
      amount,
      status,
      dueDate: dueDate ? new Date(dueDate) : null,
      billingDate: billingDate ? new Date(billingDate) : new Date(),
      notes: notes?.trim() || "",
      createdBy: req.user?.userId || null,
    };

    const billing = await BillingModel.create(billingData);
    const populated = await BillingModel.findById(billing._id)
      .populate("orderId")
      .populate("billTypeId")
      .populate("investorId", "name email phone did type status")
      .populate("investmentId", "takenAmount returnedAmount did status")
      .lean();

    return res.status(201).json({
      status: "success",
      message: "Billing record created successfully",
      data: populated || billing,
    });
  } catch (error) {
    logger.error({ error }, "Failed to create billing record");
    next(error);
  }
};

// Lists billing records with comprehensive date range and status filters
export const listBilling = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "50", 10)));
    const filter = {};

    if (req.query.orderId && Types.ObjectId.isValid(req.query.orderId)) {
      filter.orderId = req.query.orderId;
    }

    if (req.query.billTypeId && Types.ObjectId.isValid(req.query.billTypeId)) {
      filter.billTypeId = req.query.billTypeId;
    }

    if (req.query.investorId && Types.ObjectId.isValid(req.query.investorId)) {
      filter.investorId = req.query.investorId;
    }

    if (req.query.billingMethod) {
      filter.billingMethod = { $regex: `^${req.query.billingMethod.toString().trim()}$`, $options: "i" };
    }

    if (req.query.status && req.query.status !== "all") {
      const statusQuery = req.query.status.toString().trim().toLowerCase();
      if (statusQuery === "completed") {
        filter.status = "paid";
      } else {
        filter.status = statusQuery;
      }
    }

    const startDate = req.query.startDate || req.query.from;
    const endDate = req.query.endDate || req.query.to;
    if (startDate || endDate) {
      const dateField = req.query.dateField || "billingDate";
      filter[dateField] = {};
      if (startDate) {
        filter[dateField].$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        if (endDate.length <= 10) {
          end.setHours(23, 59, 59, 999);
        }
        filter[dateField].$lte = end;
      }
    }

    if (req.query.search) {
      const search = req.query.search.toString().trim();
      if (search.length > 0) {
        const searchRegex = { $regex: search, $options: "i" };
        filter.$or = [
          { did: searchRegex },
          { title: searchRegex },
          { name: searchRegex },
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
      .populate("billTypeId")
      .populate("investorId", "name email phone did type status")
      .populate("investmentId", "takenAmount returnedAmount did status")
      .sort({ billingDate: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const aggregateTotals = await BillingModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalAmount" },
          paidAmount: { $sum: "$paidAmount" },
          pendingAmount: { $sum: "$pendingAmount" },
        },
      },
    ]);

    const totalAmount = aggregateTotals[0]?.totalAmount || 0;
    const paidAmount = aggregateTotals[0]?.paidAmount || 0;
    const pendingAmount = aggregateTotals[0]?.pendingAmount || 0;

    return res.json({
      status: "success",
      data: billings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        totalAmount,
        paidAmount,
        pendingAmount,
      },
    });
  } catch (error) {
    logger.error({ error }, "Failed to list billing records");
    next(error);
  }
};

// Retrieves a single billing record by database ID or did
export const getBillingById = async (req, res, next) => {
  try {
    const { billingId, id } = req.params;
    const targetId = billingId || id;
    const query = Types.ObjectId.isValid(targetId) ? { _id: targetId } : { did: targetId };

    const billing = await BillingModel.findOne(query)
      .populate("orderId")
      .populate("billTypeId")
      .populate("investorId", "name email phone did type status")
      .populate("investmentId", "takenAmount returnedAmount did status")
      .lean();

    if (!billing) {
      return res.status(404).json({ status: "error", message: "Billing record not found" });
    }

    return res.json({ status: "success", data: billing });
  } catch (error) {
    next(error);
  }
};

// Updates an existing billing record
export const updateBilling = async (req, res, next) => {
  try {
    const { billingId, id } = req.params;
    const targetId = billingId || id;
    const query = Types.ObjectId.isValid(targetId) ? { _id: targetId } : { did: targetId };

    const payload = req.body ?? {};
    const allowedUpdates = {};

    if (payload.title !== undefined || payload.name !== undefined) {
      const titleVal = (payload.title || payload.name || "").toString().trim();
      allowedUpdates.title = titleVal;
      allowedUpdates.name = titleVal;
    }
    if (payload.billTypeId !== undefined) {
      if (payload.billTypeId && !Types.ObjectId.isValid(payload.billTypeId)) {
        return res.status(400).json({ status: "error", message: "Invalid billTypeId" });
      }
      allowedUpdates.billTypeId = payload.billTypeId || null;
    } else if (payload.billType && typeof payload.billType === "string" && !payload.billTypeId) {
      const found = await BillTypeModel.findOne({ name: { $regex: `^${payload.billType.trim()}$`, $options: "i" } }).lean();
      if (found) {
        allowedUpdates.billTypeId = found._id;
      }
    }
    if (payload.investorId !== undefined) {
      if (payload.investorId && !Types.ObjectId.isValid(payload.investorId)) {
        return res.status(400).json({ status: "error", message: "Invalid investorId" });
      }
      allowedUpdates.investorId = payload.investorId || null;
    }
    if (payload.investmentId !== undefined) {
      if (payload.investmentId && !Types.ObjectId.isValid(payload.investmentId)) {
        return res.status(400).json({ status: "error", message: "Invalid investmentId" });
      }
      allowedUpdates.investmentId = payload.investmentId || null;
    }
    if (payload.billingMethod !== undefined) {
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
      allowedUpdates.billingDate = payload.billingDate ? new Date(payload.billingDate) : new Date();
    }
    if (payload.notes !== undefined) {
      allowedUpdates.notes = payload.notes.trim();
    }
    if (payload.orderId !== undefined) {
      if (payload.orderId && !Types.ObjectId.isValid(payload.orderId)) {
        return res.status(400).json({ status: "error", message: "Invalid orderId" });
      }
      allowedUpdates.orderId = payload.orderId || null;
    }

    allowedUpdates.updatedBy = req.user?.userId || null;

    const billing = await BillingModel.findOneAndUpdate(query, allowedUpdates, {
      new: true,
      runValidators: true,
    })
      .populate("orderId")
      .populate("billTypeId")
      .populate("investorId", "name email phone did type status")
      .populate("investmentId", "takenAmount returnedAmount did status")
      .lean();

    if (!billing) {
      return res.status(404).json({ status: "error", message: "Billing record not found" });
    }

    return res.json({ status: "success", data: billing });
  } catch (error) {
    next(error);
  }
};

// Deletes a billing record
export const deleteBilling = async (req, res, next) => {
  try {
    const { billingId, id } = req.params;
    const targetId = billingId || id;
    const query = Types.ObjectId.isValid(targetId) ? { _id: targetId } : { did: targetId };

    const deletedBilling = await BillingModel.findOneAndDelete(query).lean();
    if (!deletedBilling) {
      return res.status(404).json({ status: "error", message: "Billing record not found" });
    }

    return res.json({ status: "success", message: "Billing record deleted successfully" });
  } catch (error) {
    next(error);
  }
};
