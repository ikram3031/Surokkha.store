import mongoose from "mongoose";
import { StoreUtilsModel } from "../src/common/models/storeUtils.model.js";
import { env } from "../src/common/config/env.js";

async function ensureDefaultStoreUtils() {
  try {
    const mongoUri = env.MONGODB_URI || "mongodb://127.0.0.1:27017/DecantreBD";
    console.log("Connecting to MongoDB:", mongoUri);
    await mongoose.connect(mongoUri);

    const existing = await StoreUtilsModel.findOne({ key: "default" });
    if (!existing) {
      const created = await StoreUtilsModel.create({
        key: "default",
        featured: [],
        bestSeller: [],
      });
      console.log("✓ Default StoreUtils document created successfully:", created._id);
    } else {
      console.log("✓ Default StoreUtils document already exists:", existing._id);
    }

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  } catch (err) {
    console.error("Error ensuring StoreUtils document:", err);
    process.exit(1);
  }
}

ensureDefaultStoreUtils();
