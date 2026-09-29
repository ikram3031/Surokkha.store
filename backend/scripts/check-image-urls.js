/**
 * Script: Check Product Image URL Prefixes
 *
 * Products collection loop করে সব image-related ফিল্ড চেক করে
 * কতগুলো /src দিয়ে শুরু আর কতগুলো /uploads দিয়ে শুরু সেটা কাউন্ট করে।
 *
 * Usage: node scripts/check-image-urls.js
 * (backend/ folder থেকে run করতে হবে, .env সেখানে থাকতে হবে)
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI or DATABASE_URL not found in .env");
  process.exit(1);
}

await mongoose.connect(MONGO_URI);
console.log("✅ Connected to MongoDB\n");

const db = mongoose.connection.db;
const collection = db.collection("products");

const products = await collection.find({}).toArray();

let srcCount = 0;
let uploadsCount = 0;
let otherCount = 0;
let emptyCount = 0;

// Details tracking
const srcUrls = [];
const uploadsUrls = [];
const otherUrls = [];

function checkUrl(url, productName, fieldName) {
  if (!url || typeof url !== "string") {
    emptyCount++;
    return;
  }

  if (url.startsWith("/src")) {
    srcCount++;
    srcUrls.push({ product: productName, field: fieldName, url });
  } else if (url.startsWith("/uploads")) {
    uploadsCount++;
    uploadsUrls.push({ product: productName, field: fieldName, url });
  } else {
    otherCount++;
    otherUrls.push({ product: productName, field: fieldName, url });
  }
}

for (const product of products) {
  const name = product.name || product._id.toString();

  // Main imageUrl
  checkUrl(product.imageUrl, name, "imageUrl");

  // thumbnailUrl
  checkUrl(product.thumbnailUrl, name, "thumbnailUrl");

  // ogImage
  if (product.metaData?.ogImage) {
    checkUrl(product.metaData.ogImage, name, "metaData.ogImage");
  }

  // images[] array
  if (Array.isArray(product.images)) {
    product.images.forEach((img, i) => {
      checkUrl(img.url, name, `images[${i}].url`);
    });
  }

  // variants[] imageUrl
  if (Array.isArray(product.variants)) {
    product.variants.forEach((v, i) => {
      checkUrl(v.imageUrl, name, `variants[${i}].imageUrl`);
    });
  }
}

console.log("=" .repeat(60));
console.log(`📦 Total Products: ${products.length}`);
console.log("=" .repeat(60));
console.log(`\n🟢 /src দিয়ে শুরু:      ${srcCount}`);
console.log(`🔵 /uploads দিয়ে শুরু:  ${uploadsCount}`);
console.log(`🟡 অন্যান্য (other):     ${otherCount}`);
console.log(`⚪ Empty/null:           ${emptyCount}`);
console.log("");

if (srcUrls.length > 0) {
  console.log("─".repeat(60));
  console.log("🟢 /src URLs:");
  console.log("─".repeat(60));
  srcUrls.forEach((item) => {
    console.log(`  ${item.product} → ${item.field}: ${item.url}`);
  });
}

if (uploadsUrls.length > 0) {
  console.log("\n" + "─".repeat(60));
  console.log("🔵 /uploads URLs:");
  console.log("─".repeat(60));
  uploadsUrls.forEach((item) => {
    console.log(`  ${item.product} → ${item.field}: ${item.url}`);
  });
}

if (otherUrls.length > 0) {
  console.log("\n" + "─".repeat(60));
  console.log("🟡 Other URLs:");
  console.log("─".repeat(60));
  otherUrls.forEach((item) => {
    console.log(`  ${item.product} → ${item.field}: ${item.url}`);
  });
}

console.log("\n" + "=".repeat(60));
console.log("✅ Done!");

await mongoose.disconnect();
process.exit(0);
