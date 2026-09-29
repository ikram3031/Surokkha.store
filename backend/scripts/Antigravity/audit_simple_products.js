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

    const simpleProducts = await Product.find({ type: "simple" }).lean();
    console.log(`Found ${simpleProducts.length} simple products:`);
    simpleProducts.forEach(p => {
      console.log(`- Name: ${p.name}`);
      console.log(`  StockStatus: ${p.stockStatus}`);
      console.log(`  StockQuantity: ${p.stockQuantity}`);
      console.log(`  Price: ${p.price}`);
      console.log(`  OfferPrice: ${p.offerPrice}`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
