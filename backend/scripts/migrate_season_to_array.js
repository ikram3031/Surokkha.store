import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined");
  process.exit(1);
}

async function runMigration() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const collection = db.collection("products");

  // 1. Find all products where season is string (BSON type 2)
  const cursor = collection.find({ season: { $type: "string" } });
  let stringCount = 0;

  for await (const doc of cursor) {
    let seasonArray = ["All-Season"];
    if (doc.season && typeof doc.season === "string" && doc.season.trim()) {
      seasonArray = doc.season
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (seasonArray.length === 0) seasonArray = ["All-Season"];
    }
    await collection.updateOne(
      { _id: doc._id },
      { $set: { season: seasonArray } }
    );
    stringCount++;
  }

  // 2. Handle any products where season is null, missing, or empty array
  const emptyCursor = collection.find({
    $or: [{ season: null }, { season: { $exists: false } }, { season: [] }],
  });
  let emptyCount = 0;
  for await (const doc of emptyCursor) {
    await collection.updateOne(
      { _id: doc._id },
      { $set: { season: ["All-Season"] } }
    );
    emptyCount++;
  }

  console.log(
    `✅ Migration completed successfully! Updated ${stringCount} string-season products and ${emptyCount} empty/missing-season products.`
  );

  const remainingStrings = await collection.countDocuments({
    season: { $type: "string" },
  });
  const totalArrays = await collection.countDocuments({
    season: { $type: "array" },
  });
  console.log(
    `📊 Verification: Remaining string-season docs: ${remainingStrings}, Total array-season docs: ${totalArrays}`
  );

  await mongoose.disconnect();
}

runMigration().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
