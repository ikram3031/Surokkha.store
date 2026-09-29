import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment configuration
dotenv.config({ path: path.join(__dirname, "../../.env") });

const MONGODB_URI = process.env.MONGODB_URI;

// Define a simple Member schema for updating
const memberSchema = new mongoose.Schema({
  email: String,
  isEmailVerified: Boolean,
  createdAt: Date
}, { collection: 'members' });

const Member = mongoose.model('Member', memberSchema);

async function run() {
  if (!MONGODB_URI) {
    console.error("MONGODB_URI environment variable is missing.");
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected successfully!");

  // target date: 31st July 2026 (inclusive of the entire day in UTC+6/local, let's use 2026-07-31T23:59:59.999Z UTC/local)
  const targetDate = new Date("2026-07-31T23:59:59.999+06:00");
  console.log(`Resetting isEmailVerified to false for members created on or before: ${targetDate.toISOString()}`);

  const filter = { createdAt: { $lte: targetDate } };

  // Dry run / Count first
  const count = await Member.countDocuments(filter);
  console.log(`Found ${count} members matching the criteria.`);

  if (count > 0) {
    const result = await Member.updateMany(filter, { $set: { isEmailVerified: false } });
    console.log(`Updated successfully! Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
  } else {
    console.log("No members required updating.");
  }

  await mongoose.connection.close();
  console.log("Database connection closed.");
}

run().catch(async (err) => {
  console.error("Execution error:", err);
  await mongoose.connection.close();
});
