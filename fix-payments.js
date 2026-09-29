import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });
import { OrderModel } from './backend/src/common/models/order.model.js';
import { PaymentModel } from './backend/src/common/models/payment.model.js';

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27019/surokkha-db').then(async () => {
  const canceledOrders = await OrderModel.find({ status: { $in: ['canceled', 'cancelled'] } }).lean();
  console.log('Found ' + canceledOrders.length + ' canceled orders.');
  for (const order of canceledOrders) {
    await PaymentModel.findOneAndUpdate({ orderId: order._id }, { status: 'cancelled', paidAmount: 0, pendingAmount: 0, amount: 0 });
  }
  console.log('Done.');
  process.exit(0);
}).catch(console.error);
