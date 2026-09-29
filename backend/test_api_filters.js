import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { buildProductFilter } from './src/core/utils/productUtils.js';
import { ProductModel } from './src/core/models/product.model.js';

dotenv.config();

async function runTest() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    const testCases = [
      {
        name: "Test 1: Category, Brand, Price Range, Sort (Newest)",
        query: {
          category: "niche",
          brand: "creed",
          min_price: "1000",
          max_price: "50000",
          sort: "newest"
        }
      },
      {
        name: "Test 2: Only Price Range",
        query: {
          min_price: "5000",
          max_price: "15000",
        }
      },
      {
        name: "Test 3: Only Brand",
        query: {
          brand: "paco-rabanne" // Using slug
        }
      }
    ];

    for (const test of testCases) {
      console.log(`\n--- ${test.name} ---`);
      const filter = await buildProductFilter(test.query);
      console.log("Generated Filter Object:");
      console.log(JSON.stringify(filter, null, 2));

      // Optional: count matching products
      const count = await ProductModel.countDocuments(filter);
      console.log(`Matching Products in DB: ${count}`);
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB.");
  }
}

runTest();
