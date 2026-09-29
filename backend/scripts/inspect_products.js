import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({ path: "./.env" });

async function main() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/perfume-store";
  const dbName = process.env.MONGODB_DB_NAME || "perfume-store";
  console.log("Connecting to:", uri, "DB:", dbName);
  await mongoose.connect(uri, { dbName });
  
  const products = await mongoose.connection.db.collection("products").find({}).toArray();
  console.log("Total products count:", products.length);
  
  const categories = await mongoose.connection.db.collection("categories").find({}).toArray();
  console.log("Categories:", categories.map(c => ({ _id: c._id, name: c.name, slug: c.slug })));

  console.log("\n=== ALL PRODUCTS ===");
  products.forEach((p, idx) => {
    console.log(`\nProduct #${idx + 1}:`);
    console.log("ID:", p._id);
    console.log("Name:", p.name);
    console.log("Slug:", p.slug);
    console.log("Type:", p.type);
    console.log("Price:", p.price, "OfferPrice:", p.offerPrice);
    console.log("Categories:", p.categories);
    console.log("Has specifications:", !!p.specifications);
    console.log("Has benefits:", !!p.benefits);
    console.log("Has bn:", !!p.bn);
    console.log("Current bn:", JSON.stringify(p.bn, null, 2));
  });

  await mongoose.disconnect();
}

main().catch(console.error);
