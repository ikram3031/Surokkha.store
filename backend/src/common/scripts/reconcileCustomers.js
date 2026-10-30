// One-off cleanup of the customers collection against the orders collection.
//   node src/common/scripts/reconcileCustomers.js            -> dry run (changes nothing, prints a report)
//   node src/common/scripts/reconcileCustomers.js --apply    -> removes / fixes customers for real
// A customer is removed when it has no live order (pending/processing/hold/shipped/completed) left and was
// created from orders (not manual/import, no notes). Otherwise its order refs and totals are recomputed.
import fs from "node:fs";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { OrderModel } from "../models/order.model.js";
import { CustomerModel } from "../models/customer.model.js";
import { recomputeCustomerStats, isAutoRemovable } from "../services/customer.service.js";

const APPLY = process.argv.includes("--apply");
const REPORT_PATH = process.argv.find((a) => a.startsWith("--report="))?.slice("--report=".length) || "customer-reconcile-report.json";

async function main() {
  await mongoose.connect(env.MONGODB_URI, { dbName: env.MONGODB_DB_NAME });
  console.log(`${APPLY ? "APPLY" : "DRY RUN"} on ${env.MONGODB_DB_NAME}`);

  const report = { mode: APPLY ? "apply" : "dry-run", removed: [], kept: [], fixedTotals: [], untouched: 0 };
  const total = await CustomerModel.countDocuments();

  for await (const customer of CustomerModel.find()) {
    const before = { totalOrders: customer.totalOrders, totalSpent: customer.totalSpent };
    // relink only on --apply: a dry run must not write anything
    const { liveCount } = await recomputeCustomerStats(customer, { relink: APPLY });
    const label = { did: customer.did, name: [customer.firstName, customer.lastName].filter(Boolean).join(" "), phone: customer.phone, source: customer.source };

    if (liveCount === 0) {
      if (isAutoRemovable(customer)) {
        report.removed.push({ ...label, before });
        if (APPLY) {
          await OrderModel.updateMany({ customer: customer._id }, { $unset: { customer: "" } });
          await CustomerModel.deleteOne({ _id: customer._id });
        }
      } else {
        // Protected (manual/import/has notes): keep the record, just show the true totals
        report.kept.push({ ...label, reason: "manual/import or has notes", before });
        if (APPLY) await customer.save();
      }
      continue;
    }

    const after = { totalOrders: customer.totalOrders, totalSpent: customer.totalSpent };
    if (before.totalOrders !== after.totalOrders || before.totalSpent !== after.totalSpent) {
      report.fixedTotals.push({ ...label, before, after });
      if (APPLY) {
        // Orders that no longer count must not stay linked to this customer
        await OrderModel.updateMany(
          { customer: customer._id, _id: { $nin: customer.orders.map((o) => o.orderId) } },
          { $unset: { customer: "" } }
        );
        await customer.save();
      }
    } else {
      report.untouched++;
    }
  }

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(`Customers checked:        ${total}`);
  console.log(`To remove (no live order): ${report.removed.length}`);
  console.log(`Totals to fix:             ${report.fixedTotals.length}`);
  console.log(`Protected, kept:           ${report.kept.length}`);
  console.log(`Already correct:           ${report.untouched}`);
  console.log(`Full list written to ${REPORT_PATH}`);
  if (!APPLY) console.log("Nothing was changed. Re-run with --apply to make these changes.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Reconcile failed:", err);
  process.exit(1);
});
