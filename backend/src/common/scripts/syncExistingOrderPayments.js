import mongoose from "mongoose";
import dotenv from "dotenv";
import { OrderModel } from "../models/order.model.js";
import { PaymentModel } from "../models/payment.model.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ecommerce-db";

export async function syncAllOrderPayments(customUri = null) {
  const uri = customUri || MONGODB_URI;
  console.log(`[Payment Sync] Connecting to database: ${uri}`);

  let didConnect = false;
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(uri);
    didConnect = true;
  }

  try {
    const payments = await PaymentModel.find({ orderId: { $ne: null } }).lean();
    console.log(`[Payment Sync] Found ${payments.length} payment records linked to orders.`);

    let updatedCount = 0;
    for (const payment of payments) {
      if (!payment.orderId) continue;
      const order = await OrderModel.findById(payment.orderId).lean();
      if (!order) continue;

      const pStatus = payment.status?.toLowerCase() || "pending";
      const paidAmount = Number(payment.paidAmount || 0);
      const paymentPhone = payment.paymentPhone || "";

      const updateData = {};
      if (order.paymentStatus !== pStatus) {
        updateData.paymentStatus = pStatus;
      }
      if (order.paidAmount !== paidAmount) {
        updateData.paidAmount = paidAmount;
      }
      if (paymentPhone && order.paymentPhone !== paymentPhone) {
        updateData.paymentPhone = paymentPhone;
      }

      if (Object.keys(updateData).length > 0) {
        await OrderModel.findByIdAndUpdate(order._id, updateData);
        updatedCount++;
        console.log(`[Payment Sync] Updated order #${order.orderNumber || order._id}: status=${pStatus}, paid=${paidAmount}`);
      }
    }

    console.log(`[Payment Sync] Completed successfully. Synced ${updatedCount} order(s).`);
  } catch (err) {
    console.error("[Payment Sync] Error syncing payments to orders:", err);
  } finally {
    if (didConnect) {
      await mongoose.disconnect();
    }
  }
}

if (process.argv[1]?.endsWith("syncExistingOrderPayments.js")) {
  syncAllOrderPayments().then(() => process.exit(0)).catch(() => process.exit(1));
}
