import mongoose from "mongoose";
import { OrderModel } from "../models/order.model.js";
import { upsertCustomerFromOrder } from "../services/customer.service.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/surokkha";

async function syncAllCustomers() {
  try {
    console.log(`Connecting to MongoDB: ${MONGO_URI}`);
    await mongoose.connect(MONGO_URI);

    const orders = await OrderModel.find({ active: { $ne: false } }).sort({ createdAt: 1 });
    console.log(`Found ${orders.length} orders to process...`);

    let processed = 0;
    for (const order of orders) {
      await upsertCustomerFromOrder({
        order,
        payload: {},
        updatedBy: "historical_backfill",
      });
      processed++;
    }

    const Customer = mongoose.model("Customer");
    const totalCustomers = await Customer.countDocuments();
    console.log(`Successfully processed ${processed} orders. Total customers in collection: ${totalCustomers}`);
    process.exit(0);
  } catch (err) {
    console.error("Failed to sync customers from orders:", err);
    process.exit(1);
  }
}

syncAllCustomers();
