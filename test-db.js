import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });
import { StoreSettingsModel } from './backend/src/common/models/storeSettings.model.js';
import { decryptText } from './backend/src/common/utils/crypto.util.js';

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27019/surokkha-db').then(async () => {
  const doc = await StoreSettingsModel.findOne({ key: 'default' }).lean();
  console.log('SMTP settings:', doc?.smtp);
  process.exit(0);
});
