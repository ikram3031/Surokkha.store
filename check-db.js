import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });
import { OrderModel } from './backend/src/common/models/order.model.js';
import { PaymentModel } from './backend/src/common/models/payment.model.js';

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27019/surokkha-db').then(async () => {
  const o = await OrderModel.findOne({ orderNumber: 'PX2609001' }).lean();
  console.log('Order:', o._id, o.status);
  const p = await PaymentModel.findOne({ orderId: o._id }).lean();
  console.log('Payment:', p?.status, p?.paidAmount);
  process.exit(0);
}).catch(console.error);
