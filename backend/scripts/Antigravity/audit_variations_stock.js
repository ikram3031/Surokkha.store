import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "perfume-store";

const productSchema = new mongoose.Schema({}, { strict: false, collection: "products" });
const Product = mongoose.model("Product", productSchema);

async function run() {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB_NAME });
    console.log("Connected to MongoDB.");

    const products = await Product.find({ type: "variant" }).lean();
    let totalVariantsCount = 0;
    let zeroStockVariantsCount = 0;
    let nonZeroStockVariantsCount = 0;

    products.forEach(p => {
      if (p.variants && p.variants.length > 0) {
        p.variants.forEach(v => {
          totalVariantsCount++;
          if (v.stockQuantity === 0 || v.stockQuantity === undefined || v.stockQuantity === null) {
            zeroStockVariantsCount++;
          } else {
            nonZeroStockVariantsCount++;
          }
        });
      }
    });

    console.log(`Total variable products checked: ${products.length}`);
    console.log(`Total variants checked: ${totalVariantsCount}`);
    console.log(`Variants with zero or undefined stock: ${zeroStockVariantsCount}`);
    console.log(`Variants with non-zero stock: ${nonZeroStockVariantsCount}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
