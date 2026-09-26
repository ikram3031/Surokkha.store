import mongoose from "mongoose";
import { PaymentModel } from "../../common/models/payment.model.js";
import { logger } from "../../common/config/logger.js";

const { Types } = mongoose;

// Create Payment
export const createPayment = async (req, res, next) => {
  try {
    const {
      orderId,
      paymentMethod,
      paymentPhone,
      amount,
      paymentStatus: requestedPaymentStatus,
      totalAmount: requestedTotalAmount,
      paidAmount: requestedPaidAmount,
      pendingAmount: requestedPendingAmount,
    } = req.body ?? {};

    if (!orderId || !Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ status: "error", message: "Invalid or missing orderId" });
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
    const status = (requestedPaymentStatus || (paidAmount >= totalAmount ? "paid" : paidAmount > 0 ? "partial" : "pending")).toString().trim().toLowerCase();

    const paymentData = {
      orderId,
      paymentMethod: paymentMethod.trim(),
      paymentPhone: paymentPhone?.trim() || "",
      totalAmount,
      paidAmount,
      pendingAmount,
      amount,
      status,
      createdBy: req.user?.userId || null,
    };

    const payment = await PaymentModel.create(paymentData);

    return res.status(201).json({
      status: "success",
      message: "Payment recorded successfully",
      data: payment,
    });
  } catch (error) {
    logger.error({ error }, "Failed to create payment");
    next(error);
  }
};

// List Payments
export const listPayments = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "20", 10)));
    const filter = {};

    if (req.query.orderId && Types.ObjectId.isValid(req.query.orderId)) {
      filter.orderId = req.query.orderId;
    }

    if (req.query.paymentMethod) {
      filter.paymentMethod = { $regex: `^${req.query.paymentMethod.toString().trim()}$`, $options: "i" };
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
          { paymentMethod: searchRegex },
          { paymentPhone: searchRegex },
        ];
      }
    }

    const total = await PaymentModel.countDocuments(filter);
    const payments = await PaymentModel.find(filter)
      .populate("orderId")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return res.json({
      status: "success",
      data: payments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error({ error }, "Failed to list payments");
    next(error);
  }
};

// Get Payment By ID
export const getPaymentById = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    if (!Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({ status: "error", message: "Invalid payment ID" });
    }

    const payment = await PaymentModel.findById(paymentId).populate("orderId").lean();
    if (!payment) {
      return res.status(404).json({ status: "error", message: "Payment record not found" });
    }

    return res.json({ status: "success", data: payment });
  } catch (error) {
    next(error);
  }
};

// Update Payment
export const updatePayment = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    if (!Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({ status: "error", message: "Invalid payment ID" });
    }

    const payload = req.body ?? {};
    const allowedUpdates = {};

    if (payload.status) {
      allowedUpdates.status = payload.status;
    }
    if (payload.paymentMethod) {
      allowedUpdates.paymentMethod = payload.paymentMethod.trim();
    }
    if (payload.paymentPhone !== undefined) {
      allowedUpdates.paymentPhone = payload.paymentPhone.trim();
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

    const payment = await PaymentModel.findByIdAndUpdate(paymentId, allowedUpdates, {
      new: true,
      runValidators: true,
    }).lean();

    if (!payment) {
      return res.status(404).json({ status: "error", message: "Payment record not found" });
    }

    return res.json({ status: "success", data: payment });
  } catch (error) {
    next(error);
  }
};

// Delete Payment
export const deletePayment = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    if (!Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({ status: "error", message: "Invalid payment ID" });
    }

    const deletedPayment = await PaymentModel.findByIdAndDelete(paymentId).lean();
    if (!deletedPayment) {
      return res.status(404).json({ status: "error", message: "Payment record not found" });
    }

    return res.json({ status: "success", message: "Payment record deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// Bulk Update Payments status and amounts.
// This allows updating multiple payment records either by their direct payment IDs or by associated order IDs.
export const bulkUpdatePayments = async (req, res, next) => {
  try {
    const { ids, orderIds, status } = req.body;

    // Ensure we have at least one valid array of targets (payment IDs or order IDs)
    if ((!ids || !Array.isArray(ids) || ids.length === 0) && (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0)) {
      return res.status(400).json({ status: "error", message: "No payment IDs or order IDs provided" });
    }
    if (!status) {
      return res.status(400).json({ status: "error", message: "status is required" });
    }

    // Validate the target payment status
    const targetStatus = status.trim().toLowerCase();
    if (!["paid", "partial", "pending", "failed"].includes(targetStatus)) {
      return res.status(400).json({ status: "error", message: "Invalid payment status" });
    }

    // Build the query filter based on the provided IDs
    let filter = {};
    if (ids && Array.isArray(ids) && ids.length > 0) {
      // Map valid ObjectIds or use string-based did identifier
      const objectIds = ids.map(id => Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : null).filter(Boolean);
      filter = {
        $or: [
          { _id: { $in: objectIds } },
          { did: { $in: ids } }
        ]
      };
    } else if (orderIds && Array.isArray(orderIds) && orderIds.length > 0) {
      // Map valid associated Order ObjectIds
      const objectIds = orderIds.map(id => Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : null).filter(Boolean);
      filter = {
        orderId: { $in: objectIds }
      };
    }

    // Find all payment records matching our query filter
    const payments = await PaymentModel.find(filter).lean();
    if (payments.length === 0) {
      return res.status(404).json({ status: "error", message: "No payments found to update" });
    }

    // Loop through each payment record to compute new totals and perform updates
    for (const payment of payments) {
      const totalAmount = payment.totalAmount || 0;
      let paidAmount = payment.paidAmount || 0;
      let pendingAmount = payment.pendingAmount || 0;

      // Recalculate paid and pending values according to the target status
      if (targetStatus === "paid") {
        paidAmount = totalAmount;
        pendingAmount = 0;
      } else if (targetStatus === "pending" || targetStatus === "failed") {
        paidAmount = 0;
        pendingAmount = totalAmount;
      }

      // Update the database document
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

// Bulk Delete Payments
export const bulkDeletePayments = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ status: "error", message: "No payment IDs provided" });
    }

    const objectIds = ids.map((id) => (Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : null)).filter(Boolean);
    const deleteQuery = {
      $or: [
        { _id: { $in: objectIds } },
        { did: { $in: ids } }
      ]
    };

    const result = await PaymentModel.deleteMany(deleteQuery);
    return res.json({ status: "success", message: `${result.deletedCount} payment records deleted successfully` });
  } catch (error) {
    logger.error({ error }, "Failed to bulk delete payments");
    next(error);
  }
};


