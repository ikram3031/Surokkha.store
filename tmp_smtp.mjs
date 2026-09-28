import mongoose from 'mongoose';
import { StoreSettingsModel } from './src/common/models/storeSettings.model.js';
import { encryptText } from './src/common/utils/crypto.util.js';
import { env } from './src/common/config/env.js';

async function run() {
  await mongoose.connect(env.MONGODB_URI);
  const encryptedPassword = encryptText('P@ss0265');
  const updatePayload = {
    'smtp.host': 'smtp.hostinger.com',
    'smtp.port': 465,
    'smtp.secure': true,
    'smtp.user': 'support@surokkha.store',
    'smtp.password': encryptedPassword,
    'smtp.senderName': 'Surokkha',
    'smtp.senderEmail': 'support@surokkha.store',
    'smtp.isEnabled': true,
    'imap.host': 'imap.hostinger.com',
    'imap.port': 993,
    'imap.secure': true,
    'imap.user': 'support@surokkha.store',
    'imap.password': encryptedPassword,
    'imap.isEnabled': true
  };
  await StoreSettingsModel.findOneAndUpdate({ key: 'default' }, { $set: updatePayload }, { upsert: true });
  console.log('Live SMTP Updated');
  process.exit(0);
}
run();
