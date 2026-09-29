import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "perfume-store";

console.log("URI:", MONGODB_URI);
console.log("DB Name:", MONGODB_DB_NAME);

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not set in backend/.env");
  process.exit(1);
}

const productSchema = new mongoose.Schema({}, { strict: false, collection: "products" });
const Product = mongoose.model("Product", productSchema);

async function run() {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB_NAME });
    console.log("Connected to MongoDB.");

    const totalProducts = await Product.countDocuments();
    const simpleProducts = await Product.countDocuments({ type: "simple" });
    const variantProducts = await Product.countDocuments({ type: "variant" });

    console.log(`Total Products: ${totalProducts}`);
    console.log(`Simple Products: ${simpleProducts}`);
    console.log(`Variant Products: ${variantProducts}`);

    // Audit out-of-stock count
    const outOfStockRoot = await Product.countDocuments({ stockStatus: "outofstock" });
    const inStockRoot = await Product.countDocuments({ stockStatus: "instock" });
    console.log(`Root Stock Status - Instock: ${inStockRoot}, Out of Stock: ${outOfStockRoot}`);

    // Sample of some variant products to see stockStatus and variations stockQuantity
    const sampleVariants = await Product.find({ type: "variant" }).limit(10).lean();
    console.log("\nSample of Variant Products:");
    sampleVariants.forEach(p => {
      console.log(`- Product Name: ${p.name}`);
      console.log(`  Root StockStatus: ${p.stockStatus}`);
      if (p.variants && p.variants.length > 0) {
        console.log("  Variants:");
        p.variants.forEach(v => {
          console.log(`    * Size: ${v.size}, Price: ${v.price}, StockQty: ${v.stockQuantity}`);
        });
      } else {
        console.log("  No variants array found!");
      }
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error during audit:", error);
  }
}

run();
