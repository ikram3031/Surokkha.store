import mongoose from "mongoose";
import { PaymentModel } from "../../common/models/payment.model.js";
import { logger } from "../../common/config/logger.js";

const { Types } = mongoose;

// Creates a payment record for an order or as a standalone manual transaction
export const createPayment = async (req, res, next) => {
  try {
    const {
      orderId,
      paymentMethod,
      paymentPhone,
      paymentEmail,
      paymentDate,
      amount,
      paymentStatus: requestedPaymentStatus,
      status: directStatus,
      totalAmount: requestedTotalAmount,
      paidAmount: requestedPaidAmount,
      pendingAmount: requestedPendingAmount,
      notes,
    } = req.body ?? {};

    if (orderId && !Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ status: "error", message: "Invalid orderId" });
    }
    if (!paymentMethod || paymentMethod.trim() === "") {
      return res.status(400).json({ status: "error", message: "paymentMethod is required" });
    }
    if (amount === undefined || typeof amount !== "number" || amount < 0) {
      return res.status(400).json({ status: "error", message: "Valid amount is required" });
    }

    const totalAmount = Number(requestedTotalAmount ?? amount);
    const paidAmount = Number(requestedPaidAmount ?? amount);
    const pendingAmount = Number(requestedPendingAmount ?? Math.max(0, totalAmount - paidAmount));
    let rawStatus = (directStatus || requestedPaymentStatus || (paidAmount >= totalAmount ? "paid" : paidAmount > 0 ? "partial" : "pending"))
      .toString()
      .trim()
      .toLowerCase();
    const status = rawStatus === "completed" ? "paid" : rawStatus;

    const paymentData = {
      orderId: orderId || null,
      paymentMethod: paymentMethod.trim(),
      paymentPhone: paymentPhone?.trim() || "",
      paymentEmail: paymentEmail?.trim().toLowerCase() || "",
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      totalAmount,
      paidAmount,
      pendingAmount,
      amount,
      status,
      notes: notes?.trim() || "",
      createdBy: req.user?.userId || null,
    };

    const payment = await PaymentModel.create(paymentData);
    const populated = await PaymentModel.findById(payment._id).populate("orderId").lean();

    return res.status(201).json({
      status: "success",
      message: "Payment recorded successfully",
      data: populated || payment,
    });
  } catch (error) {
    logger.error({ error }, "Failed to create payment");
    next(error);
  }
};

// Lists payment records with date range and status filters
export const listPayments = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "50", 10)));
    const filter = {};

    if (req.query.orderId && Types.ObjectId.isValid(req.query.orderId)) {
      filter.orderId = req.query.orderId;
    }

    if (req.query.paymentMethod) {
      filter.paymentMethod = { $regex: `^${req.query.paymentMethod.toString().trim()}$`, $options: "i" };
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
      const dateField = req.query.dateField || "paymentDate";
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
          { paymentMethod: searchRegex },
          { paymentPhone: searchRegex },
          { paymentEmail: searchRegex },
          { notes: searchRegex },
        ];
      }
    }

    const total = await PaymentModel.countDocuments(filter);
    const payments = await PaymentModel.find(filter)
      .populate("orderId")
      .sort({ paymentDate: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const aggregateTotals = await PaymentModel.aggregate([
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
      data: payments,
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
    logger.error({ error }, "Failed to list payments");
    next(error);
  }
};

// Retrieves a payment record by database ID or did
export const getPaymentById = async (req, res, next) => {
  try {
    const { paymentId, id } = req.params;
    const targetId = paymentId || id;
    const query = Types.ObjectId.isValid(targetId) ? { _id: targetId } : { did: targetId };

    const payment = await PaymentModel.findOne(query).populate("orderId").lean();
    if (!payment) {
      return res.status(404).json({ status: "error", message: "Payment record not found" });
    }

    return res.json({ status: "success", data: payment });
  } catch (error) {
    next(error);
  }
};

// Updates a payment record
export const updatePayment = async (req, res, next) => {
  try {
    const { paymentId, id } = req.params;
    const targetId = paymentId || id;
    const query = Types.ObjectId.isValid(targetId) ? { _id: targetId } : { did: targetId };

    const payload = req.body ?? {};
    const allowedUpdates = {};

    if (payload.status) {
      const normalizedStatus = payload.status.trim().toLowerCase();
      allowedUpdates.status = normalizedStatus === "completed" ? "paid" : normalizedStatus;
    }
    if (payload.paymentMethod) {
      allowedUpdates.paymentMethod = payload.paymentMethod.trim();
    }
    if (payload.paymentPhone !== undefined) {
      allowedUpdates.paymentPhone = payload.paymentPhone.trim();
    }
    if (payload.paymentEmail !== undefined) {
      allowedUpdates.paymentEmail = payload.paymentEmail.trim().toLowerCase();
    }
    if (payload.paymentDate !== undefined) {
      allowedUpdates.paymentDate = payload.paymentDate ? new Date(payload.paymentDate) : new Date();
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

    const payment = await PaymentModel.findOneAndUpdate(query, allowedUpdates, {
      new: true,
      runValidators: true,
    })
      .populate("orderId")
      .lean();

    if (!payment) {
      return res.status(404).json({ status: "error", message: "Payment record not found" });
    }

    return res.json({ status: "success", data: payment });
  } catch (error) {
    next(error);
  }
};

// Deletes a payment record
export const deletePayment = async (req, res, next) => {
  try {
    const { paymentId, id } = req.params;
    const targetId = paymentId || id;
    const query = Types.ObjectId.isValid(targetId) ? { _id: targetId } : { did: targetId };

    const deletedPayment = await PaymentModel.findOneAndDelete(query).lean();
    if (!deletedPayment) {
      return res.status(404).json({ status: "error", message: "Payment record not found" });
    }

    return res.json({ status: "success", message: "Payment record deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// Updates status and financial amounts for a batch of payment records
export const bulkUpdatePayments = async (req, res, next) => {
  try {
    const { ids, orderIds, status } = req.body;

    if ((!ids || !Array.isArray(ids) || ids.length === 0) && (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0)) {
      return res.status(400).json({ status: "error", message: "No payment IDs or order IDs provided" });
    }
    if (!status) {
      return res.status(400).json({ status: "error", message: "status is required" });
    }

    const targetStatus = status.trim().toLowerCase();
    if (!["paid", "partial", "pending", "failed", "returned", "active", "cancelled"].includes(targetStatus)) {
      return res.status(400).json({ status: "error", message: "Invalid payment status" });
    }

    let filter = {};
    if (ids && Array.isArray(ids) && ids.length > 0) {
      const objectIds = ids.map((id) => (Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : null)).filter(Boolean);
      filter = {
        $or: [{ _id: { $in: objectIds } }, { did: { $in: ids } }],
      };
    } else if (orderIds && Array.isArray(orderIds) && orderIds.length > 0) {
      const objectIds = orderIds.map((id) => (Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : null)).filter(Boolean);
      filter = {
        orderId: { $in: objectIds },
      };
    }

    const payments = await PaymentModel.find(filter).lean();
    if (payments.length === 0) {
      return res.status(404).json({ status: "error", message: "No payments found to update" });
    }

    for (const payment of payments) {
      const totalAmount = payment.totalAmount || 0;
      let paidAmount = payment.paidAmount || 0;
      let pendingAmount = payment.pendingAmount || 0;

      if (targetStatus === "paid") {
        paidAmount = totalAmount;
        pendingAmount = 0;
      } else if (targetStatus === "pending" || targetStatus === "failed") {
        paidAmount = 0;
        pendingAmount = totalAmount;
      }

      await PaymentModel.findByIdAndUpdate(payment._id, {
        status: targetStatus,
        paidAmount,
        pendingAmount,
        amount: paidAmount,
        updatedBy: req.user?.userId || null,
      });
    }

    return res.json({ status: "success", message: "Payments updated successfully" });
  } catch (error) {
    logger.error({ error }, "Failed to bulk update payments");
    next(error);
  }
};

// Deletes a batch of payment records by their identifiers
export const bulkDeletePayments = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ status: "error", message: "No payment IDs provided" });
    }

    const objectIds = ids.map((id) => (Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : null)).filter(Boolean);
    const deleteQuery = {
      $or: [{ _id: { $in: objectIds } }, { did: { $in: ids } }],
    };

    const result = await PaymentModel.deleteMany(deleteQuery);
    return res.json({ status: "success", message: `${result.deletedCount} payment records deleted successfully` });
  } catch (error) {
    logger.error({ error }, "Failed to bulk delete payments");
    next(error);
  }
};
