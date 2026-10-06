import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getOrderById } from './src/service/controllers/OrdersController.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/surokkha');
  
  const req = { params: { orderId: '6ac444a1f2e85599c3942a6e' } };
  const res = {
    json: (data) => console.log(JSON.stringify(data, null, 2)),
    status: (code) => ({ json: (data) => console.log('Status', code, JSON.stringify(data, null, 2)) })
  };
  const next = (err) => console.error('Next error:', err);
  
  await getOrderById(req, res, next);
  
  mongoose.disconnect();
}

run().catch(console.error);
