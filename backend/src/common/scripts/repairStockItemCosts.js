import mongoose from "mongoose";
import dotenv from "dotenv";
import { StockItemModel } from "../models/stockItem.model.js";
import { StockReceiptModel } from "../models/stockReceipt.model.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ecommerce-db";
const round6 = (n) => Math.round((Number(n) || 0) * 1e6) / 1e6;
const close = (a, b) => Math.abs((Number(a) || 0) - (Number(b) || 0)) < 0.01;

// Stock item costs used to be saved rounded to 2 decimals (৳70 / 3 → 23.33), so 9 pcs showed ৳209.97 instead of ৳210.
// This puts back the exact per-unit cost from the Plexivia receipts, and resets numeric units (e.g. "10") to "pcs".
// Only costs that are within 1 paisa of the receipt figure are touched. Dry run by default; pass --apply to write.
export async function repairStockItemCosts({ apply = false } = {}) {
  await mongoose.connect(MONGODB_URI);
  try {
    const receipts = await StockReceiptModel.find({ status: "received", version: { $gt: 0 } })
      .select("lines receivedAt createdAt")
      .sort({ receivedAt: 1, createdAt: 1 })
      .lean();
    const all = new Map();
    const last = new Map();
    for (const r of receipts) {
      const perReceipt = new Map();
      for (const l of r.lines || []) {
        const key = String(l.stockItemId);
        for (const map of [all, perReceipt]) {
          const cur = map.get(key) || { units: 0, total: 0 };
          map.set(key, { units: cur.units + (Number(l.units) || 0), total: cur.total + (Number(l.total) || 0) });
        }
      }
      for (const [key, v] of perReceipt) last.set(key, v);
    }

    const items = await StockItemModel.find({}).select("shortName unit avgCost lastCost").lean();
    let changed = 0;
    for (const item of items) {
      const key = String(item._id);
      const set = {};
      const sum = all.get(key);
      const latest = last.get(key);
      if (sum?.units) {
        const exact = round6(sum.total / sum.units);
        if (exact !== item.avgCost && close(exact, item.avgCost)) set.avgCost = exact;
      }
      if (latest?.units) {
        const exact = round6(latest.total / latest.units);
        if (exact !== item.lastCost && close(exact, item.lastCost)) set.lastCost = exact;
      }
      if (/^\d+(\.\d+)?$/.test(String(item.unit || "").trim())) set.unit = "pcs";
      if (!Object.keys(set).length) continue;
      changed += 1;
      console.log(`[Stock Costs] ${item.shortName}: ${JSON.stringify(set)}`);
      if (apply) await StockItemModel.updateOne({ _id: item._id }, { $set: set });
    }
    console.log(`[Stock Costs] ${apply ? "Updated" : "Would update"} ${changed} of ${items.length} stock item(s).`);
  } finally {
    await mongoose.disconnect();
  }
}

if (process.argv[1]?.endsWith("repairStockItemCosts.js")) {
  repairStockItemCosts({ apply: process.argv.includes("--apply") }).then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
}
