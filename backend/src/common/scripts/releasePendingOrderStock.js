import mongoose from "mongoose";
import dotenv from "dotenv";
import { OrderModel } from "../models/order.model.js";
import { syncOrderStock } from "../services/stock.service.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ecommerce-db";

// Online orders used to take stock out as soon as they were placed. Now they take it out only when shipped.
// This puts back the stock of online orders that are still waiting (pending / processing / hold); they take it
// out again when they are shipped. In-store orders are left alone. Dry run by default; pass --apply to write.
export async function releasePendingOrderStock({ apply = false } = {}) {
  await mongoose.connect(MONGODB_URI);
  try {
    const orders = await OrderModel.find({
      stockStage: "deducted",
      status: { $in: ["pending", "processing", "hold"] },
      orderType: { $ne: "instore" },
    })
      .select("orderNumber status orderType stockLedger")
      .sort({ createdAt: 1 })
      .lean();

    for (const o of orders) {
      const ledger = (o.stockLedger || []).map((r) => `${r.name || r.refId} x${r.quantity}`).join(", ") || "nothing";
      console.log(`[Release Stock] ${o.orderNumber} (${o.status}): ${ledger}`);
      if (apply) await syncOrderStock(o, { actor: "system" });
    }
    console.log(`[Release Stock] ${apply ? "Released" : "Would release"} stock for ${orders.length} order(s).`);
  } finally {
    await mongoose.disconnect();
  }
}

if (process.argv[1]?.endsWith("releasePendingOrderStock.js")) {
  releasePendingOrderStock({ apply: process.argv.includes("--apply") }).then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
}
