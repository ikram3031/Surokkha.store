import { getPathaoAreas } from './src/common/services/pathao.service.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/surokkha');
  
  try {
    const areas = await getPathaoAreas(100);
    console.log("Areas for Feni Sadar (100):");
    console.log(JSON.stringify(areas, null, 2));
  } catch (error) {
    console.log("Error:", error.message);
  }

  mongoose.disconnect();
}

run();
