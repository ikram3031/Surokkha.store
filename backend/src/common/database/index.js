import mongoose from "mongoose";
import { env } from "../config/env.js";

const { ServerApiVersion } = mongoose.mongo;

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  console.log("Attempting MongoDB connection...");
  try {
    await mongoose.connect(env.MONGODB_URI, {
      dbName: env.MONGODB_DB_NAME,
      serverSelectionTimeoutMS: 3000,
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ Failed to connect to MongoDB:", err.message);
    throw err; // rethrow to let the app handle it
  }
}

export async function closeDatabase() {
  console.log("Closing MongoDB connection...");
  await mongoose.disconnect();
  console.log("MongoDB connection closed.");
}
