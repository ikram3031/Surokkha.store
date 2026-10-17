import mongoose from "mongoose";
import { PaymentModel } from "../../common/models/payment.model.js";
import { OrderModel } from "../../common/models/order.model.js";

const { Types } = mongoose;

// Create Payment from customer checkout
export const createPayment = async (req, res, next) => {
  try {
    const payload = req.body || {};
    const { orderId, amount, paymentMethod, paymentPhone, transactionId, status } = payload;

    if (!orderId) {
      return res.status(400).json({ status: "error", message: "orderId is required" });
    }

    let resolvedOrderId = null;
    if (Types.ObjectId.isValid(orderId)) {
      resolvedOrderId = new Types.ObjectId(orderId);
    } else {
      const order = await OrderModel.findOne({
        $or: [{ did: orderId }, { orderNumber: orderId }]
      }).lean();
      if (order) resolvedOrderId = order._id;
    }

    if (!resolvedOrderId) {
      return res.status(400).json({ status: "error", message: "Valid referenced order not found" });
    }

    const orderDoc = await OrderModel.findById(resolvedOrderId).lean();
    // Full order total, same basis as syncPaymentDocument.
    const totalAmount = Number(orderDoc?.totals?.total ?? amount ?? 0);
    const paidAmount = status === "paid" ? totalAmount : 0;

    // Upsert: order creation already made the payment record, so don't duplicate it.
    const payment = await PaymentModel.findOneAndUpdate(
      { orderId: resolvedOrderId },
      {
        orderId: resolvedOrderId,
        amount: paidAmount,
        totalAmount,
        paidAmount,
        pendingAmount: Math.max(0, totalAmount - paidAmount),
        paymentMethod: paymentMethod || orderDoc?.paymentMethod || "Cash on Delivery",
        paymentPhone: paymentPhone || "",
        transactionId: transactionId || "",
        status: status || "pending",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    if (orderDoc) {
      await OrderModel.findByIdAndUpdate(resolvedOrderId, { paidAmount, paymentStatus: status || "pending" });
    }

    return res.status(201).json({ status: "success", data: payment });
  } catch (err) {
    next(err);
  }
};

// Retrieve payment details by ID
export const getPaymentById = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    let query = {};
    if (Types.ObjectId.isValid(paymentId)) {
      query = { $or: [{ _id: paymentId }, { orderId: paymentId }] };
    } else {
      query = { did: paymentId };
    }

    const payment = await PaymentModel.findOne(query).lean();
    if (!payment) {
      return res.status(404).json({ status: "error", message: "Payment not found" });
    }

    return res.json({ status: "success", data: payment });
  } catch (err) {
    next(err);
  }
};
