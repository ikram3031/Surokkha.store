import { createPathaoOrder, testPathaoConnection } from './src/common/services/pathao.service.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/surokkha');
  
  const payload = {
      store_id: 381917,
      merchant_order_id: "SH2610007",
      recipient_name: "Sumon",
      recipient_phone: "01601671653",
      recipient_address: "Barahipur",
      recipient_city: 6,
      recipient_zone: 100,
      delivery_type: 48,
      item_type: 2,
      special_instruction: "",
      item_quantity: 1,
      item_weight: 0.5,
      amount_to_collect: 470,
      item_description: "MO Micro-Thin Latex Contraceptive (10 Pcs) (x1)"
  };

  try {
    const result = await createPathaoOrder(payload);
    console.log("Success:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.log("Error status:", error.status);
    console.log("Error message:", error.message);
    if (error.data) {
        console.log("Error data:", JSON.stringify(error.data, null, 2));
    }
  }

  mongoose.disconnect();
}

run();
