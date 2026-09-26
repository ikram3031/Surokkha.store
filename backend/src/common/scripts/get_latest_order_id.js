import mongoose from "mongoose";
import { OrderModel } from "../models/order.model.js";

const MONGODB_URI = "mongodb://admin:11223345@144.79.218.126:27017/perfume-store?authSource=admin";

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    const latestOrder = await OrderModel.findOne().sort({ createdAt: -1 }).lean();
    if (latestOrder) {
      console.log("Latest Order Number:", latestOrder.orderNumber || latestOrder._id);
    } else {
      console.log("No orders found");
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
