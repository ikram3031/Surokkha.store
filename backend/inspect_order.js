import mongoose from 'mongoose';
import { OrderModel } from './src/common/models/order.model.js';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/surokkha');
  const orderId = '6ac444a1f2e85599c3942a6e';
  
  const order = await OrderModel.findById(orderId).lean();
  console.log('Order found:', order != null);
  if (order) {
    console.log(JSON.stringify({
      totals: order.totals,
      totalAmount: order.totalAmount,
      paidAmount: order.paidAmount,
      paymentStatus: order.paymentStatus,
      paymentDetails: order.paymentDetails,
      paymentMethod: order.paymentMethod,
      status: order.status
    }, null, 2));
  }
  
  mongoose.disconnect();
}

run().catch(console.error);
