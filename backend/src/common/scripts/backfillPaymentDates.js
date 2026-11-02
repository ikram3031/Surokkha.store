import mongoose from "mongoose";
import dotenv from "dotenv";
import { OrderModel } from "../models/order.model.js";
import { PaymentModel } from "../models/payment.model.js";
import { BillingModel } from "../models/billing.model.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ecommerce-db";

// Moves payments (and Pathao charge bills) of courier orders onto the day the parcel was sent to Pathao.
// Dry run by default; pass --apply to write.
export async function backfillPaymentDates({ apply = false } = {}) {
  await mongoose.connect(MONGODB_URI);
  try {
    const orders = await OrderModel.find({ "courier.dispatchedAt": { $ne: null } }).select("orderNumber courier.dispatchedAt").lean();
    let payments = 0;
    let bills = 0;
    for (const order of orders) {
      const dispatchedAt = order.courier.dispatchedAt;
      const paymentFilter = { orderId: order._id, paymentDate: { $ne: dispatchedAt } };
      const billFilter = { orderId: order._id, billingMethod: "pathao", billingDate: { $ne: dispatchedAt } };
      if (apply) {
        payments += (await PaymentModel.updateMany(paymentFilter, { $set: { paymentDate: dispatchedAt } })).modifiedCount;
        bills += (await BillingModel.updateMany(billFilter, { $set: { billingDate: dispatchedAt } })).modifiedCount;
      } else {
        payments += await PaymentModel.countDocuments(paymentFilter);
        bills += await BillingModel.countDocuments(billFilter);
      }
    }
    console.log(`[Payment Dates] ${apply ? "Updated" : "Would update"} ${payments} payment(s) and ${bills} Pathao bill(s) across ${orders.length} dispatched order(s).`);
  } finally {
    await mongoose.disconnect();
  }
}

if (process.argv[1]?.endsWith("backfillPaymentDates.js")) {
  backfillPaymentDates({ apply: process.argv.includes("--apply") }).then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
}
