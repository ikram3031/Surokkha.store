/**
 * Migration Script: Link Existing Bills to BillType Categories
 * 
 * This script finds billing records that have no `billTypeId` set
 * and attempts to match them to a BillType document by checking:
 *   1. Raw `billType` string field on the document (if present despite schema)
 *   2. `billingMethod` field as a fallback match
 *   3. `title` field as a last-resort match
 * 
 * Usage:
 *   node --experimental-modules scripts/link-bills-to-types.js
 *   
 * Or on production:
 *   MONGODB_URI=mongodb://... node scripts/link-bills-to-types.js
 * 
 * This script is idempotent — running it multiple times is safe.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../.env") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/perfume-store";

const run = async () => {
  console.log("=".repeat(60));
  console.log("Migration: Link Bills → BillType Categories");
  console.log("=".repeat(60));
  console.log(`Connecting to: ${MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, "//***:***@")}`);

  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const billTypesCollection = db.collection("billtypes");
  const billingsCollection = db.collection("billings");

  // Step 1: Load all bill types and build a lookup map (case-insensitive)
  const allBillTypes = await billTypesCollection.find({}).toArray();
  console.log(`\nFound ${allBillTypes.length} bill type categories:`);
  allBillTypes.forEach((bt) => console.log(`  • ${bt.name} (${bt._id})`));

  if (allBillTypes.length === 0) {
    console.log("\n⚠️  No bill types found. Nothing to link.");
    await mongoose.disconnect();
    process.exit(0);
  }

  // Build case-insensitive lookup map: name → _id
  const typeNameMap = {};
  allBillTypes.forEach((bt) => {
    typeNameMap[bt.name.trim().toLowerCase()] = bt._id;
  });

  // Step 2: Find all bills without billTypeId
  const unlinkedBills = await billingsCollection.find({
    $or: [
      { billTypeId: null },
      { billTypeId: { $exists: false } },
    ]
  }).toArray();

  console.log(`\nFound ${unlinkedBills.length} unlinked billing records.`);

  if (unlinkedBills.length === 0) {
    console.log("✅ All bills are already linked. Nothing to do.");
    await mongoose.disconnect();
    process.exit(0);
  }

  let linkedCount = 0;
  let skippedCount = 0;
  const unmatchedBills = [];

  for (const bill of unlinkedBills) {
    let matchedTypeId = null;
    let matchSource = "";

    // Strategy 1: Check raw `billType` field on the document (may exist despite schema)
    if (bill.billType && typeof bill.billType === "string") {
      const key = bill.billType.trim().toLowerCase();
      if (typeNameMap[key]) {
        matchedTypeId = typeNameMap[key];
        matchSource = `billType field: "${bill.billType}"`;
      }
    }

    // Strategy 2: Check `billingMethod` as category name match
    if (!matchedTypeId && bill.billingMethod && typeof bill.billingMethod === "string") {
      const key = bill.billingMethod.trim().toLowerCase();
      if (typeNameMap[key]) {
        matchedTypeId = typeNameMap[key];
        matchSource = `billingMethod field: "${bill.billingMethod}"`;
      }
    }

    // Strategy 3: Check `title` contains a bill type name
    if (!matchedTypeId && bill.title && typeof bill.title === "string") {
      const titleLower = bill.title.trim().toLowerCase();
      for (const [typeName, typeId] of Object.entries(typeNameMap)) {
        if (titleLower.includes(typeName) || typeName.includes(titleLower)) {
          matchedTypeId = typeId;
          matchSource = `title match: "${bill.title}" ↔ "${typeName}"`;
          break;
        }
      }
    }

    if (matchedTypeId) {
      await billingsCollection.updateOne(
        { _id: bill._id },
        { $set: { billTypeId: matchedTypeId } }
      );
      linkedCount++;
      console.log(`  ✅ Linked bill ${bill.did || bill._id} → ${matchSource}`);
    } else {
      skippedCount++;
      unmatchedBills.push({
        id: bill._id,
        did: bill.did,
        title: bill.title,
        billType: bill.billType || "(none)",
        billingMethod: bill.billingMethod || "(none)",
        totalAmount: bill.totalAmount,
      });
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`Results:`);
  console.log(`  ✅ Linked:   ${linkedCount} bills`);
  console.log(`  ⏭️  Skipped:  ${skippedCount} bills (no matching category found)`);

  if (unmatchedBills.length > 0) {
    console.log(`\n⚠️  Unmatched bills (need manual linking):`);
    unmatchedBills.forEach((b) => {
      console.log(`  • ${b.did || b.id} | title: "${b.title}" | billType: "${b.billType}" | method: "${b.billingMethod}" | ৳${b.totalAmount}`);
    });
    console.log(`\nTo manually link these, assign billTypeId in MongoDB or edit them from the dashboard.`);
  }

  console.log("=".repeat(60));
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
