import mongoose from "mongoose";
import { OrderModel } from "../models/order.model.js";

import dotenv from "dotenv";
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ecommerce-db";

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
