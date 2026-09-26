import mongoose from "mongoose";
import { connectDatabase } from "../src/common/database/index.js";
import { OrderModel } from "../src/common/models/order.model.js";

async function runMigration() {
  try {
    console.log("Connecting to database...");
    await connectDatabase();
    console.log("Connected successfully. Running migration to set active = true on existing orders...");

    const result = await OrderModel.updateMany(
      { $or: [{ active: { $exists: false } }, { active: null }] },
      { $set: { active: true } }
    );

    console.log(`Migration completed successfully! Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

runMigration();
