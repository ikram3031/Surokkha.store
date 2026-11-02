import mongoose from "mongoose";
import dotenv from "dotenv";
import { OrderModel } from "../models/order.model.js";
import { PaymentModel } from "../models/payment.model.js";
import { courierPayoutDate } from "../helper/orderControllerHelper.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ecommerce-db";

// Moves payments of courier orders onto the day Pathao paid out (invoice date).
// Dry run by default; pass --apply to write.
export async function backfillPaymentDates({ apply = false } = {}) {
  await mongoose.connect(MONGODB_URI);
  try {
    const orders = await OrderModel.find({ "courier.settlement.status": { $in: ["invoiced", "settled"] } })
      .select("orderNumber courier.settlement")
      .lean();
    let payments = 0;
    for (const order of orders) {
      const payoutDate = courierPayoutDate(order);
      if (!payoutDate) continue;
      const filter = { orderId: order._id, paymentDate: { $ne: payoutDate } };
      payments += apply
        ? (await PaymentModel.updateMany(filter, { $set: { paymentDate: payoutDate } })).modifiedCount
        : await PaymentModel.countDocuments(filter);
    }
    console.log(`[Payment Dates] ${apply ? "Updated" : "Would update"} ${payments} payment(s) across ${orders.length} paid-out order(s).`);
  } finally {
    await mongoose.disconnect();
  }
}

if (process.argv[1]?.endsWith("backfillPaymentDates.js")) {
  backfillPaymentDates({ apply: process.argv.includes("--apply") }).then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
}
