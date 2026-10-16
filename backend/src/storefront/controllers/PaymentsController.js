import { syncPaymentDocument } from "../../common/helper/orderControllerHelper.js";
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

    // Route through the shared sync so the order and its single payment record stay in step
    // (no duplicate records, and none before the order has shipped)
    const orderDoc = await OrderModel.findById(resolvedOrderId).lean();
    if (!orderDoc) {
      return res.status(400).json({ status: "error", message: "Valid referenced order not found" });
    }
    if (paymentPhone) await OrderModel.findByIdAndUpdate(resolvedOrderId, { paymentPhone });
    await syncPaymentDocument(
      { ...orderDoc, ...(paymentMethod ? { paymentMethod } : {}), ...(paymentPhone ? { paymentPhone } : {}) },
      { paymentStatus: status || "pending", ...(amount !== undefined ? { paidAmount: Number(amount) } : {}) }
    );
    if (transactionId) await PaymentModel.updateOne({ orderId: resolvedOrderId }, { $set: { transactionId } });
    const payment = (await PaymentModel.findOne({ orderId: resolvedOrderId }).lean()) || {
      orderId: resolvedOrderId,
      status: status || "pending",
      note: "Recorded on the order; payment record opens when the order ships",
    };

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
